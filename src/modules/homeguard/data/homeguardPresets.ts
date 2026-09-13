/**
 * HomeGuard Core Preset System Instances (HG6)
 * 
 * Standardizes 5 core residential scenarios into preset system instances:
 * 1. OVERLOAD: Winter Living Room Overload (1.45x In)
 * 2. SHORT: Pinched Cord Bolted Short Circuit (250A)
 * 3. CHILD SHOCK: Child Wet-Skin Contact Shock (230mA, IEC 60479)
 * 4. WET BATH: Bathroom / Kitchen Appliance Water Ingress (45mA, IEC 61008)
 * 5. BROKEN EARTH: Severed Earth Conductor (CPC Failure Mode, v-ELCB vs RCCB)
 */

export interface HomeGuardPreset {
  id: string;
  chipLabel: 'NORMAL' | 'OVERLOAD' | 'SHORT' | 'CHILD SHOCK' | 'WET BATH' | 'BROKEN EARTH';
  title: string;
  oneLiner: string;
  description: string;
  targetCircuitId: 'c1_lighting' | 'c2_living_sockets' | 'c3_kitchen_sockets' | 'main_rccb';
  faultCurrentAmps: number;
  leakageCurrentMA: number;
  faultType: 'normal' | 'thermal_overload' | 'short_circuit' | 'earth_leakage' | 'child_shock' | 'broken_cpc';
  expectedDevice: string;
  expectedTimeRange: string;
  expectedVerdict: 'TRIP_THERMAL' | 'TRIP_MAGNETIC' | 'TRIP_RESIDUAL' | 'LETHAL_HOLD' | 'TRIP_SAFE';
  expectedStampText: string;
  appliancesActive: string[];
  pointsAwarded: number;
  learningGoal: string;
}

