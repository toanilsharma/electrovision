/**
 * IEC 61008-1 / IEC 61009-1 Residual Current Device (RCD / RCBO) Pure Factory Engine
 * 
 * Instance-safe factory per R2 & R5:
 * createRCD(cfg) returns an independent RCD protection engine.
 */

import {
  calculateRCDTripTime,
  RCDTripResult,
  RCDRatingType
} from '@/src/utils/iec61008RCD';
import { RCDEngineConfig } from './types';

export interface RCDEngineInstance {
  rating: RCDRatingType;
  iDeltaN: number;
  evaluate: (iFaultMA: number) => RCDTripResult;
  isTrippedAt: (iFaultMA: number, durationMs: number) => boolean;
}

/**
 * Pure Factory function to create an isolated, instance-safe RCD engine.
 */
export function createRCD(cfg: RCDEngineConfig = {}): RCDEngineInstance {
  const rating: RCDRatingType = cfg.rating ?? (cfg.iDeltaN ? cfg.iDeltaN : 'rcbo_30ma');
  
  let iDeltaN = 30;
  if (typeof rating === 'number') {
    iDeltaN = rating;
  } else if (rating === 'rcd_10ma') {
    iDeltaN = 10;
  } else if (rating === 'rcbo_30ma' || rating === 'rcd_30ma_b') {
    iDeltaN = 30;
  } else if (rating === 'rcd_100ma') {
    iDeltaN = 100;
  } else if (cfg.iDeltaN) {
    iDeltaN = cfg.iDeltaN;
  }

  return {
    rating,
    iDeltaN,
    evaluate: (iFaultMA: number) => calculateRCDTripTime(iFaultMA, rating),
    isTrippedAt: (iFaultMA: number, durationMs: number) => {
      const res = calculateRCDTripTime(iFaultMA, rating);
      return res.shouldTrip && durationMs >= res.tripTimeMs;
    }
  };
}

export {
  calculateRCDTripTime,
  type RCDTripResult,
  type RCDRatingType
};
