/**
 * IEC 60479-1:2018 Zone Classification & Curve c3 Digitized Model
 */

export interface IECZoneResult {
  zone: 'AC-1' | 'AC-2' | 'AC-3' | 'AC-4.1' | 'AC-4.2' | 'AC-4.3';
  label: string;
  description: string;
  shortImpact: string;
  color: string;
  badgeStyle: string;
  vfibProbability: string;
}

// Digitized c3 curve anchors from IEC 60479-1:2018 Figure 20
// Pairs of (timeInSeconds, currentInMA)
export const C3_CURVE_ANCHORS = [
  { t: 10.0, c3: 40.0 },
  { t: 1.0, c3: 50.0 },
  { t: 0.5, c3: 63.0 },
  { t: 0.2, c3: 80.0 },
  { t: 0.1, c3: 100.0 },
  { t: 0.05, c3: 120.0 },
  { t: 0.02, c3: 160.0 },
  { t: 0.01, c3: 200.0 }
];

/**
 * Log-log interpolation of curve c3 threshold (in mA) at a given shock duration t (in seconds).
 */
export function getC3Threshold(durationSec: number): number {
  const t = Math.max(0.01, Math.min(10.0, durationSec));
  const anchors = C3_CURVE_ANCHORS;

  if (t >= anchors[0].t) return anchors[0].c3;
  if (t <= anchors[anchors.length - 1].t) return anchors[anchors.length - 1].c3;

  for (let i = 0; i < anchors.length - 1; i++) {
    const a1 = anchors[i];
    const a2 = anchors[i + 1];
    if (t <= a1.t && t >= a2.t) {
      // Log-log linear interpolation
      const logT = Math.log10(t);
      const logT1 = Math.log10(a1.t);
      const logT2 = Math.log10(a2.t);
      const logC1 = Math.log10(a1.c3);
      const logC2 = Math.log10(a2.c3);

      const frac = (logT - logT1) / (logT2 - logT1);
      const logC3 = logC1 + frac * (logC2 - logC1);
      return Math.pow(10, logC3);
    }
  }

  return 50.0;
}

/**
 * Classifies body current (in mA) and duration (in seconds) into IEC 60479-1 Zones (AC-1 to AC-4.3).
 */
export function classifyIECZone(currentMA: number, durationSec: number): IECZoneResult {
  const c1 = 0.5; // Perception threshold (0.5 mA)
  const c2 = 10.0; // Let-go threshold (10 mA)
  const c3 = getC3Threshold(durationSec);

  if (currentMA <= c1) {
    return {
      zone: 'AC-1',
      label: 'AC-1 — Imperceptible Perception Zone',
      description: 'Current is below 0.5 mA perception threshold. No muscle response or risk.',
      shortImpact: 'No perception. Below 0.5mA sensory threshold. Zero physiological risk.',
      color: '#10b981',
      badgeStyle: 'bg-emerald-950 border-emerald-400 text-emerald-300',
      vfibProbability: '0%'
    };
  }

  if (currentMA <= c2) {
    return {
      zone: 'AC-2',
      label: 'AC-2 — Perception & Involuntary Muscle Twitch Zone',
      description: 'Current (0.5–10 mA) causes tingling and involuntary muscle contractions, but letting go remains possible.',
      shortImpact: 'Tingling & muscle twitching (0.5–10mA). Letting go remains possible.',
      color: '#eab308',
      badgeStyle: 'bg-yellow-950 border-yellow-400 text-yellow-200',
      vfibProbability: '0%'
    };
  }

  if (currentMA <= c3) {
    return {
      zone: 'AC-3',
      label: 'AC-3 — Muscle Lock & Respiratory Distress Zone',
      description: 'Current (>10 mA to c3 curve) causes flexor tetanization (cannot let go) and chest muscle cramps. No V-fib.',
      shortImpact: 'Muscle tetanization (>10mA); victim locked to conductor. Reversible cardiac & respiratory distress.',
      color: '#f97316',
      badgeStyle: 'bg-orange-950 border-orange-400 text-amber-100',
      vfibProbability: '0%'
    };
  }

  const c41Max = c3 * 1.5;
  const c42Max = c3 * 2.5;

  if (currentMA <= c41Max) {
    return {
      zone: 'AC-4.1',
      label: 'AC-4.1 — Pathophysiological Trauma (<5% V-Fib Risk)',
      description: 'Pathological effects occur (cardiac arrest risk <5%, reversible arrhythmia, severe burns).',
      shortImpact: 'Organic damage & atrial fibrillation risk (<5% V-fib risk). Reversible cardiac arrhythmia.',
      color: '#f43f5e',
      badgeStyle: 'bg-rose-950 border-rose-400 text-rose-100',
      vfibProbability: '< 5%'
    };
  }

  if (currentMA <= c42Max) {
    return {
      zone: 'AC-4.2',
      label: 'AC-4.2 — Dangerous V-Fib Risk (<50% V-Fib Risk)',
      description: 'Ventricular fibrillation probability up to 50%. Immediate emergency bystander power isolation required.',
      shortImpact: 'High risk of fatal ventricular fibrillation (~50% V-fib risk). Severe thermal burns & asphyxia.',
      color: '#ef4444',
      badgeStyle: 'bg-red-950 border-red-500 text-white',
      vfibProbability: '< 50%'
    };
  }

  return {
    zone: 'AC-4.3',
    label: 'AC-4.3 — Lethal Ventricular Fibrillation Zone (>50% V-Fib)',
    description: 'High probability of fatal ventricular fibrillation (>50%), cardiac arrest, and deep tissue burns.',
    shortImpact: 'Extreme risk of fatal ventricular fibrillation (>50% V-fib risk). Immediate heart arrest.',
    color: '#991b1b',
    badgeStyle: 'bg-red-950 border-2 border-red-500 text-white animate-pulse',
    vfibProbability: '> 50%'
  };
}
