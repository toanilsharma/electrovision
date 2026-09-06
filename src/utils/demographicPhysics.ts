/**
 * Patient Demographic Biomechanics & Pediatric BLS Protocol Parameters
 * Standards: AHA BLS 2020-2025 / ERC 2021 Pediatric Life Support / ILCOR
 */

export type PatientDemographic = 'adult' | 'child' | 'infant';

export interface DemographicConfig {
  id: PatientDemographic;
  name: string;
  ageBracket: string;
  targetDepthCmMin: number;
  targetDepthCmMax: number;
  optimalDepthCm: number;
  compressionRatioSingle: string; // e.g. '30:2'
  compressionRatioDual: string; // e.g. '15:2' for pediatric
  handTechnique: string;
  pulseCheckSite: string;
  aedEnergyJoules: number;
  aedPadPlacement: string;
  stiffnessK1: number; // linear stiffness N/cm
  stiffnessK2: number; // cubic stiffening N/cm^3
  dampingC: number; // damping N*s/cm
  targetTidalVolumeMl: number;
  apDiameterCm: number;
}

export const DEMOGRAPHIC_PRESETS: Record<PatientDemographic, DemographicConfig> = {
  adult: {
    id: 'adult',
    name: 'Adult',
    ageBracket: 'Puberty & Older (≥ 12 yrs)',
    targetDepthCmMin: 5.0,
    targetDepthCmMax: 6.0,
    optimalDepthCm: 5.4,
    compressionRatioSingle: '30:2',
    compressionRatioDual: '30:2',
    handTechnique: 'Two hands interlaced on lower half of sternum',
    pulseCheckSite: 'Carotid artery (neck) for 5–10 seconds',
    aedEnergyJoules: 150,
    aedPadPlacement: 'Anterolateral (Right infraclavicular + Left mid-axillary)',
    stiffnessK1: 35.0,
    stiffnessK2: 0.85,
    dampingC: 4.5,
    targetTidalVolumeMl: 550,
    apDiameterCm: 22.0,
  },
  child: {
    id: 'child',
    name: 'Child',
    ageBracket: '1 Year to Puberty (1–11 yrs)',
    targetDepthCmMin: 4.0,
    targetDepthCmMax: 5.0,
    optimalDepthCm: 4.5,
    compressionRatioSingle: '30:2',
    compressionRatioDual: '15:2',
    handTechnique: 'One hand (or two hands) on lower half of sternum',
    pulseCheckSite: 'Carotid or femoral artery',
    aedEnergyJoules: 50,
    aedPadPlacement: 'Anterolateral with pediatric attenuator (or Anterior-Posterior if pads touch)',
    stiffnessK1: 20.0,
    stiffnessK2: 0.45,
    dampingC: 2.8,
    targetTidalVolumeMl: 250,
    apDiameterCm: 15.0,
  },
  infant: {
    id: 'infant',
    name: 'Infant',
    ageBracket: '< 1 Year (0–12 months)',
    targetDepthCmMin: 3.5,
    targetDepthCmMax: 4.0,
    optimalDepthCm: 3.8,
    compressionRatioSingle: '30:2',
    compressionRatioDual: '15:2',
    handTechnique: '2-thumb encircling hands (dual) or 2 fingers (single)',
    pulseCheckSite: 'Brachial artery (inner upper arm) — DO NOT check carotid',
    aedEnergyJoules: 50,
    aedPadPlacement: 'Anterior-Posterior (Center of chest + Center of back)',
    stiffnessK1: 12.0,
    stiffnessK2: 0.20,
    dampingC: 1.5,
    targetTidalVolumeMl: 40,
    apDiameterCm: 11.0,
  },
};

export interface CompressionEvaluation {
  isDepthAdequate: boolean;
  isTooDeep: boolean;
  isTooShallow: boolean;
  depthRating: 'perfect' | 'good' | 'shallow' | 'too_deep';
  deliveredForceNewtons: number;
  contactDutyCyclePct: number; // Target 40-50% compression time
}

/**
 * Evaluates compression quality against demographic-specific standards.
 */
export function evaluateDemographicCompression(
  depthCm: number,
  velocityCmS: number,
  pressDurationMs: number,
  cycleDurationMs: number,
  demographic: PatientDemographic
): CompressionEvaluation {
  const config = DEMOGRAPHIC_PRESETS[demographic];

  // Calculate nonlinear resistance force for this specific demographic
  const F_elastic = config.stiffnessK1 * depthCm + config.stiffnessK2 * Math.pow(depthCm, 3);
  const F_damping = config.dampingC * Math.max(0, velocityCmS);
  const deliveredForceNewtons = Math.round(F_elastic + F_damping);

  const isTooShallow = depthCm < config.targetDepthCmMin;
  const isTooDeep = depthCm > config.targetDepthCmMax;
  const isDepthAdequate = !isTooShallow && !isTooDeep;

  let depthRating: CompressionEvaluation['depthRating'];
  if (Math.abs(depthCm - config.optimalDepthCm) <= 0.3) {
    depthRating = 'perfect';
  } else if (isDepthAdequate) {
    depthRating = 'good';
  } else if (isTooShallow) {
    depthRating = 'shallow';
  } else {
    depthRating = 'too_deep';
  }

  const dutyCycle = cycleDurationMs > 0 ? (pressDurationMs / cycleDurationMs) * 100 : 45;
  const contactDutyCyclePct = Math.min(100, Math.max(0, Math.round(dutyCycle)));

  return {
    isDepthAdequate,
    isTooDeep,
    isTooShallow,
    depthRating,
    deliveredForceNewtons,
    contactDutyCyclePct,
  };
}

export interface RhythmTimingResult {
  deltaMs: number; // difference from beat (0 is dead-on)
  accuracy: 'perfect' | 'good' | 'early' | 'late' | 'miss';
  score: number;
  feedback: string;
}

/**
 * Rhythm bar beat hit evaluation.
 */
export function evaluateRhythmTiming(deltaMs: number): RhythmTimingResult {
  const absDelta = Math.abs(deltaMs);

  if (absDelta <= 45) {
    return {
      deltaMs,
      accuracy: 'perfect',
      score: 300,
      feedback: 'PERFECT CADENCE! (110 BPM)',
    };
  }
  if (absDelta <= 95) {
    return {
      deltaMs,
      accuracy: 'good',
      score: 150,
      feedback: deltaMs < 0 ? 'SLIGHTLY EARLY' : 'SLIGHTLY LATE',
    };
  }
  if (deltaMs < -95) {
    return {
      deltaMs,
      accuracy: 'early',
      score: 50,
      feedback: 'TOO FAST — SLOW DOWN!',
    };
  }
  return {
    deltaMs,
    accuracy: 'late',
    score: 50,
    feedback: 'TOO SLOW — SPEED UP!',
  };
}
