/**
 * homeguardMeters.ts
 * 
 * Single Source of Truth for Electrical Calculations in HomeGuard:
 * - Constant Voltage V = 230V
 * - Base Breaker Current In = 16A (Living Room C2)
 * - Safe Max Power = 16A * 230V = 3680W
 * - Current I = P / V (4350W @ 230V = exactly 18.9A)
 * - Overload Scenario (145%) = 5336W @ 230V = exactly 23.2A
 */

export const MAINS_VOLTAGE_V = 230;
export const C2_BREAKER_RATING_A = 16;
export const C2_MAX_SAFE_WATTS = C2_BREAKER_RATING_A * MAINS_VOLTAGE_V; // 3680W

/**
 * Standardized appliance power ratings for Living Room Sockets (C2)
 */
export const APPLIANCE_POWER_MAP: Record<string, number> = {
  tv_console: 150,        // 0.65A
  space_heater: 2000,     // 8.70A
  kettle: 2200,           // 9.57A
  air_conditioner: 1500,  // 6.52A
  water_geyser: 2000,     // 8.70A (Bathroom Geyser)
  otg_oven: 1400,         // 6.09A (Kitchen OTG Oven)
  microwave: 1200,        // 5.22A
  refrigerator: 200,      // 0.87A
  exhaust_fan: 50,        // 0.22A
  bed_lamp: 100,          // 0.43A
  hair_dryer: 986         // 4.29A
};

export interface CircuitPowerMetrics {
  totalWatts: number;
  currentAmps: number;
  percentage: number;
  isOverloaded: boolean;
  maxSafeWatts: number;
  voltageV: number;
}

/**
 * Recomputes Power, Current, and Percentage strictly from appliance states:
 * I = P / V
 */
export function calculateCircuitPower(activeApplianceIds: string[]): CircuitPowerMetrics {
  let totalWatts = 0;

  for (const id of activeApplianceIds) {
    if (APPLIANCE_POWER_MAP[id] !== undefined) {
      totalWatts += APPLIANCE_POWER_MAP[id];
    }
  }

  // Exact physics: I = P / V
  const currentAmps = Number((totalWatts / MAINS_VOLTAGE_V).toFixed(1));
  const percentage = Math.round((currentAmps / C2_BREAKER_RATING_A) * 100);
  const isOverloaded = currentAmps > C2_BREAKER_RATING_A;

  return {
    totalWatts,
    currentAmps,
    percentage,
    isOverloaded,
    maxSafeWatts: C2_MAX_SAFE_WATTS,
    voltageV: MAINS_VOLTAGE_V
  };
}
