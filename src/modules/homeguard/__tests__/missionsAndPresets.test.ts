import { describe, it, expect, beforeEach } from 'vitest';
import { HOMEGUARD_PRESETS, HomeGuardPreset } from '../data/homeguardPresets';
import {
  getHomeGuardRank,
  recordMissionPassed,
  loadAssessmentState,
  resetAssessmentState
} from '../data/assessmentStorage';
import { createMCB } from '@/src/core/physics/mcbEngine';
import { createRCD } from '@/src/core/physics/rcdEngine';
import { MCBState, TripCause } from '@/src/mcb/types';

describe('HomeGuard Missions, Presets & Assessment Engine (HG6)', () => {
  beforeEach(() => {
    resetAssessmentState();
  });

  it('should define all 5 core preset system instances with expected stamps', () => {
    expect(HOMEGUARD_PRESETS).toHaveLength(6);

    const labels = HOMEGUARD_PRESETS.map(p => p.chipLabel);
    expect(labels).toContain('NORMAL');
    expect(labels).toContain('OVERLOAD');
    expect(labels).toContain('SHORT');
    expect(labels).toContain('CHILD SHOCK');
    expect(labels).toContain('WET BATH');
    expect(labels).toContain('BROKEN EARTH');

    for (const preset of HOMEGUARD_PRESETS) {
      expect(preset.expectedStampText).toBeDefined();
      expect(preset.pointsAwarded).toBe(100);
      expect(preset.targetCircuitId).toBeDefined();
    }
  });

  it('OVERLOAD PRESET: triggers 16A C-curve bimetal countdown to ~2246.7s at 23.2A', () => {
    const overload = HOMEGUARD_PRESETS.find(p => p.chipLabel === 'OVERLOAD')!;
    expect(overload.faultCurrentAmps).toBe(23.2);

    const mcb = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const model = mcb.getRawSimulator().getThermalModel();
    const tripTime = model.calculateTheoreticalTripTime(overload.faultCurrentAmps, 30);

    expect(tripTime).toBeCloseTo(2246.7, 0);
  });

  it('SHORT PRESET: triggers 16A C-curve magnetic instantaneous trip at 250A (<10ms)', () => {
    const short = HOMEGUARD_PRESETS.find(p => p.chipLabel === 'SHORT')!;
    expect(short.faultCurrentAmps).toBe(250.0);

    const mcb = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    const snap = mcb.step(0.01, short.faultCurrentAmps);

    expect(snap.state).not.toBe(MCBState.CLOSED);
    expect(snap.tripCause === TripCause.MAGNETIC || snap.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE).toBe(true);
  });

  it('CHILD SHOCK PRESET: triggers 30mA RCCB trip in <= 40ms at 230mA', () => {
    const childShock = HOMEGUARD_PRESETS.find(p => p.chipLabel === 'CHILD SHOCK')!;
    expect(childShock.leakageCurrentMA).toBe(230.0);

    const rcd = createRCD({ iDeltaN: 30 });
    const res = rcd.evaluate(childShock.leakageCurrentMA);

    expect(res.shouldTrip).toBe(true);
    expect(res.tripTimeMs).toBeLessThanOrEqual(40);
  });

  it('Assessment Engine: records completed missions and calculates ranks up to 500 PTS', () => {
    let state = loadAssessmentState();
    expect(state.totalScore).toBe(0);
    expect(state.rankTitle).toBe('Uncertified Trainee');

    // Complete Mission 1
    state = recordMissionPassed('preset_overload', 100, 'OBSERVED: PASS');
    expect(state.totalScore).toBe(100);
    expect(state.completedPresetIds).toContain('preset_overload');
    expect(state.rankTitle).toBe('Junior Safety Observer (Level 1)');

    // Complete Mission 2
    state = recordMissionPassed('preset_short', 100, 'OBSERVED: PASS');
    expect(state.totalScore).toBe(200);
    expect(state.rankTitle).toBe('Electrical Safety Apprentice (Level 2)');

    // Complete all 5 missions
    recordMissionPassed('preset_child_shock', 100, 'OBSERVED: PASS');
    recordMissionPassed('preset_wet_bath', 100, 'OBSERVED: PASS');
    state = recordMissionPassed('preset_broken_earth', 100, 'OBSERVED: PASS');

    expect(state.totalScore).toBe(500);
    expect(state.completedPresetIds).toHaveLength(5);
    expect(state.rankTitle).toBe('Master Residential Inspector (Level 5)');
  });
});
