/**
 * IEC 60479-1:2018 Body Current & Electrophysiology Pure Factory Engine
 * 
 * Computes deterministic body impedance, prospective shock current, and physiological
 * hazard zones per IEC 60479-1:2018 (Tables 1, D.1, Figure 20).
 */

import {
  calculateIECImpedance,
  IEC_60479_IMPEDANCE_TABLE,
  CONTACT_AREA_FACTORS,
  SKIN_CONDITION_FACTORS,
  HAND_TO_FOOT_FACTOR
} from '@/src/utils/iec60479Impedance';
import {
  classifyIECZone,
  getC3Threshold,
  HEART_CURRENT_FACTORS,
  IECZoneResult
} from '@/src/utils/iec60479Zones';
import {
  BodyCurrentConfig,
  BodyCurrentResult
} from './types';

/**
 * Pure function: Computes standard body current and physiological impact.
 */
export function bodyCurrent(cfg: BodyCurrentConfig): BodyCurrentResult {
  const {
    voltage,
    skinCondition = 'dry',
    contactArea = 'large',
    path = 'hand-to-hand',
    percentile = 50,
    durationMs = 500,
    profileMultiplier = 1.0
  } = cfg;

  // 1. Calculate standard-compliant total body impedance Z_T
  const impedanceBreakdown = calculateIECImpedance(voltage, {
    percentile,
    contactArea,
    skinCondition,
    path,
    profileMultiplier
  });

  const totalZ = Math.max(100, impedanceBreakdown.totalZ);

  // 2. Ohm's Law: Prospective touch current I_b (mA)
  const currentA = voltage / totalZ;
  const currentMA = currentA * 1000;

  // 3. Classify into IEC 60479-1:2018 Physiological Zones (AC-1 to AC-4.3)
  const durationSec = durationMs / 1000;
  const zone = classifyIECZone(currentMA, durationSec, path);

  // 4. Estimate ventricular fibrillation risk percentage
  let fibrillationProbabilityPercent = 0;
  if (zone.zone === 'AC-4.1') {
    fibrillationProbabilityPercent = 5;
  } else if (zone.zone === 'AC-4.2') {
    fibrillationProbabilityPercent = 50;
  } else if (zone.zone === 'AC-4.3') {
    fibrillationProbabilityPercent = 95;
  }

  return {
    voltage,
    totalZ,
    currentMA,
    currentA,
    zone: zone as any,
    impedanceBreakdown,
    fibrillationProbabilityPercent
  };
}

export {
  calculateIECImpedance,
  classifyIECZone,
  getC3Threshold,
  HEART_CURRENT_FACTORS,
  IEC_60479_IMPEDANCE_TABLE,
  CONTACT_AREA_FACTORS,
  SKIN_CONDITION_FACTORS,
  HAND_TO_FOOT_FACTOR,
  type IECZoneResult
};
