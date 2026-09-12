/**
 * Home Safety Audit Report Data Model & Electrician Shopping List (HG7)
 * 
 * Provides per-circuit verdicts, standard compliance grading,
 * standardized electrician Bill of Materials (BOM) with exact part strings,
 * and shareable URL query state management (?scenario=&breaker=).
 */

import { CircuitAuditVerdictEntry, ElectricianPartItem } from '../../../core/ui/export/snapshotComposite';
import { ResidentialScenario } from './residentialProfile';
import { HomeGuardPreset } from './homeguardPresets';

export type BreakerConfigurationMode = 'rccb_mcb' | 'mcb_only' | 'rcbo' | 'velcb';

export interface AuditReportModel {
  propertyTitle: string;
  inspectionDate: string;
  systemType: string;
  breakerConfiguration: BreakerConfigurationMode;
  breakerConfigLabel: string;
  activeScenarioTitle: string;
  overallGrade: 'GRADE A (EXCELLENT)' | 'GRADE B (ACCEPTABLE)' | 'GRADE F (CRITICAL HAZARD)';
  safetyScore: number; // 0 - 100
  verdicts: CircuitAuditVerdictEntry[];
  shoppingList: ElectricianPartItem[];
  findingsSummary: string[];
  remediationAdvice: string;
}

/**
 * Standardized Electrician Shopping List with exact part strings per prompt specification:
 * - "20 A, 30 mA, Type A RCBO, IEC 61009-1"
 * - "32 A C-curve MCB + 40 A 30 mA RCCB, IEC 60898-1/61008-1"
 */
export const ELECTRICIAN_SHOPPING_ITEMS: ElectricianPartItem[] = [
  {
    partString: '32 A C-curve MCB + 40 A 30 mA RCCB, IEC 60898-1/61008-1',
    circuitTarget: 'Main Distribution Incomer (Whole House)',
    quantity: 1,
    standard: 'IEC 60898-1 / IEC 61008-1',
    notes: '2-Pole 230V Incomer MCB (32A) + Dual-Pole Type A 30mA residual current protection (40A rated contacts).'
  },
  {
    partString: '20 A, 30 mA, Type A RCBO, IEC 61009-1',
    circuitTarget: 'C3 Kitchen Heavy Sockets (Microwave, Kettle, Toaster)',
    quantity: 1,
    standard: 'IEC 61009-1',
    notes: 'Single-module 1P+N residual breaker with overcurrent protection. Guarantees branch isolation.'
  },
  {
    partString: '16 A, 30 mA, Type A RCBO, IEC 61009-1',
    circuitTarget: 'C2 Living Room Sockets (Heater, TV, Multi-plugs)',
    quantity: 1,
    standard: 'IEC 61009-1',
    notes: 'Eliminates whole-house blackouts on socket trips; disconnects live and neutral in <=40ms.'
  },
  {
    partString: '10 A, 30 mA, Type A RCBO, IEC 61009-1',
    circuitTarget: 'C1 Lighting Circuit (Entire House LED & Luminaires)',
    quantity: 1,
    standard: 'IEC 61009-1',
    notes: 'Dedicated shock & fire protection for ceiling lighting pendants and switches.'
  },
  {
    partString: '16 mm² Main Protective Bonding Conductor (Green/Yellow), IEC 60364-5-54',
    circuitTarget: 'Main Earthing Terminal (MET) to Water & Gas Services',
    quantity: 1,
    standard: 'IEC 60364-5-54 / BS 7671',
    notes: 'High-integrity copper earthing strap ensuring equipotential plane across all exposed metal.'
  }
];

/**
 * Evaluates live circuit states and generates comprehensive per-circuit verdicts
 */
