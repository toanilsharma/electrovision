/**
 * Procedural Multi-Lead Electrocardiogram (ECG) Vector Synthesizer
 * Generates mathematically authentic cardiac electrophysiology waveforms
 * and biomechanical CPR compression motion artifacts.
 * 
 * Standards: AHA ACLS 2024 / IEC 60601-2-27 (ECG monitoring standards)
 */

export type ECGRhythmType = 'sinus' | 'coarse_vf' | 'fine_vf' | 'pvt' | 'asystole' | 'pea';
export type ECGLead = 'Lead II' | 'V1';

export interface ECGPoint {
  timeSec: number;
  millivolts: number;
  artifactMillivolts: number;
  totalMillivolts: number;
}

export interface ECGSampleOptions {
  rhythm: ECGRhythmType;
  lead?: ECGLead;
  heartRateBpm?: number;
  isCompressing?: boolean;
  compressionDepthCm?: number;
  compressionRateBpm?: number;
}

/**
 * Procedural P-Q-R-S-T generator for Normal Sinus Rhythm (NSR).
 */
function generateSinusWave(cyclePhase: number, lead: ECGLead): number {
  // cyclePhase is normalized 0.0 to 1.0 within one cardiac cycle (R-R interval)
  // Lead II has dominant positive R wave; V1 has smaller R and deep S wave.
  const isV1 = lead === 'V1';
  const rAmp = isV1 ? 0.35 : 1.25;
  const sAmp = isV1 ? -0.85 : -0.30;
  const pAmp = isV1 ? 0.08 : 0.18;
  const tAmp = isV1 ? 0.15 : 0.32;

  let mv = 0;

  // P Wave (Atrial Depolarization): occurs around phase 0.10 - 0.20
  if (cyclePhase >= 0.10 && cyclePhase <= 0.22) {
    const pPhase = (cyclePhase - 0.16) / 0.06;
    mv += pAmp * Math.exp(-0.5 * Math.pow(pPhase * 2.5, 2));
  }

  // PR Segment: baseline from 0.22 to 0.30

  // Q Wave: phase 0.30 - 0.32
  if (cyclePhase >= 0.30 && cyclePhase <= 0.33) {
    const qPhase = (cyclePhase - 0.315) / 0.015;
    mv += (isV1 ? -0.05 : -0.15) * Math.exp(-0.5 * Math.pow(qPhase * 3, 2));
  }

  // R Wave (Ventricular Depolarization Spike): sharp narrow impulse at phase 0.35
  if (cyclePhase >= 0.33 && cyclePhase <= 0.37) {
    const rPhase = (cyclePhase - 0.35) / 0.018;
    mv += rAmp * Math.exp(-0.5 * Math.pow(rPhase * 3, 2));
  }

  // S Wave: phase 0.37 - 0.41
  if (cyclePhase >= 0.37 && cyclePhase <= 0.42) {
    const sPhase = (cyclePhase - 0.39) / 0.02;
    mv += sAmp * Math.exp(-0.5 * Math.pow(sPhase * 3, 2));
  }

  // ST Segment: phase 0.42 - 0.50 (isoelectric)

  // T Wave (Ventricular Repolarization): broad asymmetric wave at phase 0.50 - 0.70
  if (cyclePhase >= 0.50 && cyclePhase <= 0.72) {
    const tPhase = (cyclePhase - 0.60) / 0.08;
    mv += tAmp * Math.exp(-0.5 * Math.pow(tPhase * 2.2, 2));
  }

  // Baseline drift: slow 0.15 Hz respiration wander
  return mv;
}

/**
 * Generates Coarse Ventricular Fibrillation (AMSA > 21 mV-Hz).
 * Highly chaotic multi-frequency non-harmonic sinusoids.
 */
function generateCoarseVF(t: number): number {
  const f1 = 4.8;
  const f2 = 6.2;
  const f3 = 8.1;
  const f4 = 3.3;

  const w1 = Math.sin(2 * Math.PI * f1 * t + 0.4);
  const w2 = 0.65 * Math.sin(2 * Math.PI * f2 * t + 1.8);
  const w3 = 0.35 * Math.sin(2 * Math.PI * f3 * t + 3.1);
  const w4 = 0.50 * Math.sin(2 * Math.PI * f4 * t + 0.9);

  // Nonlinear modulation to mimic re-entrant wave breakups
  const envelope = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.9 * t);
  return (w1 + w2 + w3 + w4) * 0.32 * envelope;
}

/**
 * Generates Fine Ischemic Ventricular Fibrillation (AMSA < 12 mV-Hz).
 * Low amplitude, rapid, dying fibrillation.
 */
function generateFineVF(t: number): number {
  const f1 = 8.5;
  const f2 = 11.2;
  const f3 = 6.4;

  const w1 = Math.sin(2 * Math.PI * f1 * t);
  const w2 = 0.5 * Math.sin(2 * Math.PI * f2 * t + 1.2);
  const w3 = 0.3 * Math.sin(2 * Math.PI * f3 * t + 2.7);

  return (w1 + w2 + w3) * 0.07; // < 0.2 mV
}

