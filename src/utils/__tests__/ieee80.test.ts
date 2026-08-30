import { describe, it, expect } from 'vitest';
import { calculateCs, calculateIEEE80, getPhysiologicalBodyImpact } from '../ieee80';

describe('IEEE Std 80-2000 Physics Engine Unit Tests', () => {
  it('IEEE 80 Eq. 89: calculates surface layer derating factor Cs correctly', () => {
    const Cs = calculateCs(2500, 100, 0.10);
    expect(Cs).toBeCloseTo(0.702, 3);
  });

  it('IEEE 80 Example 1 (70 kg body mass, ts = 0.5s): validates tolerable touch & step voltages', () => {
    const res = calculateIEEE80({
      bodyWeightKg: 70,
      clearingTimeSec: 0.5,
      surfaceResistivity: 2500,
      soilResistivity: 100,
      layerThicknessM: 0.10,
      faultCurrentKA: 22,
      gridResistanceOhm: 0.5
    });

    expect(res.Cs).toBeCloseTo(0.702, 3);
    expect(res.IB_amp).toBeCloseTo(0.222, 3);
    expect(res.E_touch_tolerable).toBeGreaterThan(800);
    expect(res.E_touch_tolerable).toBeLessThan(815);
    expect(res.E_step_tolerable).toBeGreaterThan(2550);
    expect(res.E_step_tolerable).toBeLessThan(2570);
  });

  it('IEEE 80 Example 2 (50 kg body mass, ts = 0.5s): validates tolerable touch & step voltages', () => {
    const res = calculateIEEE80({
      bodyWeightKg: 50,
      clearingTimeSec: 0.5,
      surfaceResistivity: 3000,
      soilResistivity: 100,
      layerThicknessM: 0.10,
      faultCurrentKA: 20,
      gridResistanceOhm: 0.5
    });

    expect(res.Cs).toBeCloseTo(0.700, 3);
    expect(res.IB_amp).toBeCloseTo(0.164, 3);
    expect(res.E_touch_tolerable).toBeGreaterThan(675);
    expect(res.E_touch_tolerable).toBeLessThan(685);
    expect(res.E_step_tolerable).toBeGreaterThan(2220);
    expect(res.E_step_tolerable).toBeLessThan(2240);
  });

  it('GPR calculation: verifies GPR = If * Rg', () => {
    const res = calculateIEEE80({
      bodyWeightKg: 50,
      clearingTimeSec: 0.5,
      surfaceResistivity: 3000,
      soilResistivity: 100,
      faultCurrentKA: 22,
      gridResistanceOhm: 0.5
    });

    expect(res.GPR_volts).toBe(11000);
    expect(res.GPR_kV).toBe(11.0);
  });

  it('Potential Profile V(x): calculates geometric hemispherical V(x) and step/touch potentials', () => {
    const res = calculateIEEE80({
      bodyWeightKg: 50,
      clearingTimeSec: 0.5,
      surfaceResistivity: 3000,
      soilResistivity: 100,
      faultCurrentKA: 22,
      gridResistanceOhm: 0.5
    });

    const v1 = res.calcVx(1.0);
    const v2 = res.calcVx(2.0);

    expect(v1).toBeGreaterThan(0);
    expect(v1).toBeLessThan(res.GPR_volts);
    expect(v2).toBeLessThan(v1);

    const actualStep = res.calcActualStep(1.0);
    expect(actualStep).toBeCloseTo(v1 - v2, 1);

    const actualTouch = res.calcActualTouch(1.0);
    expect(actualTouch).toBeCloseTo(res.GPR_volts - v1, 1);
  });

  it('PPE EH Boots series resistance modeling: boots add series resistance in step vs touch paths', () => {
    const res = calculateIEEE80({
      bodyWeightKg: 50,
      clearingTimeSec: 0.5,
      surfaceResistivity: 3000,
      soilResistivity: 100,
      faultCurrentKA: 22,
      gridResistanceOhm: 0.5,
      hasEHBoots: true
    });

    const vStep = res.calcActualStep(2.0);
    const bodyNoBoots = res.calcBodyCurrent(vStep, true, false, false);
    const bodyWithBoots = res.calcBodyCurrent(vStep, true, true, false);

    expect(bodyWithBoots.rBodyTotalOhm).toBeGreaterThan(bodyNoBoots.rBodyTotalOhm + 19000);
    expect(bodyWithBoots.iBodymA).toBeLessThan(bodyNoBoots.iBodymA);
  });

  it('IEC 60479-1 & IEEE 80 physiological impact assessment: classifies body current into standard zones', () => {
    const impactSafe = getPhysiologicalBodyImpact(0.2, true, 164);
    expect(impactSafe.zoneCode).toBe('AC-1');

    const impactMild = getPhysiologicalBodyImpact(5.0, true, 164);
    expect(impactMild.zoneCode).toBe('AC-2');

    const impactTetany = getPhysiologicalBodyImpact(20.0, true, 164);
    expect(impactTetany.zoneCode).toBe('AC-3');
    expect(impactTetany.affectedOrgans).toContain('Quadriceps');

    const impactFibrillation = getPhysiologicalBodyImpact(200.0, false, 164);
    expect(impactFibrillation.zoneCode).toBe('AC-4.2');
    expect(impactFibrillation.affectedOrgans).toContain('Heart (Ventricular Myocardium)');
  });
});