export function generateAuditReport(
  scenario: ResidentialScenario,
  breakerMode: BreakerConfigurationMode,
  circuitStates: Record<string, { state: string; currentAmps: number; tripCause?: string; bimetalTempC?: number }>,
  livingCountdownSec?: number,
  leakageCurrentMA?: number
): AuditReportModel {
  const verdicts: CircuitAuditVerdictEntry[] = [];
  const findings: string[] = [];
  let safetyScore = 100;

  const isMCBOnly = breakerMode === 'mcb_only';
  const isVELCB = breakerMode === 'velcb';
  const isRCBO = breakerMode === 'rcbo';

  const leakage = leakageCurrentMA || scenario.leakageCurrentMA || 0;
  const isChildShockScenario = scenario.id === 'child_touch_shock' || leakage >= 200;
  const isWaterLeakScenario = scenario.id === 'kettle_earth_leakage' || (leakage > 0 && leakage < 200);
  const isOverloadScenario = scenario.faultType === 'thermal_overload';
  const isShortScenario = scenario.faultType === 'short_circuit';

  // 1. MAIN INCOMER / RCD VERDICT
  let incomerStatus: 'COMPLIANT' | 'TRIPPED_SAFE' | 'CRITICAL_HAZARD' | 'OVERLOAD' = 'COMPLIANT';
  let incomerClearing = 'Continuous';
  let incomerRating = '40A / 30mA Type A (IEC 61008-1)';
  let incomerStandard = 'IEC 61008-1';

  if (isMCBOnly) {
    incomerRating = '32A C-curve MCB Only (NO RCD)';
    incomerStandard = 'IEC 60898-1 (Non-compliant for Shock)';
    if (isChildShockScenario || isWaterLeakScenario) {
      incomerStatus = 'CRITICAL_HAZARD';
      incomerClearing = '∞ (BLIND TO SHOCK)';
      safetyScore -= 50;
      findings.push('CRITICAL: Breaker lacks 30mA residual current protection. Completely blind to ground leakage current.');
    }
  } else if (isVELCB) {
    incomerRating = '60A Voltage-Operated ELCB (OBSOLETE)';
    incomerStandard = 'Pre-IEC 61008 (OBSOLETE)';
    if (scenario.id === 'broken_earth_velcb' || scenario.id === 'preset_broken_earth') {
      incomerStatus = 'CRITICAL_HAZARD';
      incomerClearing = '∞ (COIL 0V FAILS)';
      safetyScore -= 60;
      findings.push('CRITICAL: Severed earth wire dropped sensing coil voltage to 0V. Obsolete v-ELCB failed to trip!');
    } else {
      incomerStatus = 'TRIPPED_SAFE';
      incomerClearing = '35 ms';
    }
  } else if (isRCBO) {
    incomerRating = '32A Main Switch Isolator + RCBO Array';
    incomerStandard = 'IEC 60947-3 / IEC 61009-1';
    incomerStatus = 'COMPLIANT';
    incomerClearing = 'Sub-circuit isolated';
  } else {
    // RCCB + MCB
    if (leakage >= 30) {
      incomerStatus = 'TRIPPED_SAFE';
      incomerClearing = leakage >= 150 ? '≤ 40 ms' : '≈ 268 ms';
      findings.push(`RCD Disconnected within ${incomerClearing}. Life-saving personnel protection active.`);
    }
  }

  verdicts.push({
    circuitId: 'main_incomer',
    name: 'Main Consumer Incomer (RCD/Switch)',
    rating: incomerRating,
    loadAmps: scenario.totalLoadAmps,
    leakageMA: leakage,
    status: incomerStatus,
    clearingTime: incomerClearing,
    standard: incomerStandard
  });

  // 2. CIRCUIT 1: LIGHTING
  verdicts.push({
    circuitId: 'c1_lighting',
    name: 'Circuit 1: Lighting (LED / Lamps)',
    rating: isRCBO ? '10A / 30mA Type A RCBO' : '10A Curve B MCB',
    loadAmps: 0.8,
    leakageMA: 0,
    status: 'COMPLIANT',
    clearingTime: 'Continuous (Normal)',
    standard: isRCBO ? 'IEC 61009-1' : 'IEC 60898-1'
  });

  // 3. CIRCUIT 2: LIVING ROOM SOCKETS
  let c2Status: 'COMPLIANT' | 'TRIPPED_SAFE' | 'CRITICAL_HAZARD' | 'OVERLOAD' = 'COMPLIANT';
  let c2Clearing = 'Continuous';

  if (isOverloadScenario) {
    c2Status = livingCountdownSec && livingCountdownSec <= 0 ? 'TRIPPED_SAFE' : 'OVERLOAD';
    c2Clearing = 't ≈ 2246.7 s (Bimetal)';
    safetyScore -= 15;
    findings.push('Living room sockets subjected to 23.2A (1.45× In) load. Bimetal thermal trip curve protects 2.5mm² wire.');
  } else if (isShortScenario) {
    c2Status = 'TRIPPED_SAFE';
    c2Clearing = '< 10 ms (Magnetic Solenoid)';
    findings.push('Instantaneous magnetic unlatching verified under 250A bolted short circuit.');
  } else if (isChildShockScenario) {
    if (isMCBOnly) {
      c2Status = 'CRITICAL_HAZARD';
      c2Clearing = '∞ (BLIND TO 230mA)';
      safetyScore -= 40;
      findings.push('FATAL: 16A MCB requires >16A to trip. 230mA child shock current flows indefinitely (Ventricular Fibrillation Zone AC-4.2).');
    } else {
      c2Status = 'TRIPPED_SAFE';
      c2Clearing = '≤ 40 ms (RCCB/RCBO)';
    }
  }

  verdicts.push({
    circuitId: 'c2_living_sockets',
    name: 'Circuit 2: Living Room Sockets',
    rating: isRCBO ? '16A / 30mA Type A RCBO' : '16A Curve C MCB',
    loadAmps: scenario.totalLoadAmps,
    leakageMA: isChildShockScenario ? 230 : 0,
    status: c2Status,
    clearingTime: c2Clearing,
    standard: isRCBO ? 'IEC 61009-1' : 'IEC 60898-1'
  });

  // 4. CIRCUIT 3: KITCHEN HEAVY SOCKETS
  let c3Status: 'COMPLIANT' | 'TRIPPED_SAFE' | 'CRITICAL_HAZARD' | 'OVERLOAD' = 'COMPLIANT';
  let c3Clearing = 'Continuous';

  if (isWaterLeakScenario) {
    if (isMCBOnly) {
      c3Status = 'CRITICAL_HAZARD';
      c3Clearing = '∞ (NO RCD)';
      safetyScore -= 35;
      findings.push('DANGER: Water ingress leaking 45mA to metal chassis. User touching kettle will receive severe electrical shock.');
    } else if (isVELCB && (scenario.id === 'broken_earth_velcb' || scenario.id === 'preset_broken_earth')) {
      c3Status = 'CRITICAL_HAZARD';
      c3Clearing = '∞ (Broken CPC Flaw)';
      safetyScore -= 35;
      findings.push('DANGER: Severed ground wire prevents voltage coil trip on obsolete ELCB.');
    } else {
      c3Status = 'TRIPPED_SAFE';
      c3Clearing = '≈ 268 ms (IEC 61008)';
    }
  }

  verdicts.push({
    circuitId: 'c3_kitchen_sockets',
    name: 'Circuit 3: Kitchen Heavy Sockets',
    rating: isRCBO ? '20A / 30mA Type A RCBO' : '16A Curve C MCB',
    loadAmps: 6.5,
    leakageMA: isWaterLeakScenario ? 45 : 0,
    status: c3Status,
    clearingTime: c3Clearing,
    standard: isRCBO ? 'IEC 61009-1' : 'IEC 60898-1'
  });

  // Compute Overall Grade
  safetyScore = Math.max(0, Math.min(100, safetyScore));
  let overallGrade: 'GRADE A (EXCELLENT)' | 'GRADE B (ACCEPTABLE)' | 'GRADE F (CRITICAL HAZARD)' = 'GRADE A (EXCELLENT)';

  if (safetyScore < 60 || isMCBOnly || (isVELCB && incomerStatus === 'CRITICAL_HAZARD')) {
    overallGrade = 'GRADE F (CRITICAL HAZARD)';
  } else if (safetyScore < 85 || isOverloadScenario) {
    overallGrade = 'GRADE B (ACCEPTABLE)';
  }

  const breakerLabels: Record<BreakerConfigurationMode, string> = {
    rccb_mcb: 'Dual-Protection: 40A 30mA RCCB + MCBs (IEC 61008-1)',
    mcb_only: 'Legacy Unprotected: MCB Only (NO 30mA RCD)',
    rcbo: 'Gold Standard: All-RCBO Independent Protection (IEC 61009-1)',
    velcb: 'Obsolete: Voltage-Operated ELCB (Pre-IEC 61008)'
  };

  const remediationAdvice = isMCBOnly
    ? 'URGENT: Replace consumer unit with modern 30mA Type A RCD protection immediately. Current installation violates IEC 60364-4-41.'
    : isVELCB
    ? 'URGENT: Decommission voltage-operated ELCB. Severed earth conductors create lethal conditions. Replace with current-operated RCCB or RCBO.'
    : 'System meets international IEC safety standards. Maintain annual 30mA push-button test regimen.';

  return {
    propertyTitle: 'HOMEGUARD™ RESIDENTIAL PROPERTY SAFETY AUDIT',
    inspectionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    systemType: '230V AC TN-S (Single Phase 50Hz)',
    breakerConfiguration: breakerMode,
    breakerConfigLabel: breakerLabels[breakerMode],
    activeScenarioTitle: scenario.title,
    overallGrade,
    safetyScore,
    verdicts,
    shoppingList: ELECTRICIAN_SHOPPING_ITEMS,
    findingsSummary: findings.length > 0 ? findings : ['All circuits functioning within nominal thermal and dielectric thresholds.'],
    remediationAdvice
  };
}

