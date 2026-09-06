import { describe, it, expect } from 'vitest';
import {
  calculateChestResistance,
  calculateRecoilDepth,
  stepHemodynamics,
  INITIAL_HEMODYNAMICS,
  calculateBTEWaveform,
  calculateAMSA,
  calculateElectricalBurn,
} from '../cprPhysics';

describe('cprPhysics - Category A Biophysical Models', () => {
  describe('1. Biomechanical Viscoelastic Chest Wall Physics', () => {
    it('calculates zero force at 0 cm depth', () => {
      const { forceNewtons, stiffnessNPerCm } = calculateChestResistance(0, 0);
      expect(forceNewtons).toBe(0);
      expect(stiffnessNPerCm).toBe(35);
    });

    it('exhibits nonlinear stiffening as compression reaches 5.4 cm', () => {
      const shallow = calculateChestResistance(2.0, 0);
      const ideal = calculateChestResistance(5.4, 0);
      // F = 35 * 5.4 + 1.85 * (5.4)^3 = 189 + 291 = 480 N
      expect(ideal.forceNewtons).toBeGreaterThan(400);
      expect(ideal.forceNewtons).toBeLessThan(600);
      expect(ideal.stiffnessNPerCm).toBeGreaterThan(shallow.stiffnessNPerCm * 2);
    });

    it('accounts for viscoelastic velocity damping', () => {
      const staticComp = calculateChestResistance(5.0, 0);
      const dynamicComp = calculateChestResistance(5.0, 40); // 40 cm/s rapid stroke
      expect(dynamicComp.forceNewtons).toBeGreaterThan(staticComp.forceNewtons);
    });

    it('simulates exponential recoil return', () => {
      const current = 5.0;
      const target = 0;
      const recoil1 = calculateRecoilDepth(target, current, 0.05);
      const recoil2 = calculateRecoilDepth(target, recoil1, 0.1);
      expect(recoil1).toBeLessThan(current);
      expect(recoil2).toBeLessThan(recoil1);
      expect(recoil2).toBeCloseTo(0, 0);
    });
  });

  describe('2. Hemodynamics & Coronary Perfusion Pressure (CPP) Engine', () => {
    it('starts at baseline unperfused state (CPP = 0 mmHg)', () => {
      expect(INITIAL_HEMODYNAMICS.coronaryPerfusionPressure).toBe(0);
      expect(INITIAL_HEMODYNAMICS.cerebralPerfusionPct).toBe(0);
    });

    it('progressively builds CPP > 15 mmHg over 20 consecutive strokes', () => {
      let state = { ...INITIAL_HEMODYNAMICS };
      for (let i = 0; i < 20; i++) {
        state = stepHemodynamics(state, 0.5, true, 5.4, 110);
      }
      expect(state.coronaryPerfusionPressure).toBeGreaterThanOrEqual(15);
      expect(state.cerebralPerfusionPct).toBeGreaterThan(50);
      expect(state.cardiacOutputLpm).toBeGreaterThan(1.0);
    });

    it('decays arterial pressure and CPP when compressions pause', () => {
      let state = { ...INITIAL_HEMODYNAMICS };
      for (let i = 0; i < 20; i++) {
        state = stepHemodynamics(state, 0.5, true, 5.4, 110);
      }
      const peakCPP = state.coronaryPerfusionPressure;

      // Simulate a pause of 5 seconds without compressions
      state.lastCompressionTimestamp = Date.now() - 5000;
      for (let t = 0; t < 10; t++) {
        state = stepHemodynamics(state, 0.5, false, 0, 0);
      }
      expect(state.coronaryPerfusionPressure).toBeLessThan(peakCPP * 0.5);
    });
  });

  describe('3. BTE Defibrillation Discharge Physics (IEC 60601-2-4)', () => {
    it('calculates biphasic truncated waveform with energy ~150J at 75 Ohms', () => {
      const res = calculateBTEWaveform();
      expect(res.peakCurrentA).toBeCloseTo(21.3, 1); // 1600V / 75 Ohms = 21.3A
      expect(res.deliveredEnergyJoules).toBeGreaterThan(130);
      expect(res.deliveredEnergyJoules).toBeLessThan(180);
      expect(res.isEffectiveCurrent).toBe(true);
      expect(res.points.length).toBeGreaterThan(50);
      // Phase 1 positive, Phase 2 negative
      expect(res.points[0].voltageV).toBeGreaterThan(1000);
      expect(res.points[res.points.length - 1].voltageV).toBeLessThan(0);
    });

    it('adapts peak current inversely with patient impedance (25 to 175 Ohms)', () => {
      const lowImp = calculateBTEWaveform({
        capacitanceUf: 140,
        chargeVoltageV: 1600,
        patientImpedanceOhms: 30,
        phase1DurationMs: 6.0,
        interphaseDelayMs: 0.5,
        phase2DurationMs: 4.0,
      });
      const highImp = calculateBTEWaveform({
        capacitanceUf: 140,
        chargeVoltageV: 1600,
        patientImpedanceOhms: 150,
        phase1DurationMs: 6.0,
        interphaseDelayMs: 0.5,
        phase2DurationMs: 4.0,
      });
      expect(lowImp.peakCurrentA).toBeGreaterThan(highImp.peakCurrentA * 4);
      expect(highImp.isEffectiveCurrent).toBe(false); // 1600/150 = 10.6A < 15A threshold
    });
  });

  describe('4. Ventricular Fibrillation AMSA Analysis', () => {
    it('indicates high shock success probability for Coarse VF with AMSA > 21', () => {
      const amsa = calculateAMSA(20.0, 0, 26.0);
      expect(amsa.rhythmQuality).toBe('coarse_vf');
      expect(amsa.shockSuccessProbability).toBeGreaterThan(75);
    });

    it('warns that Fine VF requires CPR before shock', () => {
      const amsa = calculateAMSA(3.0, 5, 10.0);
      expect(amsa.rhythmQuality).toBe('fine_vf');
      expect(amsa.shockSuccessProbability).toBeLessThan(25);
      expect(amsa.recommendation).toContain('MANDATORY');
    });
  });

  describe('5. Thermodynamic Joule Heating & Electrical Burn Depth', () => {
    it('calculates multi-layer damage for 230V household contact', () => {
      const burn = calculateElectricalBurn(230, 0.4, 0.23); // 230V, 0.4s, 230mA
      expect(burn.joulesThermalEnergy).toBeGreaterThan(15);
      expect(burn.layers.length).toBe(5);
      expect(burn.isCompartmentSyndrome).toBe(false);
    });

    it('triggers compartment syndrome warning and cola urine for high voltage 11kV contact', () => {
      const burn = calculateElectricalBurn(11000, 0.5, 5.0); // 11kV, 0.5s, 5A arc/contact
      expect(burn.joulesThermalEnergy).toBeGreaterThan(20000);
      expect(burn.compartmentPressureMmhg).toBeGreaterThan(30);
      expect(burn.isCompartmentSyndrome).toBe(true);
      expect(burn.myoglobinuriaRisk).toBe('fatal_renal_shutdown');
      expect(burn.urineColor).toBe('#451a03'); // dark cola
    });
  });
});
