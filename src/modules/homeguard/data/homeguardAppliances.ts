/**
 * homeguardAppliances.ts
 * 
 * Single Source of Truth for all appliances in the HomeGuard simulator.
 * Standardizes IDs, names, wattages, room assignments, circuit mappings,
 * sensory metaphors, and plain-language safety tips for non-electrical users.
 */

export interface ApplianceDef {
  id: string;
  name: string;
  shortName: string;
  room: 'living' | 'kitchen' | 'bathroom' | 'bedroom';
  roomLabel: string;
  circuitId: 'c1_lighting' | 'c2_living_sockets' | 'c3_kitchen_sockets';
  watts: number;
  ampsAt230V: number;
  icon: string;
  loadCategory: 'heavy' | 'medium' | 'light';
  loadColor: string;
  plainTip: string;
  sensoryType: 'heat' | 'steam' | 'breeze' | 'screen' | 'fan' | 'lamp' | 'cold';
}

export const HOMEGUARD_APPLIANCES: ApplianceDef[] = [
  // ── LIVING ROOM (Circuit C2: 16A Sockets) ──
  {
    id: 'space_heater',
    name: 'Portable Space Heater',
    shortName: 'Space Heater',
    room: 'living',
    roomLabel: '🛋️ Living Room',
    circuitId: 'c2_living_sockets',
    watts: 2000,
    ampsAt230V: 8.7,
    icon: '🔥',
    loadCategory: 'heavy',
    loadColor: '#ea580c',
    plainTip: 'Very heavy load (2000W / 8.7A). Never plug two heaters into one multi-plug adapter!',
    sensoryType: 'heat'
  },
  {
    id: 'air_conditioner',
    name: 'Living Room Air Conditioner',
    shortName: 'Living AC',
    room: 'living',
    roomLabel: '🛋️ Living Room',
    circuitId: 'c2_living_sockets',
    watts: 1500,
    ampsAt230V: 6.5,
    icon: '❄️',
    loadCategory: 'medium',
    loadColor: '#38bdf8',
    plainTip: 'Continuous motor load (1500W). Needs its own dedicated 16A wall socket.',
    sensoryType: 'breeze'
  },
  {
    id: 'tv_console',
    name: 'Smart TV & Entertainment',
    shortName: 'Smart TV',
    room: 'living',
    roomLabel: '🛋️ Living Room',
    circuitId: 'c2_living_sockets',
    watts: 150,
    ampsAt230V: 0.65,
    icon: '📺',
    loadCategory: 'light',
    loadColor: '#818cf8',
    plainTip: 'Gentle electronic load (150W). Safe to run all day without overloading wires.',
    sensoryType: 'screen'
  },

  // ── KITCHEN (Circuit C3: 16A Heavy Sockets) ──
  {
    id: 'kettle',
    name: 'Electric Water Kettle',
    shortName: 'Kettle',
    room: 'kitchen',
    roomLabel: '🍳 Kitchen',
    circuitId: 'c3_kitchen_sockets',
    watts: 2200,
    ampsAt230V: 9.6,
    icon: '☕',
    loadCategory: 'heavy',
    loadColor: '#0284c7',
    plainTip: 'Super heavy heating element (2200W / 9.6A). Boils in minutes but draws high current.',
    sensoryType: 'steam'
  },
  {
    id: 'otg_oven',
    name: 'OTG Baking & Microwave Oven',
    shortName: 'OTG Oven',
    room: 'kitchen',
    roomLabel: '🍳 Kitchen',
    circuitId: 'c3_kitchen_sockets',
    watts: 1400,
    ampsAt230V: 6.1,
    icon: '🍲',
    loadCategory: 'medium',
    loadColor: '#10b981',
    plainTip: 'Heating coils draw 1400W. Running with the kettle can trip the Kitchen Fire-Guard!',
    sensoryType: 'heat'
  },
  {
    id: 'refrigerator',
    name: 'Frost-Free Refrigerator',
    shortName: 'Fridge',
    room: 'kitchen',
    roomLabel: '🍳 Kitchen',
    circuitId: 'c3_kitchen_sockets',
    watts: 200,
    ampsAt230V: 0.87,
    icon: '🧊',
    loadCategory: 'light',
    loadColor: '#34d399',
    plainTip: 'Constant cooling compressor (200W). Must be earthed to prevent shocks when touching doors.',
    sensoryType: 'cold'
  },

  // ── BATHROOM (Circuit C3: Heavy / C1: Fan) ──
  {
    id: 'water_geyser',
    name: 'Bathroom Water Geyser',
    shortName: 'Geyser',
    room: 'bathroom',
    roomLabel: '🚿 Bathroom',
    circuitId: 'c3_kitchen_sockets',
    watts: 2000,
    ampsAt230V: 8.7,
    icon: '🚿',
    loadCategory: 'heavy',
    loadColor: '#38bdf8',
    plainTip: 'Water immersion heater (2000W). Highly critical to have a 30mA Life-Saver (RCCB) installed!',
    sensoryType: 'heat'
  },
  {
    id: 'exhaust_fan',
    name: 'Bathroom Exhaust Fan',
    shortName: 'Exhaust Fan',
    room: 'bathroom',
    roomLabel: '🚿 Bathroom',
    circuitId: 'c1_lighting',
    watts: 50,
    ampsAt230V: 0.22,
    icon: '🌀',
    loadCategory: 'light',
    loadColor: '#94a3b8',
    plainTip: 'Small ventilation fan (50W). Connected to lighting circuit for safety.',
    sensoryType: 'fan'
  },

  // ── BEDROOM (Circuit C2: Sockets / C1: Lighting) ──
  {
    id: 'bedroom_ac',
    name: 'Bedroom Inverter AC',
    shortName: 'Bedroom AC',
    room: 'bedroom',
    roomLabel: '🛏️ Bedroom',
    circuitId: 'c2_living_sockets',
    watts: 1500,
    ampsAt230V: 6.5,
    icon: '❄️',
    loadCategory: 'medium',
    loadColor: '#38bdf8',
    plainTip: 'Cooling unit (1500W). Keeps room comfortable with energy-efficient cycling.',
    sensoryType: 'breeze'
  },
  {
    id: 'bed_lamp',
    name: 'Bedside Reading Lamp',
    shortName: 'Bed Lamp',
    room: 'bedroom',
    roomLabel: '🛏️ Bedroom',
    circuitId: 'c1_lighting',
    watts: 100,
    ampsAt230V: 0.43,
    icon: '💡',
    loadCategory: 'light',
    loadColor: '#facc15',
    plainTip: 'Warm LED lamp (100W). Connected to lighting circuit C1.',
    sensoryType: 'lamp'
  }
];