/**
 * URL query state management (?scenario=&breaker=)
 */
export interface HomeGuardUrlState {
  scenario?: string;
  breaker?: BreakerConfigurationMode;
}

export function parseHomeGuardUrlParams(searchStr?: string): HomeGuardUrlState {
  if (typeof window === 'undefined' && searchStr === undefined) return {};
  const search = searchStr !== undefined ? searchStr : (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(search);

  const result: HomeGuardUrlState = {};

  const rawScenario = params.get('scenario')?.toLowerCase();
  if (rawScenario) {
    if (rawScenario === 'overload' || rawScenario.includes('overload')) {
      result.scenario = 'winter_overload_145';
    } else if (rawScenario === 'short' || rawScenario.includes('short')) {
      result.scenario = 'damaged_cord_short';
    } else if (rawScenario === 'child_shock' || rawScenario === 'child' || rawScenario.includes('shock')) {
      result.scenario = 'child_touch_shock';
    } else if (rawScenario === 'wet_bath' || rawScenario === 'bath' || rawScenario.includes('wet') || rawScenario.includes('leak')) {
      result.scenario = 'kettle_earth_leakage';
    } else if (rawScenario === 'broken_earth' || rawScenario.includes('earth') || rawScenario.includes('velcb')) {
      result.scenario = 'broken_earth_velcb';
    } else {
      result.scenario = rawScenario;
    }
  }

  const rawBreaker = params.get('breaker')?.toLowerCase();
  if (rawBreaker) {
    if (rawBreaker === 'mcb' || rawBreaker === 'mcb_only') {
      result.breaker = 'mcb_only';
    } else if (rawBreaker === 'rcbo') {
      result.breaker = 'rcbo';
    } else if (rawBreaker === 'velcb' || rawBreaker === 'elcb') {
      result.breaker = 'velcb';
    } else if (rawBreaker === 'rccb' || rawBreaker === 'rccb_mcb') {
      result.breaker = 'rccb_mcb';
    }
  }

  return result;
}

/**
 * Formats clean URL parameter values
 */
export function scenarioToQuerySlug(scenarioId: string): string {
  if (scenarioId === 'winter_overload_145' || scenarioId === 'preset_overload') return 'overload';
  if (scenarioId === 'damaged_cord_short' || scenarioId === 'preset_short') return 'short';
  if (scenarioId === 'child_touch_shock' || scenarioId === 'preset_child_shock') return 'child_shock';
  if (scenarioId === 'kettle_earth_leakage' || scenarioId === 'preset_wet_bath') return 'wet_bath';
  if (scenarioId === 'broken_earth_velcb' || scenarioId === 'preset_broken_earth') return 'broken_earth';
  return scenarioId;
}

export function buildHomeGuardShareableUrl(scenarioId: string, breakerMode: BreakerConfigurationMode): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('scenario', scenarioToQuerySlug(scenarioId));
  url.searchParams.set('breaker', breakerMode);
  return url.toString();
}

export function updateHomeGuardUrl(scenarioId: string, breakerMode: BreakerConfigurationMode): void {
  if (typeof window === 'undefined') return;
  const slug = scenarioToQuerySlug(scenarioId);
  const currentParams = new URLSearchParams(window.location.search);
  
  if (currentParams.get('scenario') !== slug || currentParams.get('breaker') !== breakerMode) {
    currentParams.set('scenario', slug);
    currentParams.set('breaker', breakerMode);
    const newRelativePathQuery = window.location.pathname + '?' + currentParams.toString();
    window.history.replaceState(null, '', newRelativePathQuery);
  }
}
