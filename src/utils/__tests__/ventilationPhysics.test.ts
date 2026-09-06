import { describe, it, expect } from 'vitest';
import { evaluateAirwayPatency, calculateBVMVentilation } from '../ventilationPhysics';

describe('Ventilation & Airway Mechanics Physics', () => {
  describe('evaluateAirwayPatency', () => {
    it('detects occluded airway when head is neutral/flat (0 deg)', () => {
      const state = evaluateAirwayPatency(0, false);
      expect(state.isAirwayOpen).toBe(false);
      expect(state.airwayResistanceCmH2O).toBeGreaterThan(40);
    });

    it('opens airway with proper head-tilt chin-lift (>= 30 deg)', () => {
      const state = evaluateAirwayPatency(35, false);
      expect(state.isAirwayOpen).toBe(true);
      expect(state.airwayResistanceCmH2O).toBeLessThan(5);
    });

    it('maintains open airway with trauma-safe Jaw Thrust even at 0 deg tilt', () => {
      const state = evaluateAirwayPatency(0, true);
      expect(state.isAirwayOpen).toBe(true);
      expect(state.airwayResistanceCmH2O).toBeCloseTo(3.0);
    });
  });

  describe('calculateBVMVentilation', () => {
    it('diverts majority of air to stomach (gastric distension) when airway is occluded', () => {
      const result = calculateBVMVentilation({
        squeezeVolumeMl: 600,
        squeezeDurationSec: 1.0,
        headTiltAngleDeg: 5,
        jawThrustActive: false,
        currentGastricVolumeMl: 0,
        currentSpO2: 70,
        hasSpontaneousCirculation: false,
      });

      expect(result.airwayState.isAirwayOpen).toBe(false);
      expect(result.gastricVolumeMl).toBeGreaterThan(450);
      expect(result.pulmonaryVolumeMl).toBeLessThan(150);
      expect(result.clinicalFeedback.status).toBe('occluded');
      expect(result.clinicalFeedback.warning).toContain('Head-Tilt');
    });

    it('delivers optimal tidal volume (~500-600 mL) to lungs when airway is open', () => {
      const result = calculateBVMVentilation({
        squeezeVolumeMl: 550,
        squeezeDurationSec: 1.0,
        headTiltAngleDeg: 35,
        jawThrustActive: false,
        currentGastricVolumeMl: 0,
        currentSpO2: 72,
        hasSpontaneousCirculation: false,
      });

      expect(result.airwayState.isAirwayOpen).toBe(true);
      expect(result.pulmonaryVolumeMl).toBeGreaterThan(500);
      expect(result.gastricVolumeMl).toBeLessThan(50);
      expect(result.chestRisePercentage).toBeGreaterThanOrEqual(90);
      expect(result.spO2AfterBreath).toBeGreaterThan(72);
      expect(result.clinicalFeedback.status).toBe('optimal');
    });

    it('flags hyperventilation and elevated pressure when squeezed too fast or too much', () => {
      const result = calculateBVMVentilation({
        squeezeVolumeMl: 900,
        squeezeDurationSec: 0.4, // violent rapid squeeze
        headTiltAngleDeg: 35,
        jawThrustActive: false,
        currentGastricVolumeMl: 50,
        currentSpO2: 80,
        hasSpontaneousCirculation: false,
      });

      expect(result.clinicalFeedback.status).toBe('hyperventilation');
      expect(result.peakInspiratoryPressureCmH2O).toBeGreaterThan(20);
      expect(result.clinicalFeedback.warning).toContain('venous return');
    });

    it('flags gastric distension danger when cumulative stomach volume >= 300 mL', () => {
      const result = calculateBVMVentilation({
        squeezeVolumeMl: 500,
        squeezeDurationSec: 1.0,
        headTiltAngleDeg: 35,
        jawThrustActive: false,
        currentGastricVolumeMl: 320,
        currentSpO2: 80,
        hasSpontaneousCirculation: false,
      });

      expect(result.clinicalFeedback.status).toBe('gastric_distension');
      expect(result.clinicalFeedback.warning).toContain('regurgitation');
    });
  });
});