/**
 * Helper to calculate power and amperage breakdown by circuit
 */
export function calculatePowerBreakdown(activeApplianceIds: string[]) {
  let livingWatts = 0;
  let kitchenWatts = 0;
  let bathWatts = 0;
  let bedWatts = 0;
  let c1Watts = 0;
  let c2Watts = 0;
  let c3Watts = 0;

  for (const app of HOMEGUARD_APPLIANCES) {
    if (activeApplianceIds.includes(app.id)) {
      if (app.room === 'living') livingWatts += app.watts;
      if (app.room === 'kitchen') kitchenWatts += app.watts;
      if (app.room === 'bathroom') bathWatts += app.watts;
      if (app.room === 'bedroom') bedWatts += app.watts;

      if (app.circuitId === 'c1_lighting') c1Watts += app.watts;
      if (app.circuitId === 'c2_living_sockets') c2Watts += app.watts;
      if (app.circuitId === 'c3_kitchen_sockets') c3Watts += app.watts;
    }
  }

  const totalWatts = livingWatts + kitchenWatts + bathWatts + bedWatts;

  return {
    livingWatts,
    kitchenWatts,
    bathWatts,
    bedWatts,
    totalWatts,
    c1Watts,
    c2Watts,
    c3Watts,
    c1Amps: Number((c1Watts / 230).toFixed(1)),
    c2Amps: Number((c2Watts / 230).toFixed(1)),
    c3Amps: Number((c3Watts / 230).toFixed(1)),
    totalAmps: Number((totalWatts / 230).toFixed(1))
  };
}
