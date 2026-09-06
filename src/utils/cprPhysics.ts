/**
 * CPR & Electrical Resuscitation Physics Engine
 *
 * Standards & References:
 * - AHA BLS 2020-2025 Guidelines
 * - ERC 2021-2025 Resuscitation Guidelines
 * - IEC 60479-1:2018 (Effects of current on human beings)
 * - IEC 60601-2-4 (Particular requirements for the basic safety and essential performance of cardiac defibrillators)
 */

// ============================================================================
// 1. BIOMECHANICAL VISCOELASTIC CHEST WALL PHYSICS (Kelvin-Voigt / Hunt-Crossley)
// ============================================================================

export interface ChestWallParameters {
  k1: number; // Linear ribcage elasticity (N/cm) ~ 35 N/cm
  k2: number; // Nonlinear sternal stiffening coefficient (N/cm^3) ~ 1.8 N/cm^3
  damping: number; // Viscoelastic damping coefficient (N*s/cm) ~ 4.2 N*s/cm
}

export const DEFAULT_CHEST_PARAMS: ChestWallParameters = {
  k1: 35.0,
  k2: 1.85,
  damping: 4.2,
};

/**
 * Calculates instantaneous chest wall resistance force (Newtons)
 * F = k1 * x + k2 * x^3 + c * v
 * As depth approaches 5-6 cm, resistance force increases nonlinearly to ~400-550 N (~40-55 kgf).
 */
export function calculateChestResistance(
  depthCm: number,
  velocityCmS: number = 0,
  params: ChestWallParameters = DEFAULT_CHEST_PARAMS
): { forceNewtons: number; stiffnessNPerCm: number } {
  const x = Math.max(0, depthCm);
  // Tangent stiffness: dF_elastic/dx = k1 + 3 * k2 * x^2
  const stiffness = params.k1 + 3 * params.k2 * Math.pow(x, 2);
  const elasticForce = params.k1 * x + params.k2 * Math.pow(x, 3);
  const dampingForce = params.damping * velocityCmS;
  const totalForce = Math.max(0, elasticForce + dampingForce);

  return {
    forceNewtons: Number(totalForce.toFixed(1)),
    stiffnessNPerCm: Number(stiffness.toFixed(1)),
  };
}

/**
 * Simulates recoil hysteresis with viscoelastic lag (ms)
 * Incomplete release (leaning) prevents elastic recoil to 0 cm.
 */
export function calculateRecoilDepth(
  targetDepthCm: number,
  currentDepthCm: number,
  dt: number,
  recoilSpeedFactor: number = 18.0
): number {
  const diff = targetDepthCm - currentDepthCm;
  return currentDepthCm + diff * (1 - Math.exp(-recoilSpeedFactor * dt));
}

// ============================================================================
// 2. HEMODYNAMIC & CORONARY PERFUSION PRESSURE (CPP) ENGINE
// ============================================================================

export interface HemodynamicState {
  aorticPressureSystolic: number; // mmHg (peak during compression)
  aorticPressureDiastolic: number; // mmHg (trough between compressions)
  rightAtrialPressure: number; // mmHg (typically 8-12 mmHg during CPR)
  coronaryPerfusionPressure: number; // CPP = Aortic_diastolic - RA_diastolic (mmHg)
  cerebralPerfusionPct: number; // % of normal resting brain perfusion (0 - 100%)
  strokeCountSincePause: number; // Uninterrupted compressions counter
  lastCompressionTimestamp: number; // Epoch ms
  cardiacOutputLpm: number; // Estimated L/min (normal ~5 L/min; CPR ~1.2-1.5 L/min)
}

export const INITIAL_HEMODYNAMICS: HemodynamicState = {
  aorticPressureSystolic: 15,
  aorticPressureDiastolic: 8,
  rightAtrialPressure: 8,
  coronaryPerfusionPressure: 0,
  cerebralPerfusionPct: 0,
  strokeCountSincePause: 0,
  lastCompressionTimestamp: 0,
  cardiacOutputLpm: 0,
};

