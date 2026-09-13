/**
 * Residential Electrical Profile & Scenario Definitions (230V TN-S System)
 * 
 * Defines household circuit topology and realistic interactive scenarios.
 */

import { MCBTrippingCurve } from '../../../mcb/types';

export interface Appliance {
  id: string;
  name: string;
  room: 'living' | 'kitchen' | 'bedroom' | 'utility';
  powerWatts: number;
  currentAmps: number;
  circuitId: 'c1_lighting' | 'c2_living_sockets' | 'c3_kitchen_sockets';
  icon: string;
  description: string;
  isFaulty?: boolean;
}

export interface ResidentialCircuit {
  id: 'c1_lighting' | 'c2_living_sockets' | 'c3_kitchen_sockets';
  name: string;
  room: string;
  ratedCurrentIn: number;
  curve: MCBTrippingCurve;
  cableSizeMm2: number;
  wireColorLive: string;
  wireColorNeutral: string;
  wireColorEarth: string;
  conduitPath: string;
}

export interface ResidentialScenario {
  id: string;
  title: string;
  summary: string;
  description: string;
  plainEnglishExplanation: string;
  targetCircuitId: 'c2_living_sockets' | 'c3_kitchen_sockets' | 'c1_lighting' | 'main_rccb';
  faultType: 'normal' | 'thermal_overload' | 'short_circuit' | 'earth_leakage';
  totalLoadAmps: number;
  leakageCurrentMA?: number;
  appliancesActive: string[];
  expectedTripTimeSec?: number; // e.g. 2246.7s for 1.45x In
  recommendation: string;
}

export const RESIDENTIAL_CIRCUITS: ResidentialCircuit[] = [
  {
    id: 'c1_lighting',
    name: 'Lighting Circuit (10A)',
    room: 'Entire Home',
    ratedCurrentIn: 10,
    curve: 'B',
    cableSizeMm2: 1.5,
    wireColorLive: '#b45309', // Brown
    wireColorNeutral: '#0284c7', // Blue
    wireColorEarth: '#16a34a', // Green/Yellow
    conduitPath: 'ceiling'
  },
  {
    id: 'c2_living_sockets',
    name: 'Living Room Sockets (16A)',
    room: 'Living Room',
    ratedCurrentIn: 16,
    curve: 'C',
    cableSizeMm2: 2.5,
    wireColorLive: '#b45309',
    wireColorNeutral: '#0284c7',
    wireColorEarth: '#16a34a',
    conduitPath: 'wall_floor'
  },
  {
    id: 'c3_kitchen_sockets',
    name: 'Kitchen Heavy Sockets (16A)',
    room: 'Kitchen',
    ratedCurrentIn: 16,
    curve: 'C',
    cableSizeMm2: 2.5,
    wireColorLive: '#b45309',
    wireColorNeutral: '#0284c7',
    wireColorEarth: '#16a34a',
    conduitPath: 'countertop'
  }
];

export const AVAILABLE_APPLIANCES: Appliance[] = [
  {
    id: 'tv_console',
    name: 'Smart TV & Console',
    room: 'living',
    powerWatts: 150,
    currentAmps: 0.7,
    circuitId: 'c2_living_sockets',
    icon: 'tv',
    description: 'Normal everyday entertainment load.'
  },
  {
    id: 'space_heater',
    name: 'Portable Space Heater',
    room: 'living',
    powerWatts: 2000,
    currentAmps: 8.7,
    circuitId: 'c2_living_sockets',
    icon: 'flame',
    description: 'High thermal draw resistive element.'
  },
  {
    id: 'hair_dryer',
    name: 'High-Power Hair Dryer',
    room: 'living',
    powerWatts: 986,
    currentAmps: 4.3,
    circuitId: 'c2_living_sockets',
    icon: 'wind',
    description: 'Motor fan and heating coils combined.'
  },
  {
    id: 'kettle',
    name: 'Rapid-Boil Electric Kettle',
    room: 'living', // Plugged into living room multi-strip in overload scenario
    powerWatts: 2200,
    currentAmps: 9.6,
    circuitId: 'c2_living_sockets',
    icon: 'coffee',
    description: 'Heavy 2.2kW rapid-boil element.'
  },
  {
    id: 'microwave',
    name: 'Kitchen Microwave',
    room: 'kitchen',
    powerWatts: 1200,
    currentAmps: 5.2,
    circuitId: 'c3_kitchen_sockets',
    icon: 'box',
    description: 'Magnetron RF cook appliance.'
  },
  {
    id: 'toaster',
    name: '4-Slice Toaster',
    room: 'kitchen',
    powerWatts: 1400,
    currentAmps: 6.1,
    circuitId: 'c3_kitchen_sockets',
    icon: 'utensils',
    description: 'Nichrome wire heating coils.'
  },
  {
    id: 'damaged_extension',
    name: 'Damaged Cord (Bare Wire)',
    room: 'living',
    powerWatts: 57500,
    currentAmps: 250.0,
    circuitId: 'c2_living_sockets',
    icon: 'zap',
    description: 'Pinched copper conductors touching directly (bolted short circuit).',
    isFaulty: true
  },
  {
    id: 'wet_steamer',
    name: 'Leaking Garment Steamer',
    room: 'living',
    powerWatts: 1500,
    currentAmps: 6.5,
    circuitId: 'c2_living_sockets',
    icon: 'droplets',
    description: 'Moisture ingress conducting 45mA directly to metal chassis.',
    isFaulty: true
  }
];

