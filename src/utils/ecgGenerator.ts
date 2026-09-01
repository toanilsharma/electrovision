/**
 * McSharry Synthetic ECG Generator (ecgsyn model)
 * 
 * Based on the dynamical model for generating synthetic electrocardiogram signals
 * (McSharry, Clifford, Tarassenko, Smith - IEEE Trans. Biomed. Eng., 2003).
 * 
 * Accurately models physiological cardiac states during electrical shock:
 * 1. Normal Sinus Rhythm (NSR, 60-100 BPM, distinct P-QRS-T waves)
 * 2. Ventricular Tachycardia (VTach, >30mA, wide bizarre QRS, 150-220 BPM)
 * 3. Ventricular Fibrillation (VFib, >75mA, chaotic irregular desynchronized fibrillation)
 * 4. Asystole (>5s in VFib, flatline cardiac arrest)
 */

export type PhysiologicalRhythm = 'sinus' | 'vtach' | 'vfib' | 'asystole';

export interface ECGPeakParams {
  theta: number; // Angular position in radians [-pi, pi]
  a: number;     // Amplitude
  b: number;     // Width (spread)
}

export interface ECGStateParameters {
  bpm: number;
  p: ECGPeakParams;
  q: ECGPeakParams;
  r: ECGPeakParams;
  s: ECGPeakParams;
  t: ECGPeakParams;
  baselineNoise: number;
  rhythm: PhysiologicalRhythm;
  rhythmName: string;
  statusColor: string;
}

// Parameter presets for distinct cardiac morphologies
export const NSR_PARAMS: ECGStateParameters = {
  bpm: 72,
  p: { theta: -1.2, a: 2.2, b: 0.22 },
  q: { theta: -0.22, a: -6.0, b: 0.07 },
  r: { theta: 0.0, a: 34.0, b: 0.08 },
  s: { theta: 0.24, a: -9.5, b: 0.08 },
  t: { theta: 1.45, a: 5.5, b: 0.38 },
  baselineNoise: 0.4,
  rhythm: 'sinus',
  rhythmName: 'Normal Sinus Rhythm (72 BPM)',
  statusColor: '#22c55e'
};

export const VTACH_PARAMS: ECGStateParameters = {
  bpm: 185,
  p: { theta: 0, a: 0, b: 0.1 },        // Dissociated / absent P wave
  q: { theta: -0.4, a: -2.0, b: 0.2 },
  r: { theta: 0.0, a: 26.0, b: 0.44 },   // Wide bizarre, slurred R wave
  s: { theta: 0.75, a: -22.0, b: 0.4 },  // Deep broad discordant S wave
  t: { theta: 1.8, a: -7.0, b: 0.5 },    // Inverted T wave
  baselineNoise: 1.2,
  rhythm: 'vtach',
  rhythmName: 'Ventricular Tachycardia (185 BPM)',
  statusColor: '#f97316'
};

export const VFIB_PARAMS: ECGStateParameters = {
  bpm: 380,
  p: { theta: 0, a: 0, b: 0.1 },
  q: { theta: 0, a: 0, b: 0.1 },
  r: { theta: 0, a: 0, b: 0.1 },
  s: { theta: 0, a: 0, b: 0.1 },
  t: { theta: 0, a: 0, b: 0.1 },
  baselineNoise: 4.5,
  rhythm: 'vfib',
  rhythmName: 'Ventricular Fibrillation (Lethal VF Zone)',
  statusColor: '#ef4444'
};

export const ASYSTOLE_PARAMS: ECGStateParameters = {
  bpm: 0,
  p: { theta: 0, a: 0, b: 0.1 },
  q: { theta: 0, a: 0, b: 0.1 },
  r: { theta: 0, a: 0, b: 0.1 },
  s: { theta: 0, a: 0, b: 0.1 },
  t: { theta: 0, a: 0, b: 0.1 },
  baselineNoise: 0.35,
  rhythm: 'asystole',
  rhythmName: 'Asystole (Cardiac Arrest - Flatline)',
  statusColor: '#94a3b8'
};

/**
 * Normalizes an angle in radians to [-pi, pi]
 */
export function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Evaluates the McSharry Gaussian sum for a single wave peak
 */
function gaussianPeak(theta: number, peak: ECGPeakParams): number {
  if (Math.abs(peak.a) < 0.001) return 0;
  const deltaTheta = normalizeAngle(theta - peak.theta);
  return peak.a * Math.exp(-(deltaTheta * deltaTheta) / (2 * peak.b * peak.b));
}

/**
 * Evaluates the synthetic ECG voltage value (z) for a given phase angle theta
 */
export function evaluateMcSharryAtPhase(theta: number, params: ECGStateParameters): number {
  if (params.rhythm === 'asystole') {
    return (Math.random() - 0.5) * params.baselineNoise;
  }

  const pVal = gaussianPeak(theta, params.p);
  const qVal = gaussianPeak(theta, params.q);
  const rVal = gaussianPeak(theta, params.r);
  const sVal = gaussianPeak(theta, params.s);
  const tVal = gaussianPeak(theta, params.t);

  const noise = (Math.random() - 0.5) * params.baselineNoise;
  return pVal + qVal + rVal + sVal + tVal + noise;
}

/**
 * Deterministic multi-frequency chaos generator for Ventricular Fibrillation
 */