/**
 * Updates hemodynamic differential state on each physics frame or compression event.
 *
 * Clinical Rule (AHA/ERC):
 * - It takes ~15-20 consecutive compressions of adequate depth (5-6 cm) to build
 *   Coronary Perfusion Pressure (CPP) above 15 mmHg (the critical threshold for ROSC).
 * - When compressions stop, aortic diastolic pressure decays exponentially with tau ~ 2.4s.
 */
export function stepHemodynamics(
  current: HemodynamicState,
  dtSeconds: number,
  recentCompression: boolean,
  depthCm: number = 0,
  rateBpm: number = 110
): HemodynamicState {
  const next = { ...current };
  const TAU_DECAY = 2.4; // seconds

  if (recentCompression && depthCm > 2.0) {
    const depthFactor =
      depthCm >= 5.0 && depthCm <= 6.0
        ? 1.0
        : depthCm < 5.0
        ? Math.max(0.2, depthCm / 5.0)
        : Math.max(0.3, 1.0 - (depthCm - 6.0) * 0.4);

    const rateFactor =
      rateBpm >= 100 && rateBpm <= 120
        ? 1.0
        : rateBpm < 100
        ? Math.max(0.4, rateBpm / 100)
        : Math.max(0.4, 1.0 - (rateBpm - 120) * 0.015);

    const quality = depthFactor * rateFactor;

    next.strokeCountSincePause += 1;
    next.lastCompressionTimestamp = Date.now();

    const saturationFactor = 1 - Math.exp(-next.strokeCountSincePause / 8.0);
    const targetSystolic = 30 + 70 * quality * saturationFactor; // up to ~100 mmHg
    const targetDiastolic = 10 + 26 * quality * saturationFactor; // up to ~36 mmHg
    const targetRA = 8 + 6 * (1 - quality);

    next.aorticPressureSystolic = Math.min(
      110,
      next.aorticPressureSystolic + (targetSystolic - next.aorticPressureSystolic) * 0.35
    );
    next.aorticPressureDiastolic = Math.min(
      40,
      next.aorticPressureDiastolic + (targetDiastolic - next.aorticPressureDiastolic) * 0.28
    );
    next.rightAtrialPressure = targetRA;
    next.cardiacOutputLpm = 1.6 * quality * saturationFactor;
  } else {
    const now = Date.now();
    const elapsedSinceLastStroke = (now - next.lastCompressionTimestamp) / 1000;

    if (elapsedSinceLastStroke > 1.0) {
      const decayFraction = Math.exp(-dtSeconds / TAU_DECAY);
      next.aorticPressureSystolic = 8 + (next.aorticPressureSystolic - 8) * decayFraction;
      next.aorticPressureDiastolic = 8 + (next.aorticPressureDiastolic - 8) * decayFraction;
      next.cardiacOutputLpm = Math.max(0, next.cardiacOutputLpm * decayFraction);

      if (elapsedSinceLastStroke > 3.0) {
        next.strokeCountSincePause = Math.max(0, next.strokeCountSincePause - dtSeconds * 3);
      }
    }
  }

  next.coronaryPerfusionPressure = Math.max(
    0,
    next.aorticPressureDiastolic - next.rightAtrialPressure
  );

  next.cerebralPerfusionPct = Math.min(
    100,
    Math.round((next.coronaryPerfusionPressure / 25.0) * 100)
  );

  return next;
}

// ============================================================================
// 3. BIPHASIC TRUNCATED EXPONENTIAL (BTE) DEFIBRILLATOR PHYSICS (IEC 60601-2-4)
// ============================================================================

export interface BTEWaveformParameters {
  capacitanceUf: number;
  chargeVoltageV: number;
  patientImpedanceOhms: number;
  phase1DurationMs: number;
  interphaseDelayMs: number;
  phase2DurationMs: number;
}

