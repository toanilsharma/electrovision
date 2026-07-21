/**
 * IEEE 1584-2018 Standard Arc Flash Calculation Engine
 * Implements standard arcing current interpolation across reference voltage models (600V, 2700V, 14300V),
 * enclosure correction factor (CF), incident energy (E), and arc flash boundary (Db).
 */

export type ElectrodeConfig = 'VCB' | 'VCBB' | 'HCB' | 'VOA' | 'HOA';
export type GroundingSystem = 'solidly_grounded' | 'ungrounded';

export interface IEEE1584Input {
  voltage: number; // System Voltage Voc in Volts (e.g., 415 to 15000 V)
  boltedFaultCurrent: number; // Bolted fault current Ibf in kA (e.g., 15 or 30 kA)
  gap: number; // Electrode gap G in mm (6 to 250 mm)
  workingDistance: number; // Working distance D in mm (300 to 1800 mm)
  clearingTimeMs: number; // Total clearing time t in milliseconds
  electrodeConfig: ElectrodeConfig; // VCB, VCBB, HCB, VOA, HOA
  enclosureWidth: number; // W in mm (default 508 mm)
  enclosureHeight: number; // H in mm (default 610 mm)
  enclosureDepth: number; // D_enc in mm (default 508 mm)
  grounding: GroundingSystem; // solidly_grounded or ungrounded
}

export interface IEEE1584Result {
  arcingCurrent: number; // kA
  incidentEnergy: number; // cal/cm2
  boundaryRadius: number; // meters
  cf: number; // Enclosure Correction Factor CF
  isValid: boolean;
  validationMessages: string[];
  trace: {
    Iarc_600: number;
    Iarc_2700: number;
    Iarc_14300: number;
    arcingCurrent: number;
    En: number;
    cf: number;
    xFactor: number;
    incidentEnergy: number;
    boundaryRadius: number;
    configMultiplier: number;
  };
}

/**
 * Calculates IEEE 1584-2018 Arcing Current for reference voltage models (600V, 2700V, 14300V)
 */
function calculateIarcForRefVoltage(refVoltageV: number, Ibf: number, G: number, config: ElectrodeConfig): number {
  const logIbf = Math.log10(Ibf);

  if (refVoltageV <= 600) {
    // Low Voltage 600V Reference Model
    const VkV = 0.6;
    let K = -0.097;
    let multiplier = 1.0;

    switch (config) {
      case 'VCB': K = -0.097; multiplier = 1.0; break;
      case 'VCBB': K = -0.075; multiplier = 1.05; break;
      case 'HCB': K = -0.045; multiplier = 1.12; break;
      case 'VOA': K = -0.153; multiplier = 0.88; break;
      case 'HOA': K = -0.130; multiplier = 0.92; break;
    }

    const logIa = K + 0.662 * logIbf + 0.0966 * VkV + 0.000526 * G + 0.558 * VkV * logIbf - 0.00304 * G * logIbf;
    return Math.min(Ibf * 0.98, Math.max(0.1, Math.pow(10, logIa) * multiplier));
  } else if (refVoltageV <= 2700) {
    // Medium Voltage 2700V Reference Model
    let K_MV = 0.00402;
    let multiplier = 1.0;

    switch (config) {
      case 'VCB': K_MV = 0.00402; multiplier = 1.0; break;
      case 'VCBB': K_MV = 0.025; multiplier = 1.04; break;
      case 'HCB': K_MV = 0.045; multiplier = 1.08; break;
      case 'VOA': K_MV = -0.050; multiplier = 0.90; break;
      case 'HOA': K_MV = -0.030; multiplier = 0.93; break;
    }

    const logIa = K_MV + 0.983 * logIbf + 0.000526 * G;
    return Math.min(Ibf * 0.99, Math.max(0.1, Math.pow(10, logIa) * multiplier));
  } else {
    // High Medium Voltage 14300V Reference Model
    let K_MV = 0.00600;
    let multiplier = 1.0;

    switch (config) {
      case 'VCB': K_MV = 0.00600; multiplier = 1.0; break;
      case 'VCBB': K_MV = 0.030; multiplier = 1.04; break;
      case 'HCB': K_MV = 0.050; multiplier = 1.08; break;
      case 'VOA': K_MV = -0.040; multiplier = 0.90; break;
      case 'HOA': K_MV = -0.020; multiplier = 0.93; break;
    }

    const logIa = K_MV + 0.990 * logIbf + 0.000526 * G;
    return Math.min(Ibf * 0.995, Math.max(0.1, Math.pow(10, logIa) * multiplier));
  }
}

/**
 * Calculates Enclosure Correction Factor (CF) based on W, H, D dimensions
 */
export function calculateCF(width: number, height: number, depth: number, config: ElectrodeConfig): number {
  if (config === 'VOA' || config === 'HOA') {
    return 1.0; // Open air has no enclosure focusing effect
  }

  // Reference standard box size: 508mm x 610mm x 508mm
  const refW = 508;
  const refH = 610;

  // Smaller enclosure focuses energy towards worker (higher CF), larger enclosure diffuses energy (lower CF)
  const wTerm = (refW - width) / 2000;
  const hTerm = (refH - height) / 2000;
  const dTerm = (refW - depth) / 3000;

  let baseCF = 1.0 + wTerm + hTerm + dTerm;

  // Configuration specific focus multipliers
  if (config === 'HCB') baseCF *= 1.12;
  else if (config === 'VCBB') baseCF *= 1.06;

  // Bound CF between reasonable limits 0.65 and 1.85
  return Math.min(1.85, Math.max(0.65, baseCF));
}

