import { describe, expect, it } from 'vitest';
import { BimetalThermalModel } from '../BimetalThermalModel';
import { FaultWaveformGenerator } from '../FaultWaveformGenerator';
import { MagneticSolenoidModel } from '../MagneticSolenoidModel';
import { MCBSimulator } from '../MCBSimulator';
import { MCBState, TripCause } from '../types';

describe('IEC 60898-1 MCB Physics Engine', () => {
  describe('1. Thermal Model (Bimetal) - IEC 60898-1 Standard Compliance', () => {
    it('MUST NEVER trip at 1.13x In (Conventional non-tripping current Int) even after 7200s (2 hours)', () => {
      const In = 16; // 16A MCB
      const spec = BimetalThermalModel.createCalibratedSpec(In, 'C', 30);
      const simulator = new MCBSimulator(spec, 30);

      const nonTrippingCurrent = 1.13 * In; // 18.08A
      // Simulate for 7200 seconds (2 hours)
      const snapshot = simulator.runThermalSimulation(nonTrippingCurrent, 7200, 10.0);

      expect(snapshot.state).toBe(MCBState.CLOSED);
      expect(snapshot.thermal.isTripped).toBe(false);
      expect(snapshot.tripCause).toBe(TripCause.NONE);

      // Verify steady state temperature is below trip threshold (130°C)
      const steadyStateTemp = simulator.getThermalModel().getSteadyStateTemp(nonTrippingCurrent);
      expect(steadyStateTemp).toBeLessThan(130.0);
      expect(snapshot.thermal.temperature).toBeLessThan(130.0);
    });

    it('MUST trip in <= 3600s at 1.45x In (Conventional tripping current It) for In <= 63A', () => {
      const ratedCurrents = [6, 16, 32, 63];

      for (const In of ratedCurrents) {
        const spec = BimetalThermalModel.createCalibratedSpec(In, 'C', 30);
        const simulator = new MCBSimulator(spec, 30);

        const trippingCurrent = 1.45 * In;
        // Simulate step-by-step
        let elapsed = 0;
        const stepSec = 1.0;
        let trippedSnapshot = null;

        while (elapsed <= 3600) {
          elapsed += stepSec;
          const snap = simulator.step(stepSec, trippingCurrent);
          if (snap.thermal.isTripped) {
            trippedSnapshot = snap;
            break;
          }
        }

        expect(trippedSnapshot).not.toBeNull();
        expect(trippedSnapshot?.thermal.isTripped).toBe(true);
        expect(elapsed).toBeLessThanOrEqual(3600);
        // Calibrated time should be around ~2246 seconds
        expect(elapsed).toBeGreaterThan(1000);
      }
    });

    it('Correctly derates nominal rating at ambient temperatures above reference 30°C', () => {
      const In = 16;
      const spec = BimetalThermalModel.createCalibratedSpec(In, 'C', 30);
      const thermal30 = new BimetalThermalModel(spec, 30);
      const thermal45 = new BimetalThermalModel(spec, 45);

      expect(thermal30.getDeratedRatedCurrent()).toBe(16);
      // At 45°C (+15°C above reference 30°C): 15 * 0.5% = 7.5% derating -> 16 * 0.925 = 14.8A
      expect(thermal45.getDeratedRatedCurrent()).toBeCloseTo(14.8, 1);

      // Higher ambient temperature accelerates thermal trip time at 1.45x In
      const time30 = thermal30.calculateTheoreticalTripTime(1.45 * In, 30);
      const time45 = thermal45.calculateTheoreticalTripTime(1.45 * In, 45);

      expect(time45).toBeLessThan(time30);
    });
  });

  describe('2. Magnetic Solenoid Model - Instantaneous Peak & Tripping Curves', () => {
    it('Evaluates Instantaneous Peak Current for Curve B (3x - 5x In)', () => {
      const In = 10;
      const model = new MagneticSolenoidModel(In, 'B');
      const peakRated = Math.SQRT2 * In; // 14.14A peak

      // Below 3x In peak (e.g. 2.5x peak) -> NEVER trip
      const lowResult = model.evaluate(2.5 * peakRated);
      expect(lowResult.isTripped).toBe(false);
      expect(lowResult.isToleranceZone).toBe(false);

      // Above 5x In peak (e.g. 5.5x peak) -> MUST trip
      const highResult = model.evaluate(5.5 * peakRated);
      expect(highResult.isTripped).toBe(true);
      expect(highResult.isToleranceZone).toBe(false);

      // Inside tolerance band (e.g. 4.0x peak) -> Tolerance Zone flag active
      const midResult = model.evaluate(4.0 * peakRated, 0.1);
      expect(midResult.isToleranceZone).toBe(true);
      expect(midResult.toleranceProbability).toBeCloseTo(0.5, 2);
    });

    it('Evaluates Instantaneous Peak Current for Curve C (5x - 10x In)', () => {
      const In = 20;
      const model = new MagneticSolenoidModel(In, 'C');
      const peakRated = Math.SQRT2 * In;

      // 4x In peak -> No trip
      expect(model.evaluate(4 * peakRated).isTripped).toBe(false);

      // 12x In peak -> Must trip
      expect(model.evaluate(12 * peakRated).isTripped).toBe(true);

      // 7x In peak -> Tolerance Zone flag active
      const tol = model.evaluate(7 * peakRated);
      expect(tol.isToleranceZone).toBe(true);
      expect(tol.multipleOfIn).toBeCloseTo(7.0, 2);
    });

    it('Evaluates Instantaneous Peak Current for Curve D (10x - 20x In)', () => {
      const In = 32;
      const model = new MagneticSolenoidModel(In, 'D');
      const peakRated = Math.SQRT2 * In;

      // 8x In peak -> No trip
      expect(model.evaluate(8 * peakRated).isTripped).toBe(false);

      // 25x In peak -> Must trip
      expect(model.evaluate(25 * peakRated).isTripped).toBe(true);

      // 15x In peak -> Tolerance Zone
      expect(model.evaluate(15 * peakRated).isToleranceZone).toBe(true);
    });
  });

  describe('3. Fault Current Waveform Generator - Decaying DC Offset', () => {
    it('Generates waveform i(t) with decaying DC offset and accurate parameters', () => {
      const generator = new FaultWaveformGenerator({
        I_rms: 1000,
        frequency: 50,
        inceptionAngle: 0, // 0 rad inception -> maximum DC offset
        xrRatio: 10
      });

      expect(generator.getPeakCurrent()).toBeCloseTo(1414.21, 1);
      // tau = (X/R) / (2*pi*f) = 10 / (100 * pi) ≈ 0.03183s
      expect(generator.getTau()).toBeCloseTo(0.03183, 3);

      // At t = 0, i(0) should be 0 due to DC offset cancellation of AC initial value
      const i0 = generator.generateTransientCurrent(0);
      expect(i0).toBeCloseTo(0, 1);

      // At t > 0, DC offset decays exponentially
      const dc0 = generator.getDcOffset(0);
      const dc1 = generator.getDcOffset(0.05); // 50ms later (~1.57 time constants)
      expect(Math.abs(dc1)).toBeLessThan(Math.abs(dc0));
    });
  });

  describe('4. Arc Extinction & Clearing Logic', () => {
    it('Clears fault current at next CURRENT ZERO crossing + arc duration (2-3ms)', () => {
      const simulator = new MCBSimulator(
        BimetalThermalModel.createCalibratedSpec(16, 'C', 30),
        30
      );

      // Set heavy magnetic fault current (200A RMS -> ~283A peak = 17.6x peak > 10x Curve C)
      simulator.setFaultWaveform({
        I_rms: 200,
        frequency: 50,
        inceptionAngle: Math.PI / 4,
        xrRatio: 5
      });

      const dt = 0.0001; // 0.1ms timestep resolution
      let snap = simulator.step(dt);
      let unlatchedTime = -1;
      let openClearedTime = -1;

      for (let i = 0; i < 200; i++) {
        snap = simulator.step(dt);
        if (snap.state === MCBState.UNLATCHED && unlatchedTime < 0) {
          unlatchedTime = snap.time;
        }
        if (snap.state === MCBState.OPEN_CLEARED) {
          openClearedTime = snap.time;
          break;
        }
      }

      expect(snap.state).toBe(MCBState.OPEN_CLEARED);
      expect(snap.current).toBe(0);
      expect(openClearedTime).toBeGreaterThan(unlatchedTime);
    });
  });

  describe('5. Let-through Energy (I²t) and Peak Let-through Current (Ip)', () => {
    it('Calculates cumulative I²t and Ip in real-time during short-circuit clearing', () => {
      const simulator = new MCBSimulator(
        BimetalThermalModel.createCalibratedSpec(16, 'B', 30),
        30
      );

      simulator.setFaultWaveform({
        I_rms: 500,
        frequency: 50,
        inceptionAngle: 0,
        xrRatio: 3
      });

      const dt = 0.0001;
      let snap = simulator.step(dt);

      while (snap.state !== MCBState.OPEN_CLEARED && snap.time < 0.1) {
        snap = simulator.step(dt);
      }

      expect(snap.letThrough.i2t).toBeGreaterThan(0);
      expect(snap.letThrough.peakLetThroughCurrent).toBeGreaterThan(500);
      expect(snap.letThrough.clearingTime).toBeGreaterThan(0);
    });
  });
});