export const DEFAULT_BTE_PARAMS: BTEWaveformParameters = {
  capacitanceUf: 140,
  chargeVoltageV: 1600, // 1600V yields standard 150J delivered energy at 75 Ohms
  patientImpedanceOhms: 75,
  phase1DurationMs: 6.0,
  interphaseDelayMs: 0.5,
  phase2DurationMs: 4.0,
};

export interface BTEWaveformPoint {
  timeMs: number;
  voltageV: number;
  currentA: number;
}

export interface BTEWaveformResult {
  points: BTEWaveformPoint[];
  peakCurrentA: number;
  deliveredEnergyJoules: number;
  tiltPercent: number;
  phase1TroughVoltageV: number;
  phase2PeakVoltageV: number;
  isEffectiveCurrent: boolean;
}

/**
 * Calculates continuous Biphasic Truncated Exponential waveform according to IEC 60601-2-4.
 */
export function calculateBTEWaveform(
  params: BTEWaveformParameters = DEFAULT_BTE_PARAMS,
  samplePoints: number = 60
): BTEWaveformResult {
  const C = params.capacitanceUf * 1e-6;
  const R = Math.max(10, params.patientImpedanceOhms);
  const tau = R * C;

  const V0 = params.chargeVoltageV;
  const p1Ms = params.phase1DurationMs;
  const delayMs = params.interphaseDelayMs;
  const p2Ms = params.phase2DurationMs;
  const totalMs = p1Ms + delayMs + p2Ms;

  const points: BTEWaveformPoint[] = [];
  let energyAcc = 0;
  const dtSec = (totalMs * 1e-3) / samplePoints;

  let vAtEndOfP1 = V0;
  const peakCurrentA = V0 / R;

  for (let i = 0; i <= samplePoints; i++) {
    const tMs = (i / samplePoints) * totalMs;
    const tSec = tMs * 1e-3;
    let v = 0;

    if (tMs <= p1Ms) {
      v = V0 * Math.exp(-tSec / tau);
      vAtEndOfP1 = v;
    } else if (tMs < p1Ms + delayMs) {
      v = 0;
    } else {
      const tPhase2 = (tMs - p1Ms - delayMs) * 1e-3;
      v = -vAtEndOfP1 * Math.exp(-tPhase2 / tau);
    }

    const currentA = v / R;
    points.push({ timeMs: Number(tMs.toFixed(2)), voltageV: Math.round(v), currentA: Number(currentA.toFixed(2)) });
    energyAcc += Math.pow(currentA, 2) * R * dtSec;
  }

  const phase2PeakVoltageV = -vAtEndOfP1;
  const tiltPercent = ((V0 - Math.abs(points[points.length - 1].voltageV)) / V0) * 100;
  const isEffectiveCurrent = peakCurrentA >= 15.0;

  return {
    points,
    peakCurrentA: Number(peakCurrentA.toFixed(1)),
    deliveredEnergyJoules: Math.round(energyAcc),
    tiltPercent: Math.round(tiltPercent),
    phase1TroughVoltageV: Math.round(vAtEndOfP1),
    phase2PeakVoltageV: Math.round(phase2PeakVoltageV),
    isEffectiveCurrent,
  };
}

// ============================================================================
// 4. VENTRICULAR FIBRILLATION AMPLITUDE SPECTRUM AREA (AMSA)
// ============================================================================

export interface AMSAAssessment {
  amsaValue: number;
  rhythmQuality: 'coarse_vf' | 'intermediate_vf' | 'fine_vf' | 'asystole';
  shockSuccessProbability: number;
  recommendation: string;
}

