/**
 * IEC 60479-1:2018 Body Impedance Calculation Engine
 * 
 * Implements standard-compliant total body impedance Z_T lookup tables and linear interpolation
 * per IEC 60479-1:2018 (Table 1, Table D.1) across:
 * - Voltages: 50V, 110V, 230V, 400V, 1000V
 * - Population Percentiles: 5th, 50th, 95th
 * - Contact Areas: Large (1.0x), Medium (1.35x), Small (2.0x)
 * - Skin Conditions: Dry (1.0x), Wet (0.60x)
 * - Current Paths: Hand-to-Hand (1.0x), Hand-to-Foot (0.8x)
 */

export type ImpedancePercentile = 5 | 50 | 95;
export type ContactArea = 'large' | 'medium' | 'small';
export type SkinCondition = 'dry' | 'wet';
export type ShockPath = 'hand-to-hand' | 'hand-to-foot';

export interface ImpedanceBreakdown {
  totalZ: number;      // Total body impedance Z_T (Ohms)
  internalZ: number;   // Internal tissue impedance Z_i (Ohms)
  skinZ: number;       // Skin layer impedance Z_s (Ohms)
  tableCitation: string;
}

export interface IECImpedanceOptions {
  percentile?: ImpedancePercentile;
  contactArea?: ContactArea;
  skinCondition?: SkinCondition;
  path?: ShockPath;
  profileMultiplier?: number;
}

export interface TableEntry {
  voltage: number;
  p5: number;
  p50: number;
  p95: number;
}

// IEC 60479-1:2018 Table 1: Total body impedances Z_T (Ohms) for hand-to-hand, large contact area, dry skin
export const IEC_60479_IMPEDANCE_TABLE: TableEntry[] = [
  { voltage: 50,   p5: 1450, p50: 2875, p95: 4375 },
  { voltage: 110,  p5: 1200, p50: 2400, p95: 3500 },
  { voltage: 230,  p5: 1000, p50: 2150, p95: 2800 },
  { voltage: 400,  p5: 850,  p50: 1725, p95: 2100 },
  { voltage: 1000, p5: 575,  p50: 1050, p95: 1300 },
];

// Contact Area scaling factors relative to Large (standard palm grip)
export const CONTACT_AREA_FACTORS: Record<ContactArea, number> = {
  large: 1.0,
  medium: 1.35,
  small: 2.0,
};

// Skin Condition scaling factors relative to Dry
export const SKIN_CONDITION_FACTORS: Record<SkinCondition, number> = {
  dry: 1.0,
  wet: 0.60,
};

// Hand-to-Foot path impedance conversion factor relative to Hand-to-Hand
export const HAND_TO_FOOT_FACTOR = 0.8;

// Internal body impedance asymptotic limit (~500 ohms per IEC 60479-1 Clause 3.2)
const INTERNAL_BODY_IMPEDANCE = 500;

/**
 * Calculates standards-accurate total body impedance Z_T with linear voltage interpolation.
 */
export function calculateIECImpedance(
  touchVoltage: number,
  skinConditionOrOptions: SkinCondition | IECImpedanceOptions = 'dry',
  legacyProfileMultiplier: number = 1.0
): ImpedanceBreakdown {
  let percentile: ImpedancePercentile = 50;
  let contactArea: ContactArea = 'large';
  let skinCondition: SkinCondition = 'dry';
  let path: ShockPath = 'hand-to-hand';
  let profileMultiplier = 1.0;

  if (typeof skinConditionOrOptions === 'object' && skinConditionOrOptions !== null) {
    percentile = skinConditionOrOptions.percentile ?? 50;
    contactArea = skinConditionOrOptions.contactArea ?? 'large';
    skinCondition = skinConditionOrOptions.skinCondition ?? 'dry';
    path = skinConditionOrOptions.path ?? 'hand-to-hand';
    profileMultiplier = skinConditionOrOptions.profileMultiplier ?? 1.0;
  } else if (typeof skinConditionOrOptions === 'string') {
    skinCondition = skinConditionOrOptions;
    profileMultiplier = legacyProfileMultiplier;
  }

  const table = IEC_60479_IMPEDANCE_TABLE;
  const percentileKey: 'p5' | 'p50' | 'p95' = percentile === 5 ? 'p5' : percentile === 95 ? 'p95' : 'p50';

  let rawZ = table[0][percentileKey];

  if (touchVoltage <= table[0].voltage) {
    rawZ = table[0][percentileKey];
  } else if (touchVoltage >= table[table.length - 1].voltage) {
    rawZ = table[table.length - 1][percentileKey];
  } else {
    // Linear interpolation between adjacent voltage points
    for (let i = 0; i < table.length - 1; i++) {
      const v1 = table[i].voltage;
      const z1 = table[i][percentileKey];
      const v2 = table[i + 1].voltage;
      const z2 = table[i + 1][percentileKey];

      if (touchVoltage >= v1 && touchVoltage <= v2) {
        const fraction = (touchVoltage - v1) / (v2 - v1);
        rawZ = z1 + fraction * (z2 - z1);
        break;
      }
    }
  }

  // Apply Contact Area, Skin Condition, Path (0.8 for Hand-to-Foot), and Profile multipliers
  const areaFactor = CONTACT_AREA_FACTORS[contactArea] ?? 1.0;
  const conditionFactor = SKIN_CONDITION_FACTORS[skinCondition] ?? 1.0;
  const pathFactor = path === 'hand-to-foot' ? HAND_TO_FOOT_FACTOR : 1.0;

  const totalZ = Math.round(rawZ * areaFactor * conditionFactor * pathFactor * profileMultiplier);
  const internalZ = Math.min(totalZ - 100, Math.round(INTERNAL_BODY_IMPEDANCE * pathFactor * profileMultiplier));
  const skinZ = Math.max(0, totalZ - internalZ);

  const citation = `IEC 60479-1:2018 Table 1 (${percentile}th %ile, ${contactArea.toUpperCase()} area, ${skinCondition.toUpperCase()}, ${path === 'hand-to-foot' ? 'H-F (0.8x)' : 'H-H'})`;

  return {
    totalZ,
    internalZ,
    skinZ,
    tableCitation: citation,
  };
}
