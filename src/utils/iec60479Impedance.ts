/**
 * IEC 60479-1:2018 Body Impedance Calculation Engine
 * 
 * Provides standards-accurate multi-dimensional interpolation of total body impedance Z_T
 * based on IEC 60479-1 Tables 10–13 for 50th percentile human population across touch voltages (25V–1000V).
 */

export interface ImpedanceBreakdown {
  totalZ: number;      // Total body impedance Z_T (Ohms)
  internalZ: number;   // Internal tissue impedance Z_i (Ohms)
  skinZ: number;       // Skin layer impedance Z_s (Ohms)
  tableCitation: string;
}

// IEC 60479-1 Table 10: Total body impedance Z_T for AC 50/60 Hz, dry skin, hand-to-hand or hand-to-foot (50th percentile)
const TABLE_10_DRY_ANCHORS = [
  { voltage: 25, totalZ: 3250 },
  { voltage: 50, totalZ: 2625 },
  { voltage: 125, totalZ: 1750 },
  { voltage: 220, totalZ: 1350 },
  { voltage: 400, totalZ: 950 },
  { voltage: 700, totalZ: 750 },
  { voltage: 1000, totalZ: 650 }
];

// IEC 60479-1 Table 13: Total body impedance Z_T for AC 50/60 Hz, wet/perspired skin (50th percentile)
const TABLE_13_WET_ANCHORS = [
  { voltage: 25, totalZ: 1500 },
  { voltage: 50, totalZ: 1275 },
  { voltage: 125, totalZ: 950 },
  { voltage: 220, totalZ: 825 },
  { voltage: 400, totalZ: 700 },
  { voltage: 700, totalZ: 650 },
  { voltage: 1000, totalZ: 600 }
];

// Internal body impedance Z_internal (internal organs & blood vessels) is approx 500 ohms per IEC 60479-1 Clause 3.2
const INTERNAL_BODY_IMPEDANCE = 500;

/**
 * Interpolates total body impedance from IEC 60479-1 tables given touch voltage V and skin condition.
 */
export function calculateIECImpedance(
  touchVoltage: number,
  skinCondition: 'dry' | 'wet' = 'dry',
  profileMultiplier: number = 1.0
): ImpedanceBreakdown {
  const anchors = skinCondition === 'dry' ? TABLE_10_DRY_ANCHORS : TABLE_13_WET_ANCHORS;
  const citation = skinCondition === 'dry'
    ? 'IEC 60479-1:2018 Table 10 (Dry Skin, AC 50/60Hz, 50th Percentile)'
    : 'IEC 60479-1:2018 Table 13 (Wet/Perspired Skin, AC 50/60Hz, 50th Percentile)';

  let rawTotalZ = 1000;

  if (touchVoltage <= anchors[0].voltage) {
    rawTotalZ = anchors[0].totalZ;
  } else if (touchVoltage >= anchors[anchors.length - 1].voltage) {
    rawTotalZ = anchors[anchors.length - 1].totalZ;
  } else {
    // Linear interpolation between voltage anchors
    for (let i = 0; i < anchors.length - 1; i++) {
      const v1 = anchors[i].voltage;
      const z1 = anchors[i].totalZ;
      const v2 = anchors[i + 1].voltage;
      const z2 = anchors[i + 1].totalZ;

      if (touchVoltage >= v1 && touchVoltage <= v2) {
        const frac = (touchVoltage - v1) / (v2 - v1);
        rawTotalZ = z1 + frac * (z2 - z1);
        break;
      }
    }
  }

  // Apply profile scaling (e.g. child 0.7x mass factor)
  const totalZ = Math.round(rawTotalZ * profileMultiplier);
  const internalZ = Math.min(totalZ - 100, Math.round(INTERNAL_BODY_IMPEDANCE * profileMultiplier));
  const skinZ = Math.max(0, totalZ - internalZ);

  return {
    totalZ,
    internalZ,
    skinZ,
    tableCitation: citation
  };
}