export function calculateAMSA(
  cppMmhg: number,
  durationWithoutCPRSeconds: number,
  initialAMSA: number = 24.0
): AMSAAssessment {
  const decayRate = 0.35;
  const recoveryRate = 0.28;

  let currentAMSA = initialAMSA;
  if (cppMmhg >= 15.0) {
    currentAMSA = Math.min(32.0, currentAMSA + recoveryRate * Math.min(10, cppMmhg / 15.0));
  } else {
    const ischemicLoss = decayRate * (1 - cppMmhg / 15.0) * Math.min(20, durationWithoutCPRSeconds);
    currentAMSA = Math.max(4.0, currentAMSA - ischemicLoss);
  }

  const shockSuccessProbability = 1 / (1 + Math.exp(-(currentAMSA - 14.5) / 2.8));

  let rhythmQuality: AMSAAssessment['rhythmQuality'] = 'fine_vf';
  let recommendation = 'CPR MANDATORY: Myocardial energy exhausted. Continuous CPR required before shock.';

  if (currentAMSA >= 21.0) {
    rhythmQuality = 'coarse_vf';
    recommendation = 'SHOCK ADVISED: High myocardial metabolic state (Coarse VF). High probability of ROSC.';
  } else if (currentAMSA >= 12.0) {
    rhythmQuality = 'intermediate_vf';
    recommendation = 'SHOCK READY: Moderate myocardial energy. Resume immediate CPR after shock.';
  } else if (currentAMSA < 6.0) {
    rhythmQuality = 'asystole';
    recommendation = 'EXTREME RISK: Approaching Asystole. Do NOT interrupt compressions.';
  }

  return {
    amsaValue: Number(currentAMSA.toFixed(1)),
    rhythmQuality,
    shockSuccessProbability: Number((shockSuccessProbability * 100).toFixed(1)),
    recommendation,
  };
}

// ============================================================================
// 5. THERMODYNAMIC JOULE HEATING & ELECTRICAL BURN DEPTH ($Q = I^2 R t$)
// ============================================================================

export interface TissueLayerBurn {
  layerName: string;
  depthMmRange: string;
  baselineTempC: number;
  peakTempC: number;
  damageGrade: 'intact' | '1st_degree' | '2nd_degree' | '3rd_degree' | 'carbonized';
  cellularEffect: string;
}

export interface ElectricalBurnAssessment {
  joulesThermalEnergy: number;
  entryWoundDiameterMm: number;
  layers: TissueLayerBurn[];
  compartmentPressureMmhg: number;
  isCompartmentSyndrome: boolean;
  myoglobinuriaRisk: 'low' | 'moderate' | 'severe' | 'fatal_renal_shutdown';
  urineColor: string;
  recommendedLactatedRingersMl: number;
}

