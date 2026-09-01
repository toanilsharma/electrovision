import { describe, it, expect } from 'vitest';
import { 
  calculateIEEE1584_2018, 
  calculateIarcForRefVoltage, 
  calculateCF, 
  evaluateNFPA70ECategory,
  getNFPA70EPPEInfo,
  calculateConductorBurnoffTime,
  calculateReleasedArcEnergy,
  calculateRoomTemperatureRise,
  calculateOverpressure
} from '../ieee1584-2018';

describe('IEEE 1584-2018 Arc Flash Physics Engine Unit Tests', () => {
  it('IEEE 1584-2018 Example 1 (Low Voltage 480V VCB Box Enclosure)', () => {
    const result = calculateIEEE1584_2018({
      voltage: 480,
      boltedFaultCurrent: 40.0,
      gap: 32,
      workingDistance: 457.2,
      clearingTimeMs: 50,
      electrodeConfig: 'VCB',
      enclosureWidth: 508,
      enclosureHeight: 508,
      enclosureDepth: 508,
      grounding: 'solidly_grounded'
    });

    expect(result.isValid).toBe(true);
    expect(result.arcingCurrent).toBeGreaterThan(15.0);
    expect(result.arcingCurrent).toBeLessThan(35.0);
    expect(result.incidentEnergy).toBeGreaterThan(0.5);
    expect(result.incidentEnergy).toBeLessThan(20.0);
    expect(result.boundaryRadius).toBeGreaterThan(0.2);
    expect(result.ppeCategory).toBeGreaterThanOrEqual(1);
    expect(result.ppeInfo.requiredClothing.length).toBeGreaterThan(0);
  });

  it('IEEE 1584-2018 Example 2 (Medium Voltage 4.16kV HCB Box Enclosure)', () => {
    const result = calculateIEEE1584_2018({
      voltage: 4160,
      boltedFaultCurrent: 25.0,
      gap: 104,
      workingDistance: 914.4,
      clearingTimeMs: 200,
      electrodeConfig: 'HCB',
      enclosureWidth: 914.4,
      enclosureHeight: 914.4,
      enclosureDepth: 914.4,
      grounding: 'solidly_grounded'
    });

    expect(result.isValid).toBe(true);
    expect(result.arcingCurrent).toBeGreaterThan(15.0);
    expect(result.arcingCurrent).toBeLessThan(25.0);
    expect(result.incidentEnergy).toBeGreaterThan(3.0);
    expect(result.incidentEnergy).toBeLessThan(30.0);
    expect(result.boundaryRadius).toBeGreaterThan(1.0);
  });

  it('NFPA 70E 2024 Category threshold exactness and PPE clothing mapping', () => {
    expect(evaluateNFPA70ECategory(0.8)).toBe(0);
    expect(getNFPA70EPPEInfo(0.8).category).toBe(0);
    expect(getNFPA70EPPEInfo(0.8).requiredClothing[0]).toContain('100% cotton');

    expect(evaluateNFPA70ECategory(3.99)).toBe(1);
    expect(getNFPA70EPPEInfo(3.99).category).toBe(1);

    expect(evaluateNFPA70ECategory(4.01)).toBe(2);
    expect(getNFPA70EPPEInfo(4.01).category).toBe(2);

    expect(evaluateNFPA70ECategory(8.01)).toBe(3);
    expect(getNFPA70EPPEInfo(8.01).category).toBe(3);

    expect(evaluateNFPA70ECategory(25.01)).toBe(4);
    expect(getNFPA70EPPEInfo(25.01).category).toBe(4);

    expect(evaluateNFPA70ECategory(40.01)).toBe(5);
    expect(getNFPA70EPPEInfo(40.01).category).toBe(5);
    expect(getNFPA70EPPEInfo(40.01).name).toContain('Extreme Danger');
  });

  it('Conductor Thermal Burnoff Time t_burnoff calculation', () => {
    const tCu = calculateConductorBurnoffTime('Cu', 120, 20.4);
    expect(tCu).toBeGreaterThan(0.3);
    expect(tCu).toBeLessThan(1.0);

    const tAl = calculateConductorBurnoffTime('Al', 120, 20.4);
    expect(tAl).toBeLessThan(tCu);
  });

  it('Released Energy MJ, TNT kg, and Room ΔT', () => {
    const energy = calculateReleasedArcEnergy(480, 32, 20.4, 2.0);
    expect(energy.releasedMJ).toBeGreaterThan(1.0);
    expect(energy.tntKg).toBeGreaterThan(0.2);

    const room = calculateRoomTemperatureRise(energy.releasedJoules, 27);
    expect(room.deltaT).toBeGreaterThan(10.0);
    expect(room.finalTempC).toBeGreaterThan(35.0);

    const press = calculateOverpressure(energy.releasedMJ, 0.5);
    expect(press.overpressureKpa).toBeGreaterThan(5.0);
    expect(press.isEardrumRisk).toBe(true);
  });
});