export const RESIDENTIAL_SCENARIOS: ResidentialScenario[] = [
  {
    id: 'normal_living',
    title: '1. Normal Quiet Evening',
    summary: 'Standard Safe Household Consumption',
    description: 'TV, lighting, and phone charger running comfortably within limits.',
    plainEnglishExplanation:
      'Everything is working properly. The electrical current flowing through the walls is small and cool, well below the breaker safety limit.',
    targetCircuitId: 'c2_living_sockets',
    faultType: 'normal',
    totalLoadAmps: 4.2,
    appliancesActive: ['tv_console'],
    recommendation: 'Safe continuous operation. No action required.'
  },
  {
    id: 'winter_overload_145',
    title: '2. Winter Room Overload (145% Safe Capacity)',
    summary: 'Too Many High-Power Heating Appliances On One Socket',
    description:
      'A portable space heater (2,000W / 8.7A) and electric kettle (2,200W / 9.6A) plugged into one multi-plug socket draw 23.2A on a 16-Amp breaker (145% safe capacity!).',
    plainEnglishExplanation:
      'You plugged in too many hungry appliances on one socket. The copper wire hidden inside the wall is slowly getting scorching hot like a toaster wire. The safety switch detects this heat build-up and begins a countdown to safely snap OFF before the wall catches fire.',
    targetCircuitId: 'c2_living_sockets',
    faultType: 'thermal_overload',
    totalLoadAmps: 23.2, // Exactly 1.45x 16A!
    appliancesActive: ['tv_console', 'space_heater', 'kettle', 'hair_dryer'],
    expectedTripTimeSec: 2246.7, // Matches IEC 60898 MCB Cockpit invariant!
    recommendation: 'Spread high-power heating appliances across separate wall socket circuits. Never plug two heaters on one extension cord!'
  },
  {
    id: 'damaged_cord_short',
    title: '3. Crushed Cord Short-Circuit (>10× In)',
    summary: 'Instantaneous Magnetic Fault Surge',
    description:
      'A heavy sofa leg pinched an extension cord, causing live and neutral copper strands to contact directly. Fault current spikes to 250A.',
    plainEnglishExplanation:
      'A wire was crushed and bare copper touched another wire. Electricity rushed through in a giant wave. The magnetic coil inside the breaker fired instantly in less than 10 milliseconds to stop a fire.',
    targetCircuitId: 'c2_living_sockets',
    faultType: 'short_circuit',
    totalLoadAmps: 250.0,
    appliancesActive: ['damaged_extension'],
    expectedTripTimeSec: 0.008,
    recommendation: 'Unplug and discard frayed or pinched cords immediately. Never tape damaged wires.'
  },
  {
    id: 'child_touch_shock',
    title: '4. Child Wet-Skin Contact Shock (230mA)',
    summary: 'Direct Live Contact - RCCB High Sensitivity Trip',
    description:
      'A child inserts a metal pin into a live socket. 230mA of current passes through body resistance to earth.',
    plainEnglishExplanation:
      'A child touched a live terminal. 230mA of current is flowing through the body into the ground. Standard 16A breakers ignore this low current, but the 30mA RCCB trips in less than 0.03 seconds to save the child.',
    targetCircuitId: 'main_rccb',
    faultType: 'earth_leakage',
    totalLoadAmps: 4.2,
    leakageCurrentMA: 230.0,
    appliancesActive: ['tv_console'],
    expectedTripTimeSec: 0.030,
    recommendation: 'Ensure all home circuits are protected by a 30mA RCCB. Install tamper-resistant socket safety shutters.'
  },
  {
    id: 'kettle_earth_leakage',
    title: '5. Bathroom / Kitchen Appliance Water Ingress (45mA)',
    summary: 'Insulation Breakdown - Residual Current Trip',
    description:
      'Water splashed onto heating element or wiring insulation, leaking 45mA of residual current to the grounded metallic chassis.',
    plainEnglishExplanation:
      'Water inside the appliance is conducting electricity to its metal body. The RCCB senses this imbalance between live and neutral lines and snaps power OFF in 0.040s.',
    targetCircuitId: 'main_rccb',
    faultType: 'earth_leakage',
    totalLoadAmps: 9.6,
    leakageCurrentMA: 45.0,
    appliancesActive: ['kettle'],
    expectedTripTimeSec: 0.040,
    recommendation: 'Keep water away from electrical appliances and replace appliances with compromised water seals.'
  },
  {
    id: 'broken_earth_velcb',
    title: '6. Broken Earth Wire (v-ELCB vs RCCB)',
    summary: 'CPC Conductor Failure Mode',
    description:
      'The green protective earth conductor is broken. An old voltage-operated ELCB fails completely, but a modern current-operated RCCB still trips.',
    plainEnglishExplanation:
      'The grounding wire is cut. An old 1980s v-ELCB will never trip, creating a deadly shock trap. But a modern RCCB does not need the ground wire to detect missing current and safely trips.',
    targetCircuitId: 'main_rccb',
    faultType: 'earth_leakage',
    totalLoadAmps: 6.5,
    leakageCurrentMA: 45.0,
    appliancesActive: ['kettle'],
    expectedTripTimeSec: 0.040,
    recommendation: 'Replace obsolete voltage-operated ELCBs with modern 30mA RCCB / RCBO residual current devices.'
  },
  {
    id: 'safe_boundary_hold',
    title: '7. Borderline Load Test (1.13× In)',
    summary: 'Conventional Non-Tripping Current Int',
    description:
      'Heater + TV = 18.0A on a 16A breaker (1.13x In). Breaker safely carries this without nuisance tripping per IEC standards.',
    plainEnglishExplanation:
      'The wires are warm but safe. The breaker is calibrated to stay ON without nuisance tripping so your lights and TV do not keep turning off randomly.',
    targetCircuitId: 'c2_living_sockets',
    faultType: 'normal',
    totalLoadAmps: 18.0,
    appliancesActive: ['tv_console', 'space_heater'],
    recommendation: 'Normal allowable thermal tolerance. No trip will occur.'
  }
];