export function calculateElectricalBurn(
  voltageV: number,
  durationSeconds: number,
  bodyCurrentAmps: number
): ElectricalBurnAssessment {
  const current = Math.max(0.01, bodyCurrentAmps);
  const time = Math.max(0.05, durationSeconds);
  const joules = voltageV * current * time;

  const skinTempRise = (joules / 120.0) * (voltageV > 1000 ? 2.5 : 1.0);
  const surfacePeakTemp = Math.min(650, 37.0 + skinTempRise);

  const layers: TissueLayerBurn[] = [
    {
      layerName: 'Epidermis (Outer Skin)',
      depthMmRange: '0.0 - 0.1 mm',
      baselineTempC: 37.0,
      peakTempC: Math.round(surfacePeakTemp),
      damageGrade:
        surfacePeakTemp > 300 ? 'carbonized' : surfacePeakTemp > 100 ? '3rd_degree' : surfacePeakTemp > 60 ? '2nd_degree' : '1st_degree',
      cellularEffect: surfacePeakTemp > 150 ? 'Immediate charring and water flash-vaporization' : 'Protein coagulation and bullae blisters',
    },
    {
      layerName: 'Dermis & Papillary Plexus',
      depthMmRange: '0.1 - 2.0 mm',
      baselineTempC: 37.0,
      peakTempC: Math.round(37 + (surfacePeakTemp - 37) * 0.72),
      damageGrade:
        surfacePeakTemp > 250 ? 'carbonized' : surfacePeakTemp > 85 ? '3rd_degree' : surfacePeakTemp > 52 ? '2nd_degree' : 'intact',
      cellularEffect: surfacePeakTemp > 85 ? 'Microvascular thrombosis and loss of sensation' : 'Erythema and superficial nerve excitation',
    },
    {
      layerName: 'Subcutaneous Adipose (Fat)',
      depthMmRange: '2.0 - 8.0 mm',
      baselineTempC: 37.0,
      peakTempC: Math.round(37 + (surfacePeakTemp - 37) * 0.45),
      damageGrade: surfacePeakTemp > 200 ? '3rd_degree' : surfacePeakTemp > 75 ? '2nd_degree' : 'intact',
      cellularEffect: surfacePeakTemp > 75 ? 'Fat necrosis and oily liquefaction' : 'Transient thermal inflammation',
    },
    {
      layerName: 'Deep Skeletal Muscle & Fascia',
      depthMmRange: '8.0 - 30.0 mm',
      baselineTempC: 37.0,
      peakTempC: Math.round(37 + (surfacePeakTemp - 37) * 0.35 + (voltageV > 400 ? 30 : 5)),
      damageGrade: surfacePeakTemp > 140 || voltageV >= 1000 ? '3rd_degree' : surfacePeakTemp > 65 ? '2nd_degree' : 'intact',
      cellularEffect:
        voltageV >= 400
          ? 'Massive coagulative rhabdomyolysis releasing intracellular myoglobin'
          : 'Reversible muscle tetany and edema',
    },
    {
      layerName: 'Periosteum & Cortical Bone',
      depthMmRange: '> 30.0 mm',
      baselineTempC: 37.0,
      peakTempC: Math.round(37 + (surfacePeakTemp - 37) * 0.2 + (voltageV > 1000 ? 45 : 0)),
      damageGrade: voltageV > 1000 && time > 0.5 ? '3rd_degree' : 'intact',
      cellularEffect: voltageV > 1000 ? 'Bone arcing, marrow thermal necrosis, deep periosteal burn' : 'Minimal conductive heating',
    },
  ];

  const muscleNecrosisFactor = layers[3].peakTempC > 65 ? (layers[3].peakTempC - 65) / 30 : 0;
  const compartmentPressure = Math.min(80, Math.round(8.0 + muscleNecrosisFactor * 36.0 + (voltageV > 1000 ? 18.0 : 0)));
  const isCompartmentSyndrome = compartmentPressure >= 30.0;

  let myoglobinuriaRisk: ElectricalBurnAssessment['myoglobinuriaRisk'] = 'low';
  let urineColor = '#facc15';

  if (voltageV >= 1000 || (voltageV >= 400 && time > 0.3)) {
    myoglobinuriaRisk = 'fatal_renal_shutdown';
    urineColor = '#451a03'; // dark cola / tea color
  } else if (voltageV >= 230 && time > 0.5) {
    myoglobinuriaRisk = 'severe';
    urineColor = '#78350f';
  } else if (voltageV >= 230) {
    myoglobinuriaRisk = 'moderate';
    urineColor = '#b45309';
  }

  const estimatedTBSA = Math.min(45, Math.round(joules / 1200 + 5));
  const recommendedLactatedRingersMl = Math.round(4 * 70 * estimatedTBSA + (isCompartmentSyndrome ? 2000 : 0));
  const entryDiameter = Math.min(80, Math.round(10 + Math.sqrt(joules) * 0.8));

  return {
    joulesThermalEnergy: Math.round(joules),
    entryWoundDiameterMm: entryDiameter,
    layers,
    compartmentPressureMmhg: compartmentPressure,
    isCompartmentSyndrome,
    myoglobinuriaRisk,
    urineColor,
    recommendedLactatedRingersMl,
  };
}
