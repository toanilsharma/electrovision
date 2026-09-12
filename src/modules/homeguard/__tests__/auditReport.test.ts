/**
 * Unit Tests for Home Safety Audit Report, Shopping List & URL State (HG7)
 */

import { describe, it, expect } from 'vitest';
import {
  generateAuditReport,
  ELECTRICIAN_SHOPPING_ITEMS,
  parseHomeGuardUrlParams,
  scenarioToQuerySlug
} from '../data/auditReportData';
import { RESIDENTIAL_SCENARIOS } from '../data/residentialProfile';

describe('Home Safety Audit Report & BOM (HG7)', () => {
  const childShockScenario = RESIDENTIAL_SCENARIOS.find(s => s.id === 'child_touch_shock') || {
    id: 'child_touch_shock',
    title: 'Child Wet-Skin Contact Shock',
    summary: 'Child touches live wire with wet skin',
    description: '230mA touch current directly through body',
    plainEnglishExplanation: 'Child shock',
    targetCircuitId: 'c2_living_sockets' as const,
    faultType: 'normal' as const,
    totalLoadAmps: 4.2,
    leakageCurrentMA: 230,
    appliancesActive: ['tv_console'],
    recommendation: 'Use 30mA RCD'
  };

  const overloadScenario = RESIDENTIAL_SCENARIOS.find(s => s.id === 'winter_overload_145') || {
    id: 'winter_overload_145',
    title: 'Winter Room Overload',
    summary: 'Overload 1.45x In',
    description: '23.2A load',
    plainEnglishExplanation: 'Too many appliances',
    targetCircuitId: 'c2_living_sockets' as const,
    faultType: 'thermal_overload' as const,
    totalLoadAmps: 23.2,
    appliancesActive: ['space_heater'],
    recommendation: 'Spread appliances'
  };

  it('contains the exact required electrician shopping list part strings', () => {
    const partStrings = ELECTRICIAN_SHOPPING_ITEMS.map(i => i.partString);
    
    // Exact requested part strings from prompt:
    expect(partStrings).toContain('20 A, 30 mA, Type A RCBO, IEC 61009-1');
    expect(partStrings).toContain('32 A C-curve MCB + 40 A 30 mA RCCB, IEC 60898-1/61008-1');
  });

  it('evaluates MCB-only house as GRADE F (CRITICAL HAZARD) during child shock', () => {
    const dummyStates = {
      c1_lighting: { state: 'CLOSED', currentAmps: 0.8 },
      c2_living_sockets: { state: 'CLOSED', currentAmps: 4.2 },
      c3_kitchen_sockets: { state: 'CLOSED', currentAmps: 0 },
      main_rccb: { state: 'CLOSED', currentAmps: 4.2 }
    };

    const report = generateAuditReport(childShockScenario, 'mcb_only', dummyStates, 0, 230);
    expect(report.overallGrade).toBe('GRADE F (CRITICAL HAZARD)');
    expect(report.safetyScore).toBeLessThan(60);

    const incomer = report.verdicts.find(v => v.circuitId === 'main_incomer');
    expect(incomer?.status).toBe('CRITICAL_HAZARD');
    expect(incomer?.clearingTime).toContain('∞');

    const c2 = report.verdicts.find(v => v.circuitId === 'c2_living_sockets');
    expect(c2?.status).toBe('CRITICAL_HAZARD');
  });

  it('evaluates RCCB+MCB house as safe with clearing time <=40ms during child shock', () => {
    const dummyStates = {
      c1_lighting: { state: 'CLOSED', currentAmps: 0.8 },
      c2_living_sockets: { state: 'OPEN', currentAmps: 0 },
      c3_kitchen_sockets: { state: 'CLOSED', currentAmps: 0 },
      main_rccb: { state: 'OPEN', currentAmps: 0 }
    };

    const report = generateAuditReport(childShockScenario, 'rccb_mcb', dummyStates, 0, 230);
    expect(report.overallGrade).toBe('GRADE A (EXCELLENT)');
    const incomer = report.verdicts.find(v => v.circuitId === 'main_incomer');
    expect(incomer?.status).toBe('TRIPPED_SAFE');
    expect(incomer?.clearingTime).toBe('≤ 40 ms');
  });

  it('evaluates thermal overload circuit with bimetal clearing time ~2246.7s', () => {
    const dummyStates = {
      c1_lighting: { state: 'CLOSED', currentAmps: 0.8 },
      c2_living_sockets: { state: 'CLOSED', currentAmps: 23.2 },
      c3_kitchen_sockets: { state: 'CLOSED', currentAmps: 0 },
      main_rccb: { state: 'CLOSED', currentAmps: 23.2 }
    };

    const report = generateAuditReport(overloadScenario, 'rccb_mcb', dummyStates, 1500, 0);
    const c2 = report.verdicts.find(v => v.circuitId === 'c2_living_sockets');
    expect(c2?.status).toBe('OVERLOAD');
    expect(c2?.clearingTime).toContain('2246.7');
  });

  it('correctly parses shareable URL query parameters (?scenario=&breaker=)', () => {
    const parsed1 = parseHomeGuardUrlParams('?scenario=child_shock&breaker=mcb_only');
    expect(parsed1.scenario).toBe('child_touch_shock');
    expect(parsed1.breaker).toBe('mcb_only');

    const parsed2 = parseHomeGuardUrlParams('?scenario=overload&breaker=rccb');
    expect(parsed2.scenario).toBe('winter_overload_145');
    expect(parsed2.breaker).toBe('rccb_mcb');

    const parsed3 = parseHomeGuardUrlParams('?scenario=short&breaker=rcbo');
    expect(parsed3.scenario).toBe('damaged_cord_short');
    expect(parsed3.breaker).toBe('rcbo');

    const parsed4 = parseHomeGuardUrlParams('?scenario=broken_earth&breaker=velcb');
    expect(parsed4.scenario).toBe('broken_earth_velcb');
    expect(parsed4.breaker).toBe('velcb');
  });

  it('maps scenario IDs to concise query slugs', () => {
    expect(scenarioToQuerySlug('winter_overload_145')).toBe('overload');
    expect(scenarioToQuerySlug('damaged_cord_short')).toBe('short');
    expect(scenarioToQuerySlug('child_touch_shock')).toBe('child_shock');
    expect(scenarioToQuerySlug('kettle_earth_leakage')).toBe('wet_bath');
    expect(scenarioToQuerySlug('broken_earth_velcb')).toBe('broken_earth');
  });
});
