/**
 * IEEE Std 80-2000 Grounding Safety Physics Module
 * Substation Grounding Calculations per IEEE Std 80-2000 & IEC 60479-1:2018
 */

export interface IEEE80Params {
  bodyWeightKg: 50 | 70;       // 50 kg or 70 kg body mass (IEEE 80 Section 8.3 & 8.4)
  clearingTimeSec: number;     // Fault clearing duration ts (0.05 to 1.0 s)
  surfaceResistivity: number;  // Surface layer resistivity ρs (Ω·m)
  soilResistivity: number;     // Underlying soil resistivity ρ (Ω·m)
  layerThicknessM?: number;    // Surface layer thickness hs (m, default 0.1 m)
  faultCurrentKA: number;      // Fault current If (kA)
  gridResistanceOhm: number;   // Substation grounding grid resistance Rg (Ω)
  hasEHBoots?: boolean;        // Electrical Hazard (EH) Boots (+10,000 Ω per boot)
  hasGloves?: boolean;         // Insulated rubber gloves (+10,000 Ω per glove)
}

export interface BodyImpactAssessment {
  zoneCode: 'AC-1' | 'AC-2' | 'AC-3' | 'AC-4.1' | 'AC-4.2' | 'AC-4.3';
  zoneTitle: string;
  severityColor: string;
  primaryEffect: string;
  affectedOrgans: string[];
  standardsRef: string;
  recommendation: string;
}

export interface IEEE80Result {
  // Derating Factor Cs (IEEE 80 Eq. 89)
  Cs: number;

  // Tolerable Touch & Step Potentials (IEEE 80 Eq. 29, 30, 32, 33)
  E_touch_tolerable: number; // Volts
  E_step_tolerable: number;  // Volts
  IB_amp: number;            // Fibrillation Body Current IB (Amps)

  // Ground Potential Rise (GPR = If * Rg)
  GPR_volts: number;         // Volts
  GPR_kV: number;            // kV

  // Actual Surface Potential Profile V(x) via Hemispherical Model (r0 = 0.5m)
  calcVx: (distanceM: number) => number; // V(x) in Volts
  
  // Actual Touch & Step Voltages at given distance x
  calcActualTouch: (distanceM: number) => number; // Volts
  calcActualStep: (distanceM: number) => number;  // Volts
  
  // Body Path Current & Voltage with optional PPE series resistance
  calcBodyCurrent: (vActual: number, isStepMode: boolean, hasBoots: boolean, hasGloves: boolean) => {
    iBodymA: number;
    rBodyTotalOhm: number;
    isFibrillationRisk: boolean;
  };
}

/**
 * Calculates surface layer derating factor Cs per IEEE Std 80-2000 Eq. 89:
 * Cs = 1 - [0.09 * (1 - ρ / ρs)] / (2 * hs + 0.09)
 */
export function calculateCs(
  rhoS: number, 
  rho: number, 
  hs: number = 0.1
): number {
  if (rhoS <= 0) return 1.0;
  if (rhoS === rho) return 1.0;
  
  const csCalculated = 1 - (0.09 * (1 - rho / rhoS)) / (2 * hs + 0.09);
  return Math.max(0.09, Math.min(1.0, csCalculated));
}

/**
 * Evaluates probable physiological body impact per IEC 60479-1:2018 & IEEE Std 80-2000
 */
export function getPhysiologicalBodyImpact(
  iBodymA: number,
  isStepMode: boolean,
  iFibrillationLimitmA: number
): BodyImpactAssessment {
  if (iBodymA < 0.5) {
    return {
      zoneCode: 'AC-1',
      zoneTitle: 'Imperceptible (Below Sensory Threshold)',
      severityColor: '#22c55e',
      primaryEffect: 'No perception, zero physiological reaction.',
      affectedOrgans: ['Skin (No Effect)'],
      standardsRef: 'IEC 60479-1 Fig. 20 / IEEE 80 Sec 8.1',
      recommendation: 'Body current is safely below human perception limit (0.5 mA).'
    };
  }

  if (iBodymA < 10.0) {
    return {
      zoneCode: 'AC-2',
      zoneTitle: 'Perception & Involuntary Contraction',
      severityColor: '#38bdf8',
      primaryEffect: 'Slight tingling sensation, involuntary muscle contraction. Able to release/step freely.',
      affectedOrgans: ['Cutaneous Nerves', 'Leg/Arm Nerves'],
      standardsRef: 'IEC 60479-1 Zone AC-2 (Let-go threshold ~10 mA)',
      recommendation: 'Move away carefully keeping feet together.'
    };
  }

  if (iBodymA < 30.0 && iBodymA < iFibrillationLimitmA) {
    return {
      zoneCode: 'AC-3',
      zoneTitle: 'Muscle Tetany & Asphyxiation Risk',
      severityColor: '#f59e0b',
      primaryEffect: isStepMode
        ? 'Severe leg muscle tetany & cramps. Inability to step away or move legs. Risk of falling flat on ground.'
        : 'Involuntary arm muscle contraction. Inability to let go of metal structure. Respiratory oppression.',
      affectedOrgans: isStepMode ? ['Quadriceps', 'Calf Muscles', 'Spinal Nerves'] : ['Intercostal Muscles', 'Lungs', 'Arm Nerves'],
      standardsRef: 'IEC 60479-1 Zone AC-3 (Involuntary tetany threshold)',
      recommendation: isStepMode ? 'Bunny-hop or shuffle feet together to eliminate step voltage.' : 'Do not touch grounded substation metalwork!'
    };
  }

  if (iBodymA < iFibrillationLimitmA) {
    return {
      zoneCode: 'AC-4.1',
      zoneTitle: 'Reversible Cardiac Shock & Strong Tetany',
      severityColor: '#f97316',
      primaryEffect: isStepMode
        ? 'Violent leg muscle cramps & pelvic spasms. Person will collapse to earth, creating a full-body touch hazard.'
        : 'Severe thoracic cramps, acute respiratory paralysis, temporary cardiac arrhythmia.',
      affectedOrgans: isStepMode ? ['Skeletal Muscles', 'Pelvic Nerves', 'Skin Points'] : ['Cardiac Conduction System', 'Lungs', 'Diaphragm'],
      standardsRef: 'IEC 60479-1 Zone AC-4.1 (5% Fibrillation Probability)',
      recommendation: 'High risk zone! Protection clearing required immediately.'
    };
  }

  return {
    zoneCode: iBodymA > 500 ? 'AC-4.3' : 'AC-4.2',
    zoneTitle: 'CRITICAL: Ventricular Fibrillation & Cardiac Arrest',
    severityColor: '#ef4444',
    primaryEffect: isStepMode
      ? 'Extreme body current exceeding IEEE 80 limit. Violent leg spasms causing collapse + high risk of cardiac arrest.'
      : 'Ventricular Fibrillation (>50% probability). Heart muscle loses synchronized pumping ability, stopping circulation. Severe electrical tissue burns.',
    affectedOrgans: ['Heart (Ventricular Myocardium)', 'Central Nervous System', 'Lungs', 'Skin Entry/Exit Points'],
    standardsRef: `IEEE Std 80-2000 Sec 8.3 (IB = ${(iFibrillationLimitmA/1000).toFixed(3)}A) & IEC 60479-1 Zone AC-4`,
    recommendation: 'CRITICAL HAZARD! De-energise grid immediately. Initiate CPR & AED defibrillation.'
  };
}

