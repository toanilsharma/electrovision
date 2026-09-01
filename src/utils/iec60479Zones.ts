/**
 * IEC 60479-1:2018 Zone Classification & Curve c3 Ventricular Fibrillation (VF) Engine
 * 
 * Implements:
 * - Heart Current Factors (F_H): Hand-to-Hand = 0.4, Left-Hand-to-Feet = 1.0
 * - Mathematical threshold for curve c3 (5% VF probability for 50kg body):
 *   I = 116 / sqrt(t) for t < 1s (clamped to 40mA minimum for t >= 1s)
 * - Defined time-current zones:
 *   AC-1: < 0.5 mA (No perception)
 *   AC-2: 0.5 to 10 mA (Muscle contraction, no harmful physiological effects)
 *   AC-3: 10 mA to c3 (Reversible effects, muscle lock, let-go exceeded)
 *   AC-4.1: c3 to 1.5*c3 (Up to 5% VF probability)
 *   AC-4.2: 1.5*c3 to 2.5*c3 (5–50% VF probability)
 *   AC-4.3: > 2.5*c3 (>50% VF probability)
 */

export interface IECZoneResult {
  zone: 'AC-1' | 'AC-2' | 'AC-3' | 'AC-4.1' | 'AC-4.2' | 'AC-4.3';
  label: string;
  description: string;
  shortImpact: string;
  color: string;
  badgeStyle: string;
  vfibProbability: string;
  heartCurrentFactor: number;
  effectiveHeartCurrent: number;
}

// IEC 60479-1 Table 12 Heart Current Factor (F_H)
export const HEART_CURRENT_FACTORS: Record<string, number> = {
  'hand-to-hand': 0.4,
  'hand-to-foot': 1.0,
  'left-hand-to-feet': 1.0,
  'none': 0.0,
};

/**
 * Calculates curve c3 threshold (in mA) based on IEC 60479-1 / Dalziel 50kg formula:
 * I = 116 / sqrt(t) for t < 1s
 */
export function getC3Threshold(durationSec: number): number {
  const t = Math.max(0.005, durationSec);
  if (t < 1.0) {
    return 116 / Math.sqrt(t);
  }
  return Math.max(40.0, 116 / Math.sqrt(t));
}

/**
 * Classifies body current (in mA) and duration (in seconds) into IEC 60479-1 Zones.
 * Applies Heart Current Factor F_H (0.4 for hand-to-hand, 1.0 for hand-to-foot / left-hand-to-feet).
 */
export function classifyIECZone(
  currentMA: number,
  durationSec: number,
  path: 'hand-to-hand' | 'hand-to-foot' | 'left-hand-to-feet' | 'none' = 'hand-to-foot'
): IECZoneResult {
  const fh = HEART_CURRENT_FACTORS[path] ?? 1.0;
  const effectiveHeartCurrent = currentMA * fh;

  const c1 = 0.5; // Perception threshold (0.5 mA)
  const c2 = 10.0; // Let-go threshold (10 mA)
  const c3 = getC3Threshold(durationSec);

  if (effectiveHeartCurrent < c1) {
    return {
      zone: 'AC-1',
      label: 'AC-1 — Imperceptible Perception Zone (<0.5 mA)',
      description: 'Current is below 0.5 mA perception threshold. No muscle response or physiological risk.',
      shortImpact: 'No perception (<0.5mA). Zero physiological risk.',
      color: '#10b981',
      badgeStyle: 'bg-emerald-950 border-emerald-400 text-emerald-300',
      vfibProbability: '0%',
      heartCurrentFactor: fh,
      effectiveHeartCurrent
    };
  }

  if (effectiveHeartCurrent <= c2) {
    return {
      zone: 'AC-2',
      label: 'AC-2 — Perception & Involuntary Twitch (0.5 - 10 mA)',
      description: 'Current (0.5–10 mA) causes tingling and involuntary muscle contractions; letting go remains possible with no harmful physiological effects.',
      shortImpact: 'Muscle contractions (0.5–10mA). Letting go possible, no harmful physiological effects.',
      color: '#eab308',
      badgeStyle: 'bg-yellow-950 border-yellow-400 text-yellow-200',
      vfibProbability: '0%',
      heartCurrentFactor: fh,
      effectiveHeartCurrent
    };
  }

  if (effectiveHeartCurrent <= c3) {
    return {
      zone: 'AC-3',
      label: 'AC-3 — Muscle Lock & Respiratory Distress (10 mA to Let-Go/c3)',
      description: 'Current (>10 mA to c3 threshold) causes flexor tetanization (cannot let go) and reversible cardiac/respiratory distress with no ventricular fibrillation.',
      shortImpact: 'Reversible effects & muscle lock (>10mA). Cannot let go; no ventricular fibrillation.',
      color: '#f97316',
      badgeStyle: 'bg-orange-950 border-orange-400 text-amber-100',
      vfibProbability: '0%',
      heartCurrentFactor: fh,
      effectiveHeartCurrent
    };
  }

  const c41Max = c3 * 1.5;
  const c42Max = c3 * 2.5;

  if (effectiveHeartCurrent <= c41Max) {
    return {
      zone: 'AC-4.1',
      label: 'AC-4.1 — Pathophysiological Trauma (Up to 5% VF Probability)',
      description: 'Dangerous current exceeding c3 threshold. Ventricular fibrillation probability is up to 5% with reversible arrhythmia risk.',
      shortImpact: 'Up to 5% VF probability. Pathophysiological trauma & reversible arrhythmia.',
      color: '#f43f5e',
      badgeStyle: 'bg-rose-950 border-rose-400 text-rose-100',
      vfibProbability: '< 5%',
      heartCurrentFactor: fh,
      effectiveHeartCurrent
    };
  }

  if (effectiveHeartCurrent <= c42Max) {
    return {
      zone: 'AC-4.2',
      label: 'AC-4.2 — Dangerous V-Fib Risk (5 - 50% VF Probability)',
      description: 'Ventricular fibrillation probability ranges between 5% and 50%. Immediate emergency bystander circuit disconnection required.',
      shortImpact: '5% to 50% VF probability. Severe cardiac fibrillation & asphyxia risk.',
      color: '#ef4444',
      badgeStyle: 'bg-red-950 border-red-500 text-white',
      vfibProbability: '5 - 50%',
      heartCurrentFactor: fh,
      effectiveHeartCurrent
    };
  }

  return {
    zone: 'AC-4.3',
    label: 'AC-4.3 — Lethal Ventricular Fibrillation (>50% VF Probability)',
    description: 'High probability of fatal ventricular fibrillation (>50%), irreversible cardiac arrest, and massive tissue damage.',
    shortImpact: '>50% VF probability. Lethal ventricular fibrillation & immediate cardiac arrest.',
    color: '#991b1b',
    badgeStyle: 'bg-red-950 border-2 border-red-500 text-white animate-pulse',
    vfibProbability: '> 50%',
    heartCurrentFactor: fh,
    effectiveHeartCurrent
  };
}