/**
 * Generates Monomorphic Pulseless Ventricular Tachycardia (pVT, 180 BPM).
 * Wide, smooth, sinusoidal QRS complexes without P or T waves.
 */
function generatePVT(t: number): number {
  const vtRateHz = 3.0; // 180 BPM
  const phase = (t * vtRateHz) % 1.0;
  // Wide sine with skewed peak
  const raw = Math.sin(2 * Math.PI * phase) + 0.25 * Math.sin(4 * Math.PI * phase);
  return raw * 0.85;
}

/**
 * Generates Asystole with natural low-amplitude galvanic baseline wander.
 */
function generateAsystole(t: number): number {
  const thermalNoise = 0.02 * Math.sin(2 * Math.PI * 43.0 * t) * Math.cos(2 * Math.PI * 17.0 * t);
  const baselineDrift = 0.04 * Math.sin(2 * Math.PI * 0.2 * t);
  return thermalNoise + baselineDrift;
}

/**
 * Generates Biomechanical CPR Motion Artifact.
 * Chest compressions physically deform thoracic electrode pads, injecting
 * massive ~1.8 Hz sinusoidal motion noise that masks cardiac electrophysiology.
 */
export function calculateCPRArtifact(
  t: number,
  isCompressing: boolean,
  compressionDepthCm: number = 5.4,
  compressionRateBpm: number = 110
): number {
  if (!isCompressing || compressionDepthCm <= 0.2) return 0;

  const cprFreqHz = compressionRateBpm / 60.0; // ~1.83 Hz
  const depthFactor = Math.min(1.5, compressionDepthCm / 5.0); // scales with depth

  // Fundamental compression frequency
  const fundamental = Math.sin(2 * Math.PI * cprFreqHz * t);
  // 2nd harmonic caused by abrupt sternal bottoming out
  const harmonic2 = 0.45 * Math.sin(4 * Math.PI * cprFreqHz * t + 0.8);
  // Electrode jerk impulse
  const jerk = 0.25 * Math.sin(6 * Math.PI * cprFreqHz * t + 1.5);

  const rawArtifact = (fundamental + harmonic2 + jerk) * 0.65 * depthFactor;
  return rawArtifact;
}

/**
 * Computes instantaneous multi-lead ECG voltage at time `t`.
 */
export function sampleECGVoltage(t: number, options: ECGSampleOptions): ECGPoint {
  const rhythm = options.rhythm;
  const lead = options.lead || 'Lead II';
  const hr = options.heartRateBpm || (rhythm === 'pvt' ? 180 : 75);
  const rrIntervalSec = 60.0 / hr;
  const cyclePhase = (t % rrIntervalSec) / rrIntervalSec;

  let rhythmVoltageMv = 0;

  switch (rhythm) {
    case 'sinus':
    case 'pea':
      rhythmVoltageMv = generateSinusWave(cyclePhase, lead);
      break;
    case 'coarse_vf':
      rhythmVoltageMv = generateCoarseVF(t);
      break;
    case 'fine_vf':
      rhythmVoltageMv = generateFineVF(t);
      break;
    case 'pvt':
      rhythmVoltageMv = generatePVT(t);
      break;
    case 'asystole':
      rhythmVoltageMv = generateAsystole(t);
      break;
    default:
      rhythmVoltageMv = 0;
  }

  // Calculate CPR mechanical motion artifact
  const artifactMv = calculateCPRArtifact(
    t,
    Boolean(options.isCompressing),
    options.compressionDepthCm ?? 5.4,
    options.compressionRateBpm ?? 110
  );

  return {
    timeSec: t,
    millivolts: parseFloat(rhythmVoltageMv.toFixed(3)),
    artifactMillivolts: parseFloat(artifactMv.toFixed(3)),
    totalMillivolts: parseFloat((rhythmVoltageMv + artifactMv).toFixed(3)),
  };
}

/**
 * Generates an SVG path string for a time window (e.g. 3.0 seconds)
 * calibrated to standard clinical medical ECG scale:
 * 25 mm/s paper speed, 10 mm/mV voltage deflection.
 */
export function generateECGSvgPath(
  widthPx: number,
  heightPx: number,
  startOffsetSec: number,
  durationSec: number,
  options: ECGSampleOptions
): string {
  const sampleRateHz = 120; // 120 samples/sec for smooth anti-aliased CRT line
  const totalSamples = Math.round(durationSec * sampleRateHz);
  const centerY = heightPx / 2.0;
  // Scale: 1 mV = 35% of half-height
  const pxPerMv = (heightPx * 0.35);

  let pathStr = '';

  for (let i = 0; i <= totalSamples; i++) {
    const t = startOffsetSec + (i / totalSamples) * durationSec;
    const sample = sampleECGVoltage(t, options);
    const x = (i / totalSamples) * widthPx;
    // Invert Y because SVG coordinates increase downwards
    const y = centerY - (sample.totalMillivolts * pxPerMv);

    if (i === 0) {
      pathStr += `M ${x.toFixed(1)},${y.toFixed(1)}`;
    } else {
      pathStr += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
  }

  return pathStr;
}
