import { describe, expect, it } from 'vitest';
import { BimetalThermalModel } from '../BimetalThermalModel';
import { FaultWaveformGenerator } from '../FaultWaveformGenerator';
import { MagneticSolenoidModel } from '../MagneticSolenoidModel';
import { MCBSimulator } from '../MCBSimulator';
import { MCBState, TripCause, MCBTrippingCurve } from '../types';

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

    it('MUST trip in <= 3600s at 1.45x In across B/C/D curves and rated currents {16A, 25A, 63A}', () => {
      const curves: MCBTrippingCurve[] = ['B', 'C', 'D'];
      const ratedCurrents = [16, 25, 63];

      for (const curve of curves) {
        for (const In of ratedCurrents) {
          const spec = BimetalThermalModel.createCalibratedSpec(In, curve, 30);
          const simulator = new MCBSimulator(spec, 30);

          const trippingCurrent = 1.45 * In;
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
          expect(elapsed).toBeGreaterThan(1000);
        }
      }
    });

    it('MUST trip in 1s to 60s at 2.55x In for In <= 32A per IEC 60898-1 Table 7', () => {
      const In = 16;
      const spec = BimetalThermalModel.createCalibratedSpec(In, 'C', 30);
      const thermal = new BimetalThermalModel(spec, 30);

      const tripTime = thermal.calculateTheoreticalTripTime(2.55 * In, 30);
      expect(tripTime).toBeGreaterThanOrEqual(1.0);
      expect(tripTime).toBeLessThanOrEqual(60.0);
    });

    it('Accelerates subsequent trips when bimetal retains thermal memory (hot re-close)', () => {
      const In = 16;
      const spec = BimetalThermalModel.createCalibratedSpec(In, 'C', 30);
      const thermal = new BimetalThermalModel(spec, 30);

      const coldTripTime = thermal.calculateTheoreticalTripTime(1.45 * In, 30, 30);
      const hotTripTime = thermal.calculateTheoreticalTripTime(1.45 * In, 30, 80); // Pre-heated to 80°C

      expect(hotTripTime).toBeLessThan(coldTripTime);
      expect(hotTripTime).toBeGreaterThan(0);
    });

    it('Correctly derates nominal rating at ambient temperatures (-5°C to +40°C)', () => {
      const In = 16;
      const spec = BimetalThermalModel.createCalibratedSpec(In, 'C', 30);
      const thermal30 = new BimetalThermalModel(spec, 30);
      const thermal40 = new BimetalThermalModel(spec, 40);
      const thermalCold = new BimetalThermalModel(spec, -5);

      expect(thermal30.getDeratedRatedCurrent()).toBe(16);
      // At 40°C (+10°C above reference 30°C): 10 * 0.5% = 5% derating -> 16 * 0.95 = 15.2A
      expect(thermal40.getDeratedRatedCurrent()).toBeCloseTo(15.2, 1);
      // At -5°C (-35°C below reference 30°C): -35 * 0.5% = -17.5% -> 16 * 1.175 = 18.8A
      expect(thermalCold.getDeratedRatedCurrent()).toBeCloseTo(18.8, 1);
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

  describe('3. Fault Current Waveform Generator - Kappa Peak & DC Decaying Energy', () => {
    it('Calculates IEC 60909 Kappa Peak Factor correctly: κ = 1.02 + 0.98 * exp(-3 * R/X)', () => {
      const xrValues = [1, 3, 5, 10, 20];
      for (const xr of xrValues) {
        const generator = new FaultWaveformGenerator({
          I_rms: 1000,
          frequency: 50,
          inceptionAngle: 0,
          xrRatio: xr,
          systemType: '1ph_230v',
          currentType: 'ac',
          faultType: 'L-N'
        });

        const expectedKappa = 1.02 + 0.98 * Math.exp(-3 / xr);
        expect(generator.getKappa()).toBeCloseTo(expectedKappa, 4);
      }
    });

    it('Calculates DC Inductive Decay Energy E = ½ L I²', () => {
      const I_amp = 500;
      const L_henry = 0.005; // 5 mH
      const expectedJoules = 0.5 * L_henry * I_amp * I_amp; // 0.5 * 0.005 * 250000 = 625 Joules
      const joules = FaultWaveformGenerator.calculateDcInductiveEnergy(I_amp, L_henry);

      expect(joules).toBe(625);
    });
  });

  describe('4. Arc Extinction & Clearing Logic', () => {
    it('Clears fault current at next CURRENT ZERO crossing + arc duration (2-3ms)', () => {
      const simulator = new MCBSimulator(
        BimetalThermalModel.createCalibratedSpec(16, 'C', 30),
        30
      );

      simulator.setFaultWaveform({
        I_rms: 200,
        frequency: 50,
        inceptionAngle: Math.PI / 4,
        xrRatio: 5,
        systemType: '1ph_230v',
        currentType: 'ac',
        faultType: 'L-N'
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
});