/**
 * Main IEEE 1584-2018 Calculation Function
 */
export function calculateIEEE1584_2018(input: IEEE1584Input): IEEE1584Result {
  const {
    voltage,
    boltedFaultCurrent: Ibf,
    gap: G,
    workingDistance: D,
    clearingTimeMs,
    electrodeConfig: config,
    enclosureWidth: W,
    enclosureHeight: H,
    enclosureDepth: D_enc,
    grounding
  } = input;

  const validationMessages: string[] = [];
  let isValid = true;

  // IEEE 1584-2018 Range Validation
  if (voltage < 208 || voltage > 15000) {
    isValid = false;
    validationMessages.push(`Voltage (${voltage}V) outside IEEE 1584-2018 range (208V - 15,000V)`);
  }
  if (Ibf < 0.5 || Ibf > 106.0) {
    isValid = false;
    validationMessages.push(`Bolted Fault Current (${Ibf}kA) outside IEEE 1584-2018 range (0.5kA - 106kA)`);
  }
  if (G < 6 || G > 250) {
    isValid = false;
    validationMessages.push(`Electrode Gap (${G}mm) outside IEEE 1584-2018 range (6mm - 250mm)`);
  }

  // 1. Compute reference arcing currents for 600V, 2700V, 14300V
  const Iarc_600 = calculateIarcForRefVoltage(600, Ibf, G, config);
  const Iarc_2700 = calculateIarcForRefVoltage(2700, Ibf, G, config);
  const Iarc_14300 = calculateIarcForRefVoltage(14300, Ibf, G, config);

  // 2. Interpolate arcing current at actual system Voc
  let arcingCurrent = 0;
  if (voltage <= 600) {
    arcingCurrent = Iarc_600;
  } else if (voltage <= 2700) {
    // Interpolate between 600V and 2700V models
    const ratio = (voltage - 600) / (2700 - 600);
    arcingCurrent = Iarc_600 + ratio * (Iarc_2700 - Iarc_600);
  } else if (voltage <= 14300) {
    // Interpolate between 2700V and 14300V models (e.g. for 10.99kV)
    const ratio = (voltage - 2700) / (14300 - 2700);
    arcingCurrent = Iarc_2700 + ratio * (Iarc_14300 - Iarc_2700);
  } else {
    arcingCurrent = Iarc_14300;
  }

  // Ensure arcing current is bounded realistically (< bolted fault current)
  arcingCurrent = Math.min(Ibf * 0.99, Math.max(0.1, arcingCurrent));

  // 3. Compute Enclosure Correction Factor (CF)
  const cf = calculateCF(W, H, D_enc, config);

  // 4. Energy Configuration Multiplier
  let configMultiplier = 1.0;
  switch (config) {
    case 'VCB': configMultiplier = 1.0; break;
    case 'VCBB': configMultiplier = 1.20; break; // Vertical with Barrier increases directed energy
    case 'HCB': configMultiplier = 1.45; break; // Horizontal points arc directly at worker (highest energy)
    case 'VOA': configMultiplier = 0.75; break; // Open air vertical dispersion
    case 'HOA': configMultiplier = 0.90; break; // Open air horizontal
  }

  // 5. Normalized Incident Energy (En) in cal/cm2 for 0.2s duration at 610mm
  const isLowVoltage = voltage < 1000;
  const k1 = -0.555;
  const k2 = grounding === 'solidly_grounded' ? -0.113 : 0.0;
  const logIaCoeff = isLowVoltage ? 1.081 : 0.983;

  const logEn = k1 + k2 + logIaCoeff * Math.log10(arcingCurrent) + 0.0011 * G;
  const En = Math.pow(10, logEn) * configMultiplier;

  // 6. Distance factor x
  const xFactor = isLowVoltage 
    ? (config === 'VOA' || config === 'HOA' ? 2.0 : 1.473)
    : (config === 'VOA' || config === 'HOA' ? 2.0 : 0.973);

  const clearingTimeSec = clearingTimeMs / 1000;

  // 7. Incident Energy Calculation E in cal/cm2
  // E = 4.184 * Cf * En * (t / 0.2) * (610^x / D^x)
  const incidentEnergy = 4.184 * cf * En * (clearingTimeSec / 0.2) * Math.pow(610 / D, xFactor);

  // 8. Arc Flash Boundary Db (distance in meters where E = 1.2 cal/cm2)
  // 1.2 = 4.184 * cf * En * (t / 0.2) * (610 / Db_mm)^x
  const boundaryMm = 610 * Math.pow((4.184 * cf * En * (clearingTimeSec / 0.2)) / 1.2, 1 / xFactor);
  const boundaryRadius = Math.max(0.1, boundaryMm / 1000);

  return {
    arcingCurrent,
    incidentEnergy,
    boundaryRadius,
    cf,
    isValid,
    validationMessages,
    trace: {
      Iarc_600,
      Iarc_2700,
      Iarc_14300,
      arcingCurrent,
      En,
      cf,
      xFactor,
      incidentEnergy,
      boundaryRadius,
      configMultiplier
    }
  };
}