/**
 * Main IEEE Std 80-2000 Physics Engine
 */
export function calculateIEEE80(params: IEEE80Params): IEEE80Result {
  const {
    bodyWeightKg = 50,
    clearingTimeSec = 0.5,
    surfaceResistivity: rhoS,
    soilResistivity: rho,
    layerThicknessM: hs = 0.1,
    faultCurrentKA,
    gridResistanceOhm: Rg,
    hasEHBoots = false,
    hasGloves = false
  } = params;

  // 1. Surface Layer Derating Factor Cs (IEEE 80 Eq. 89)
  const Cs = calculateCs(rhoS, rho, hs);

  // 2. Fibrillation Body Current Limit IB (IEEE 80 Section 8.3)
  const kWeight = bodyWeightKg === 50 ? 0.116 : 0.157;
  const ts = Math.max(0.01, clearingTimeSec);
  const IB_amp = kWeight / Math.sqrt(ts);

  // 3. Tolerable Touch Voltage Limit Etouch (IEEE 80 Eq. 29 & Eq. 32)
  const E_touch_tolerable = (1000 + 1.5 * Cs * rhoS) * IB_amp;

  // 4. Tolerable Step Voltage Limit Estep (IEEE 80 Eq. 30 & Eq. 33)
  const E_step_tolerable = (1000 + 6.0 * Cs * rhoS) * IB_amp;

  // 5. Ground Potential Rise GPR = If * Rg
  const GPR_volts = (faultCurrentKA * 1000) * Rg;
  const GPR_kV = GPR_volts / 1000;

  // 6. Surface Potential Profile V(x) - Hemispherical Electrode Model (r0 = 0.5m)
  const r0 = 0.5;
  const calcVx = (distanceM: number): number => {
    const x = Math.max(0.001, distanceM);
    const vRatio = (2 / Math.PI) * Math.atan(r0 / x);
    return GPR_volts * vRatio;
  };

  // Actual Touch Voltage at reach distance x
  const calcActualTouch = (distanceM: number): number => {
    const vx = calcVx(distanceM);
    return Math.max(1, GPR_volts - vx);
  };

  // Actual Step Voltage across 1m stride: Vstep(x) = V(x) - V(x + 1.0m)
  const calcActualStep = (distanceM: number): number => {
    const v1 = calcVx(distanceM);
    const v2 = calcVx(distanceM + 1.0);
    return Math.max(1, v1 - v2);
  };

  // Body Path Current Calculation with PPE Resistance
  const calcBodyCurrent = (
    vActual: number, 
    isStepMode: boolean, 
    bootsActive: boolean = hasEHBoots, 
    glovesActive: boolean = hasGloves
  ) => {
    const rBody = 1000;
    const rBoot = bootsActive ? 10000 : 0;
    const rGlove = (glovesActive && !isStepMode) ? 10000 : 0;

    const rFoot = 3 * Cs * rhoS;

    let rTotal = rBody;
    if (isStepMode) {
      rTotal = rBody + 2 * rFoot + 2 * rBoot;
    } else {
      rTotal = rBody + 0.5 * rFoot + rGlove + rBoot;
    }

    const iBodyAmp = vActual / rTotal;
    const iBodymA = iBodyAmp * 1000;
    const isFibrillationRisk = iBodyAmp >= IB_amp;

    return {
      iBodymA,
      rBodyTotalOhm: rTotal,
      isFibrillationRisk
    };
  };

  return {
    Cs,
    E_touch_tolerable,
    E_step_tolerable,
    IB_amp,
    GPR_volts,
    GPR_kV,
    calcVx,
    calcActualTouch,
    calcActualStep,
    calcBodyCurrent
  };
}
