/**
 * Core Physics Types
 * 
 * Shared interfaces for pure factory physics engines:
 * - MCB (IEC 60898-1)
 * - RCD (IEC 61008-1 / IEC 61009-1)
 * - Body Current & Shock (IEC 60479-1:2018)
 * - Short Circuit (IEC 60909 / IEC 60364-4-43)
 * - Grounding Step & Touch (IEEE Std 80-2000)
 */

export * from '@/src/mcb/types';
export * from '@/src/utils/iec61008RCD';
export * from '@/src/utils/iec60479Impedance';
export * from '@/src/utils/iec60479Zones';
export * from '@/src/utils/iec60909';
export * from '@/src/utils/ieee80';

// Factory Configuration Interfaces
export interface MCBEngineConfig {
  In?: number;
  curve?: 'B' | 'C' | 'D';
  ambientTemp?: number;
}

export interface RCDEngineConfig {
  rating?: 'rcd_10ma' | 'rcbo_30ma' | 'rcd_30ma_b' | 'rcd_100ma' | 'off' | number;
  iDeltaN?: number; // mA
}

export interface BodyCurrentConfig {
  voltage: number;
  skinCondition?: 'dry' | 'wet';
  contactArea?: 'large' | 'medium' | 'small';
  path?: 'hand-to-hand' | 'hand-to-foot';
  percentile?: 5 | 50 | 95;
  frequency?: number; // Hz, 50/60
  durationMs?: number;
  profileMultiplier?: number;
}

export interface BodyCurrentResult {
  voltage: number;
  totalZ: number;
  currentMA: number;
  currentA: number;
  zone: import('@/src/utils/iec60479Zones').IECZoneResult;
  impedanceBreakdown: import('@/src/utils/iec60479Impedance').ImpedanceBreakdown;
  fibrillationProbabilityPercent: number;
}
