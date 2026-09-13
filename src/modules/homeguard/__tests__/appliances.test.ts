import { describe, it, expect } from 'vitest';
import { HOMEGUARD_APPLIANCES, calculatePowerBreakdown } from '../data/homeguardAppliances';

describe('HomeGuard Appliances Registry & Power Calculator (Lot 1)', () => {
  it('defines 10 distinct appliances across all 4 rooms', () => {
    expect(HOMEGUARD_APPLIANCES.length).toBe(10);
    const rooms = new Set(HOMEGUARD_APPLIANCES.map(a => a.room));
    expect(rooms.has('living')).toBe(true);
    expect(rooms.has('kitchen')).toBe(true);
    expect(rooms.has('bathroom')).toBe(true);
    expect(rooms.has('bedroom')).toBe(true);
  });

  it('calculates exact power and amperage breakdown by circuit', () => {
    // Normal preset loads: TV (150W), Living AC (1500W), Refrigerator (200W)
    const active = ['tv_console', 'air_conditioner', 'refrigerator'];
    const breakdown = calculatePowerBreakdown(active);

    expect(breakdown.totalWatts).toBe(1850);
    expect(breakdown.livingWatts).toBe(1650);
    expect(breakdown.kitchenWatts).toBe(200);
    expect(breakdown.totalAmps).toBeCloseTo(8.0, 1);
  });

  it('identifies heavy loads exceeding 16A when Space Heater and Kettle run simultaneously', () => {
    const active = ['tv_console', 'space_heater', 'kettle'];
    const breakdown = calculatePowerBreakdown(active);

    expect(breakdown.totalWatts).toBe(4350);
    // At 230V, 4350W draws ~18.9A
    expect(breakdown.totalAmps).toBeGreaterThan(16);
  });
});