export const HOMEGUARD_PRESETS: HomeGuardPreset[] = [
  {
    id: 'preset_normal',
    chipLabel: 'NORMAL',
    title: '1. Normal Safe Home (No Faults)',
    oneLiner: 'Standard everyday electricity flow. Clean power distributed to all rooms without danger.',
    description: 'Electricity flows safely through your home from the mains supply through the DB fuse box into your appliances. All safety switches remain ON. You can turn the mains supply or individual appliances ON/OFF to see how energy moves.',
    targetCircuitId: 'c2_living_sockets',
    faultCurrentAmps: 7.2,
    leakageCurrentMA: 0,
    faultType: 'normal',
    expectedDevice: 'All Switches ON (Safe)',
    expectedTimeRange: 'Continuous Safe Operation',
    expectedVerdict: 'TRIP_SAFE',
    expectedStampText: 'SAFE: NORMAL BALANCED POWER',
    appliancesActive: ['tv_console', 'air_conditioner', 'refrigerator'],
    pointsAwarded: 100,
    learningGoal: 'Observe how balanced electrical current flows safely in a closed loop through insulated wires.'
  },
  {
    id: 'preset_overload',
    chipLabel: 'OVERLOAD',
    title: '2. Winter Room Overload (145% Safe Capacity)',
    oneLiner: 'Space heater + Kettle draw 23.2A on a 16-Amp socket line (145% overloaded—Max ~3,500W safe limit!).',
    description: 'When total load reaches 145% of safe limit (23.2A on a 16A breaker), hidden copper wires inside the wall begin heating up like a toaster wire. The safety switch gives a timed countdown before cutting power to prevent electrical wall fires.',
    targetCircuitId: 'c2_living_sockets',
    faultCurrentAmps: 23.2,
    leakageCurrentMA: 0,
    faultType: 'thermal_overload',
    expectedDevice: '16-Amp Socket Switch (MCB C16)',
    expectedTimeRange: 't ≤ 3600s (t ≈ 2246.7s)',
    expectedVerdict: 'TRIP_THERMAL',
    expectedStampText: 'EXPECTED: C16 THERMAL TRIP (t≈2246s)',
    appliancesActive: ['tv_console', 'space_heater', 'kettle'],
    pointsAwarded: 100,
    learningGoal: 'Learn why overloads take time to trip (like boiling milk)—it protects your house from hidden electrical fires.'
  },
  {
    id: 'preset_short',
    chipLabel: 'SHORT',
    title: '3. Damaged Appliance Cord Bolted Short Circuit',
    oneLiner: 'Crushed wire causes Line and Neutral to touch, producing a 250A surge (>10× In).',
    description: 'Phase-to-Neutral short circuit causes instantaneous magnetic solenoid tripping in less than 10 milliseconds without heating delay, quenching the arc safely.',
    targetCircuitId: 'c2_living_sockets',
    faultCurrentAmps: 250.0,
    leakageCurrentMA: 0,
    faultType: 'short_circuit',
    expectedDevice: 'MCB C16 (Living Sockets)',
    expectedTimeRange: 't < 10ms (Instantaneous)',
    expectedVerdict: 'TRIP_MAGNETIC',
    expectedStampText: 'EXPECTED: C16 MAGNETIC TRIP (<10ms)',
    appliancesActive: ['tv_console'],
    pointsAwarded: 100,
    learningGoal: 'Verify that magnetic solenoid coil trips in milliseconds during short circuits.'
  },
  {
    id: 'preset_child_shock',
    chipLabel: 'CHILD SHOCK',
    title: '4. Child Wet-Skin Contact Shock (Why Regular Switches Won\'t Save You)',
    oneLiner: 'Child touches live socket with wet skin. Regular 16A switch ignores it, but 30mA RCCB cuts power in 0.03s!',
    description: 'A standard 16A breaker ignores a 0.23A (230mA) shock because it only cares about heavy appliance loads (16A+). But 0.23A is enough to stop a human heart! Only the 30mA Life-Saver Switch (RCCB) senses the missing current and snaps power OFF in 0.03 seconds.',
    targetCircuitId: 'main_rccb',
    faultCurrentAmps: 4.2,
    leakageCurrentMA: 230.0,
    faultType: 'child_shock',
    expectedDevice: '30mA Life-Saver Switch (Whole House RCCB)',
    expectedTimeRange: 't ≤ 40ms (Zone AC-2 Safe)',
    expectedVerdict: 'TRIP_RESIDUAL',
    expectedStampText: 'EXPECTED: 30mA RCCB TRIP (≤40ms, AC-2 SAFE)',
    appliancesActive: ['tv_console'],
    pointsAwarded: 100,
    learningGoal: 'Understand why regular switches cannot prevent electrocution and why every home must have a 30mA safety switch.'
  },
  {
    id: 'preset_wet_bath',
    chipLabel: 'WET BATH',
    title: '5. Wet Appliance Water Leakage (The Missing Skin Armor)',
    oneLiner: 'Water dissolves skin resistance armor (from 2,000Ω down to 500Ω), leaking 45mA to ground.',
    description: 'Water turns your skin into an open highway for electricity. The safety donut senses 45mA leaking through the water puddle into the copper pipe and snaps power OFF before a fatal shock occurs.',
    targetCircuitId: 'main_rccb',
    faultCurrentAmps: 9.6,
    leakageCurrentMA: 45.0,
    faultType: 'earth_leakage',
    expectedDevice: '30mA Life-Saver Switch (Whole House RCCB)',
    expectedTimeRange: 't ≤ 300ms (t ≈ 268ms)',
    expectedVerdict: 'TRIP_RESIDUAL',
    expectedStampText: 'EXPECTED: 30mA RCCB TRIP (~268ms)',
    appliancesActive: ['kettle'],
    pointsAwarded: 100,
    learningGoal: 'Learn why water and electricity are a deadly mix, and how safety switches isolate wet appliance leaks.'
  },
  {
    id: 'preset_broken_earth',
    chipLabel: 'BROKEN EARTH',
    title: '6. The Broken Green Ground Wire: Old 1980s Switch Trap',
    oneLiner: 'Rat chews green ground wire. Old 1980s ELCB fails completely, but modern RCCB saves the family!',
    description: 'If a rodent chews or a nail cuts your green ground wire, the obsolete 1980s voltage switch goes completely blind, leaving the metal appliance chassis electrified to 230V! Modern safety switches detect the current leak and cut power anyway.',
    targetCircuitId: 'main_rccb',
    faultCurrentAmps: 4.2,
    leakageCurrentMA: 150.0,
    faultType: 'broken_cpc',
    expectedDevice: 'Modern 30mA RCCB (Old v-ELCB Fails)',
    expectedTimeRange: 'RCCB ≤ 40ms / v-ELCB ∞',
    expectedVerdict: 'TRIP_RESIDUAL',
    expectedStampText: 'EXPECTED: RCCB PROTECTS (v-ELCB FAILS)',
    appliancesActive: ['space_heater'],
    pointsAwarded: 100,
    learningGoal: 'Examine why modern current-operated safety switches replaced old 1980s voltage switches worldwide.'
  }
];