export function generateVFibWave(time: number, isFine: boolean = false): number {
  const amplitudeScale = isFine ? 0.35 : 1.0;
  
  // Superposition of multiple asynchronous decaying oscillators simulating chaotic myocardial cells
  const f1 = 4.2;
  const f2 = 5.8;
  const f3 = 7.3;
  const f4 = 3.1;

  const w1 = Math.sin(time * f1 * 2 * Math.PI + Math.sin(time * 1.5)) * 14.0;
  const w2 = Math.cos(time * f2 * 2 * Math.PI + Math.cos(time * 2.1)) * 9.0;
  const w3 = Math.sin(time * f3 * 2 * Math.PI) * 6.5;
  const w4 = Math.cos(time * f4 * 2 * Math.PI + 0.8) * 7.5;
  const noise = (Math.random() - 0.5) * 3.5;

  return (w1 + w2 + w3 + w4 + noise) * amplitudeScale;
}

/**
 * Determines physiological cardiac state from live simulation parameters
 */
export function resolvePhysiologicalState(
  currentMA: number,
  isSimulating: boolean,
  isPPESafe: boolean = false,
  vfDurationSeconds: number = 0
): {
  rhythm: PhysiologicalRhythm;
  targetParams: ECGStateParameters;
  isAsystole: boolean;
  isVFib: boolean;
  isVTach: boolean;
  isSinus: boolean;
} {
  // If not energized or protected by PPE
  if (!isSimulating || isPPESafe || currentMA < 0.5) {
    return {
      rhythm: 'sinus',
      targetParams: NSR_PARAMS,
      isAsystole: false,
      isVFib: false,
      isVTach: false,
      isSinus: true
    };
  }

  // Shock > 5s in VF Zone -> Asystole Flatline
  if (currentMA >= 75 && vfDurationSeconds >= 5.0) {
    return {
      rhythm: 'asystole',
      targetParams: ASYSTOLE_PARAMS,
      isAsystole: true,
      isVFib: false,
      isVTach: false,
      isSinus: false
    };
  }

  // Shock > 75mA (IEC Zone 4 / Ventricular Fibrillation)
  if (currentMA >= 75) {
    return {
      rhythm: 'vfib',
      targetParams: VFIB_PARAMS,
      isAsystole: false,
      isVFib: true,
      isVTach: false,
      isSinus: false
    };
  }

  // Shock > 30mA (Ventricular Tachycardia / Severe Arrhythmia)
  if (currentMA >= 30) {
    return {
      rhythm: 'vtach',
      targetParams: VTACH_PARAMS,
      isAsystole: false,
      isVFib: false,
      isVTach: true,
      isSinus: false
    };
  }

  // Shock between 0.5mA and 30mA -> Sinus Tachycardia (HR scales with current)
  const tachBpm = Math.min(135, Math.round(72 + (currentMA / 30) * 55));
  const sinusTachParams: ECGStateParameters = {
    ...NSR_PARAMS,
    bpm: tachBpm,
    baselineNoise: 0.8,
    rhythmName: `Sinus Tachycardia (${tachBpm} BPM)`
  };

  return {
    rhythm: 'sinus',
    targetParams: sinusTachParams,
    isAsystole: false,
    isVFib: false,
    isVTach: false,
    isSinus: true
  };
}

/**
 * Linearly interpolates two values
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothly blends two peak parameter sets
 */
function blendPeak(p1: ECGPeakParams, p2: ECGPeakParams, t: number): ECGPeakParams {
  return {
    theta: lerp(p1.theta, p2.theta, t),
    a: lerp(p1.a, p2.a, t),
    b: lerp(p1.b, p2.b, t)
  };
}

/**
 * Smoothly interpolates entire ECG parameter sets for continuous dynamic transition
 */
export function blendECGParameters(
  p1: ECGStateParameters,
  p2: ECGStateParameters,
  factor: number
): ECGStateParameters {
  const t = Math.max(0, Math.min(1, factor));
  return {
    bpm: Math.round(lerp(p1.bpm, p2.bpm, t)),
    p: blendPeak(p1.p, p2.p, t),
    q: blendPeak(p1.q, p2.q, t),
    r: blendPeak(p1.r, p2.r, t),
    s: blendPeak(p1.s, p2.s, t),
    t: blendPeak(p1.t, p2.t, t),
    baselineNoise: lerp(p1.baselineNoise, p2.baselineNoise, t),
    rhythm: t > 0.5 ? p2.rhythm : p1.rhythm,
    rhythmName: t > 0.5 ? p2.rhythmName : p1.rhythmName,
    statusColor: t > 0.5 ? p2.statusColor : p1.statusColor
  };
}

/**
 * Computes instantaneous ECG waveform sample y at time t for a given state
 */
export function computeECGSample(
  time: number,
  params: ECGStateParameters,
  vfDurationSeconds: number = 0
): number {
  if (params.rhythm === 'asystole') {
    // Flatline with subtle thermal drift
    const drift = Math.sin(time * 0.4) * 0.4 + (Math.random() - 0.5) * 0.35;
    return drift;
  }

  if (params.rhythm === 'vfib') {
    const isFine = vfDurationSeconds >= 3.5;
    return generateVFibWave(time, isFine);
  }

  // McSharry Limit Cycle Angle
  const omega = 2 * Math.PI * (params.bpm / 60);
  const theta = normalizeAngle(omega * time);

  return evaluateMcSharryAtPhase(theta, params);
}
