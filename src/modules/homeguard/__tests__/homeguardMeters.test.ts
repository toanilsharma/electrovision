import { describe, it, expect } from 'vitest';
import { calculateCircuitPower, MAINS_VOLTAGE_V, C2_MAX_SAFE_WATTS } from '../utils/homeguardMeters';

describe('HomeGuard Meters Single Source of Truth', () => {
  it('correctly calculates 4350W @ 230V as exactly 18.9A', () => {
    // TV (150W) + Space Heater (2000W) + Kettle (2200W) = 4350W
    const metrics = calculateCircuitPower(['tv_console', 'space_heater', 'kettle']);
    expect(metrics.totalWatts).toBe(4350);
    expect(metrics.currentAmps).toBe(18.9);
    expect(metrics.isOverloaded).toBe(true);
  });

  it('correctly matches 145% overload scenario with 23.2A @ 230V', () => {
    // TV (150W) + Heater (2000W) + Kettle (2200W) + Hair Dryer (986W) = 5336W
    const metrics = calculateCircuitPower(['tv_console', 'space_heater', 'kettle', 'hair_dryer']);
    expect(metrics.totalWatts).toBe(5336);
    expect(metrics.currentAmps).toBe(23.2); // 23.2A / 16A = 1.45 = 145%
    expect(metrics.percentage).toBe(145);
  });

  it('evaluates safe baseline under 3680W as not overloaded', () => {
    const metrics = calculateCircuitPower(['tv_console']);
    expect(metrics.totalWatts).toBe(150);
    expect(metrics.currentAmps).toBe(0.7);
    expect(metrics.isOverloaded).toBe(false);
    expect(metrics.maxSafeWatts).toBe(C2_MAX_SAFE_WATTS);
    expect(metrics.voltageV).toBe(MAINS_VOLTAGE_V);
  });
});
