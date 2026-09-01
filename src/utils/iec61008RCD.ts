/**
 * IEC 61008-1 / IEC 61009-1 Residual Current Device (RCD / RCBO) Trip Time Engine
 * 
 * Standard Limit of Break Times for General Type RCDs (Clause 5.3.12, Table 1):
 * - I_fault < 0.5 * I_Δn: Non-operating current, device will not trip.
 * - I_fault = 1.0 * I_Δn: Maximum trip time = 300 ms.
 * - I_fault = 5.0 * I_Δn: Maximum trip time = 40 ms.
 * - For I_Δn <= I_fault <= 5 * I_Δn: Linear interpolation between 300 ms and 40 ms.
 * - For I_fault > 5 * I_Δn: Trip time = 40 ms.
 */

export interface RCDTripResult {
  shouldTrip: boolean;
  tripTimeMs: number; // Trip delay in ms
  iDeltaN: number;    // Rated residual operating current (mA)
  iFault: number;     // Prospective residual earth leakage current (mA)
  multiple: number;   // iFault / iDeltaN
  citation: string;
}

export type RCDRatingType = 'rcd_10ma' | 'rcbo_30ma' | 'rcd_30ma_b' | 'rcd_100ma' | 'off' | number;

/**
 * Calculates trip delay according to IEC 61008-1 standard break time curves.
 */
export function calculateRCDTripTime(
  iFaultMA: number,
  rcdRating: RCDRatingType
): RCDTripResult {
  if (rcdRating === 'off') {
    return {
      shouldTrip: false,
      tripTimeMs: Infinity,
      iDeltaN: 0,
      iFault: iFaultMA,
      multiple: 0,
      citation: 'RCD disabled (No protection)',
    };
  }

  let iDeltaN = 30; // default 30mA
  if (typeof rcdRating === 'number') {
    iDeltaN = rcdRating;
  } else if (rcdRating === 'rcd_10ma') {
    iDeltaN = 10;
  } else if (rcdRating === 'rcbo_30ma' || rcdRating === 'rcd_30ma_b') {
    iDeltaN = 30;
  } else if (rcdRating === 'rcd_100ma') {
    iDeltaN = 100;
  }

  // Non-operating residual threshold per IEC 61008-1 Clause 5.3.12 (0.5 * I_Δn)
  if (iFaultMA < 0.5 * iDeltaN) {
    return {
      shouldTrip: false,
      tripTimeMs: Infinity,
      iDeltaN,
      iFault: iFaultMA,
      multiple: iFaultMA / iDeltaN,
      citation: `IEC 61008-1: Below non-operating threshold (${(0.5 * iDeltaN).toFixed(1)} mA)`,
    };
  }

  const multiple = iFaultMA / iDeltaN;
  let tripTimeMs = 300;

  if (multiple <= 1.0) {
    tripTimeMs = 300;
  } else if (multiple >= 5.0) {
    tripTimeMs = 40;
  } else {
    // Linear interpolation between I_Δn (300 ms) and 5 * I_Δn (40 ms)
    const frac = (multiple - 1.0) / (5.0 - 1.0); // 0.0 to 1.0
    tripTimeMs = Math.round(300 - frac * (300 - 40));
  }

  return {
    shouldTrip: true,
    tripTimeMs,
    iDeltaN,
    iFault: iFaultMA,
    multiple,
    citation: `IEC 61008-1 Table 1: ${iDeltaN}mA RCD break time ${tripTimeMs}ms at ${(multiple).toFixed(2)}x I_Δn`,
  };
}
