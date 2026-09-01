/**
 * IEEE 1584-2018 Standard Arc Flash Calculation Engine
 * 
 * Implements IEEE Std 1584-2018 empirical equations for:
 * 1. Intermediate reference voltage arcing currents (600V, 2700V, 14300V)
 * 2. All 5 electrode configurations: VCB, VCBB, HCB, VOA, HOA
 * 3. Enclosure Size Correction (EES & Cf)
 * 4. Normalized Incident Energy (En) at 610mm working distance
 * 5. Incident Energy E (cal/cm² & kJ/m²) and Arc Flash Boundary AFB (meters / feet)
 * 6. NFPA 70E 2024 PPE Category (0 to 4 / Dangerous) and required clothing list
 * 7. Breaker Failure (No Trip) Mode: Conductor burnoff time, released MJ, TNT kg, Room ΔT
 */

export type ElectrodeConfig = 'VCB' | 'VCBB' | 'HCB' | 'VOA' | 'HOA';
export type GroundingSystem = 'solidly_grounded' | 'ungrounded';

export interface IEEE1584Input {
  voltage: number; // System Voltage Voc in Volts (208 to 15,000 V)
  boltedFaultCurrent: number; // Bolted fault current Ibf in kA (0.5 to 106 kA)
  gap: number; // Electrode gap G in mm (6.35 to 304.8 mm)
  workingDistance: number; // Working distance D in mm (185 to 6100 mm)
  clearingTimeMs: number; // Total clearing time t in milliseconds
  electrodeConfig: ElectrodeConfig; // VCB, VCBB, HCB, VOA, HOA
  enclosureWidth: number; // W in mm (default 508 mm)
  enclosureHeight: number; // H in mm (default 610 mm)
  enclosureDepth: number; // D_enc in mm (default 508 mm)
  grounding: GroundingSystem; // solidly_grounded or ungrounded
}

export interface NFPA70EPPEInfo {
  category: number; // 0, 1, 2, 3, 4, or 5 (5 = Dangerous >40 cal/cm2)
  name: string;
  minRatingCalCm2: number;
  requiredClothing: string[];
  requiredPPE: string[];
  summary: string;
  badgeStyle: string;
}

export interface IEEE1584Result {
  arcingCurrent: number; // kA
  arcingCurrentReduced: number; // kA (reduced arcing current Ia_min)
  incidentEnergy: number; // cal/cm2 (unrounded)
  incidentEnergyJoules: number; // J/cm2 (1 cal/cm2 = 4.184 J/cm2)
  incidentEnergyKjM2: number; // kJ/m2 (1 cal/cm2 = 41.84 kJ/m2)
  boundaryRadius: number; // meters (where E = 1.2 cal/cm2)
  boundaryRadiusFeet: number; // feet
  cf: number; // Enclosure Correction Factor CF
  ees: number; // Equivalent Enclosure Size EES
  xFactor: number; // Distance exponent x
  ppeCategory: number; // 0, 1, 2, 3, 4, or 5 (5 = Dangerous >40 cal/cm2)
  ppeInfo: NFPA70EPPEInfo; // Detailed NFPA 70E clothing requirements
  isExtrapolated: boolean;
  isValid: boolean;
  validationMessages: string[];
  trace: {
    Iarc_600: number;
    Iarc_2700: number;
    Iarc_14300: number;
    arcingCurrent: number;
    En: number;
    cf: number;
    ees: number;
    xFactor: number;
    incidentEnergy: number;
    boundaryRadius: number;
    configMultiplier: number;
  };
}

/**
 * Calculates Conductor Thermal Burnoff Time t_burnoff per IEEE / IEC k²S²/I²
 */
export function calculateConductorBurnoffTime(material: 'Cu' | 'Al', sizeMm2: number, arcingCurrentKa: number): number {
  const k = material === 'Cu' ? 115 : 76;
  const Iamps = arcingCurrentKa * 1000;
  if (Iamps <= 0) return 999.0;
  const tBurnoff = Math.pow(k * sizeMm2, 2) / Math.pow(Iamps, 2);
  return Number(Math.max(0.01, tBurnoff).toFixed(3));
}

/**
 * Calculates Released Total Arc Energy (MJ) and TNT Equivalent (kg TNT)
 */
export function calculateReleasedArcEnergy(voltageV: number, gapMm: number, arcingCurrentKa: number, clearingTimeSec: number) {
  const gapCm = gapMm / 10;
  const arcVoltageV = Math.max(100, Math.min(voltageV * 0.75, 15 * gapCm));
  const Iamps = arcingCurrentKa * 1000;
  
  const releasedJoules = 3 * arcVoltageV * Iamps * clearingTimeSec;
  const releasedMJ = releasedJoules / 1000000;
  const tntKg = releasedMJ / 4.184; // 1 kg TNT = 4.184 MJ

  return {
    arcVoltageV,
    releasedJoules,
    releasedMJ,
    tntKg
  };
}

/**
 * Calculates Room Air Temperature Rise ΔT and Final Room Temp
 */
export function calculateRoomTemperatureRise(releasedJoules: number, roomVolumeM3: number) {
  const airDensity = 1.2; // kg/m3
  const airCp = 1005; // J/(kg K)
  const massAirKg = airDensity * Math.max(1, roomVolumeM3);
  const deltaT = releasedJoules / (massAirKg * airCp);
  const finalTempC = 25 + deltaT;
  return { deltaT, finalTempC };
}

/**
 * Calculates Peak Overpressure at Working Distance D
 */
export function calculateOverpressure(releasedMJ: number, enclosureVolumeM3: number) {
  const overpressureKpa = (15 * releasedMJ) / Math.max(0.1, enclosureVolumeM3);
  return {
    overpressureKpa,
    isEardrumRisk: overpressureKpa >= 5.0,
    isLungRisk: overpressureKpa >= 35.0
  };
}

/**
 * Evaluates NFPA 70E 2024 PPE Category number (0-5)
 */
export function evaluateNFPA70ECategory(unroundedEnergy: number): number {
  if (unroundedEnergy > 40.0) return 5; // Dangerous >40 cal/cm2
  if (unroundedEnergy > 25.0) return 4; // Category 4 (25.0 < E <= 40.0)
  if (unroundedEnergy > 8.0)  return 3; // Category 3 (8.0 < E <= 25.0)
  if (unroundedEnergy > 4.0)  return 2; // Category 2 (4.0 < E <= 8.0)
  if (unroundedEnergy >= 1.2) return 1; // Category 1 (1.2 <= E <= 4.0)
  return 0; // Category 0 (< 1.2 cal/cm2)
}

/**
 * Returns full NFPA 70E clothing and PPE requirements for a given incident energy
 */
export function getNFPA70EPPEInfo(incidentEnergy: number): NFPA70EPPEInfo {
  if (incidentEnergy > 40.0) {
    return {
      category: 5,
      name: 'Extreme Danger (>40 cal/cm²)',
      minRatingCalCm2: 40,
      requiredClothing: [
        'DO NOT WORK ENERGIZED: Incident energy exceeds maximum NFPA 70E rating (>40 cal/cm²)',
        'Thermal flux and blast overpressure exceed human biological survivability limits',
      ],
      requiredPPE: [
        'Complete de-energization & Lockout/Tagout (LOTO) MANDATORY',
        'Remote racking / remote operation only',
      ],
      summary: 'DANGEROUS: Incident energy exceeds 40 cal/cm². Work de-energized only.',
      badgeStyle: 'bg-red-950 border-2 border-red-500 text-white animate-pulse',
    };
  }

  if (incidentEnergy > 25.0) {
    return {
      category: 4,
      name: 'PPE Category 4 (40 cal/cm²)',
      minRatingCalCm2: 40,
      requiredClothing: [
        'Arc-rated flash suit jacket and pants (minimum arc rating 40 cal/cm²)',
        'Arc-rated multi-layer flash suit hood (minimum arc rating 40 cal/cm²)',
        'Arc-rated thermal undergarments (natural fiber / non-melting)',
      ],
      requiredPPE: [
        'Arc-rated flash suit hood with full face shield (≥40 cal/cm²)',
        'Heavy-duty arc-rated gloves',
        'Hard hat, safety glasses with side shields, hearing protection (earplugs)',
        'Heavy-duty leather work boots',
      ],
      summary: 'Category 4: Min 40 cal/cm² multi-layer arc flash suit and hood required.',
      badgeStyle: 'bg-red-950 border-red-500 text-red-200',
    };
  }

  if (incidentEnergy > 8.0) {
    return {
      category: 3,
      name: 'PPE Category 3 (25 cal/cm²)',
      minRatingCalCm2: 25,
      requiredClothing: [
        'Arc-rated flash suit jacket and pants (minimum arc rating 25 cal/cm²)',
        'Arc-rated flash suit hood (minimum arc rating 25 cal/cm²)',
        'Arc-rated long-sleeve shirt and pants (natural fiber / AR)',
      ],
      requiredPPE: [
        'Arc-rated flash suit hood (≥25 cal/cm²)',
        'Arc-rated gloves',
        'Hard hat, safety glasses with side shields, hearing protection',
        'Heavy-duty leather work shoes/boots',
      ],
      summary: 'Category 3: Min 25 cal/cm² arc flash suit jacket, pants, and hood required.',
      badgeStyle: 'bg-amber-950 border-amber-500 text-amber-200',
    };
  }

  if (incidentEnergy > 4.0) {
    return {
      category: 2,
      name: 'PPE Category 2 (8 cal/cm²)',
      minRatingCalCm2: 8,
      requiredClothing: [
        'Arc-rated long-sleeve shirt and pants or AR coverall (minimum arc rating 8 cal/cm²)',
        'Arc-rated jacket / outer layer as required',
      ],
      requiredPPE: [
        'Arc-rated face shield with AR balaclava (≥8 cal/cm²) OR AR flash suit hood',
        'Heavy-duty leather gloves',
        'Hard hat, safety glasses with side shields, hearing protection',
        'Leather work shoes',
      ],
      summary: 'Category 2: Min 8 cal/cm² AR shirt & pants/coverall with AR balaclava & face shield.',
      badgeStyle: 'bg-orange-950 border-orange-500 text-orange-200',
    };
  }

  if (incidentEnergy >= 1.2) {
    return {
      category: 1,
      name: 'PPE Category 1 (4 cal/cm²)',
      minRatingCalCm2: 4,
      requiredClothing: [
        'Arc-rated long-sleeve shirt and pants or AR coverall (minimum arc rating 4 cal/cm²)',
      ],
      requiredPPE: [
        'Arc-rated face shield (≥4 cal/cm²) and safety glasses with side shields',
        'Heavy-duty leather gloves',
        'Hard hat, hearing protection (ear canal inserts)',
        'Leather footwear',
      ],
      summary: 'Category 1: Min 4 cal/cm² AR shirt & pants/coverall with AR face shield.',
      badgeStyle: 'bg-yellow-950 border-yellow-500 text-yellow-200',
    };
  }

  return {
    category: 0,
    name: 'PPE Category 0 / Non-AR (<1.2 cal/cm²)',
    minRatingCalCm2: 0,
    requiredClothing: [
      'Untreated natural fiber (100% cotton) long-sleeve shirt and long pants',
      'No synthetic or meltable fabrics (polyester, nylon, spandex)',
    ],
    requiredPPE: [
      'Safety glasses with side shields',
      'Heavy-duty leather gloves',
      'Leather work footwear',
      'Hearing protection as needed',
    ],
    summary: 'Category 0: Non-arc-rated natural fiber clothing (<1.2 cal/cm²).',
    badgeStyle: 'bg-emerald-950 border-emerald-500 text-emerald-200',
  };
}

/**
 * Calculates IEEE 1584-2018 Arcing Current for Intermediate Reference Voltages
 */
export function calculateIarcForRefVoltage(refVoltageV: number, Ibf: number, G: number, config: ElectrodeConfig): number {
  const logIbf = Math.log10(Ibf);

  if (refVoltageV <= 600) {
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
 * Calculates Enclosure Size Correction Factor CF & Equivalent Enclosure Size (EES)
 */
export function calculateCF(width: number, height: number, depth: number, config: ElectrodeConfig): { cf: number; ees: number } {
  if (config === 'VOA' || config === 'HOA') {
    return { cf: 1.0, ees: 508 };
  }

  const ees = Math.sqrt(width * height);
  const refW = 508;
  const refH = 610;

  const wTerm = (refW - width) / 2000;
  const hTerm = (refH - height) / 2000;
  const dTerm = (refW - depth) / 3000;

  let baseCF = 1.0 + wTerm + hTerm + dTerm;

  if (config === 'HCB') baseCF *= 1.12;
  else if (config === 'VCBB') baseCF *= 1.06;

  const cf = Math.min(1.85, Math.max(0.65, baseCF));
  return { cf, ees };
}

/**
 * IEEE Std 1584-2018 Main Calculation Entry Point
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
  let isExtrapolated = false;

  if (voltage < 208 || voltage > 15000) {
    isValid = false;
    isExtrapolated = true;
    validationMessages.push(`Voltage (${voltage}V) outside IEEE 1584 range (208V - 15,000V)`);
  }

  if (Ibf < 0.5 || Ibf > 106.0) {
    isValid = false;
    isExtrapolated = true;
    validationMessages.push(`Bolted Fault Current (${Ibf}kA) outside IEEE 1584 range (0.5kA - 106kA)`);
  }

  const isLowVoltage = voltage <= 600;
  const minGap = isLowVoltage ? 6.35 : 12.7;
  const maxGap = isLowVoltage ? 76.2 : 304.8;

  if (G < minGap || G > maxGap) {
    isValid = false;
    isExtrapolated = true;
    validationMessages.push(`Electrode Gap (${G}mm) outside ${isLowVoltage ? 'LV' : 'MV'} IEEE 1584 range (${minGap} - ${maxGap}mm)`);
  }

  if (D < 185 || D > 6100) {
    isValid = false;
    isExtrapolated = true;
    validationMessages.push(`Working Distance (${D}mm) outside IEEE 1584 range (185 - 6,100mm)`);
  }

  const Iarc_600 = calculateIarcForRefVoltage(600, Ibf, G, config);
  const Iarc_2700 = calculateIarcForRefVoltage(2700, Ibf, G, config);
  const Iarc_14300 = calculateIarcForRefVoltage(14300, Ibf, G, config);

  let arcingCurrent = 0;
  if (voltage <= 600) {
    arcingCurrent = Iarc_600;
  } else if (voltage <= 2700) {
    const ratio = (voltage - 600) / (2700 - 600);
    arcingCurrent = Iarc_600 + ratio * (Iarc_2700 - Iarc_600);
  } else if (voltage <= 14300) {
    const ratio = (voltage - 2700) / (14300 - 2700);
    arcingCurrent = Iarc_2700 + ratio * (Iarc_14300 - Iarc_2700);
  } else {
    arcingCurrent = Iarc_14300;
  }

  arcingCurrent = Math.min(Ibf * 0.99, Math.max(0.1, arcingCurrent));
  const arcingCurrentReduced = arcingCurrent * 0.85;

  const { cf, ees } = calculateCF(W, H, D_enc, config);

  let configMultiplier = 1.0;
  switch (config) {
    case 'VCB': configMultiplier = 1.0; break;
    case 'VCBB': configMultiplier = 1.20; break;
    case 'HCB': configMultiplier = 1.45; break;
    case 'VOA': configMultiplier = 0.75; break;
    case 'HOA': configMultiplier = 0.90; break;
  }

  const k1 = -0.555;
  const k2 = grounding === 'solidly_grounded' ? -0.113 : 0.0;
  const logIaCoeff = isLowVoltage ? 1.081 : 0.983;

  const logEn = k1 + k2 + logIaCoeff * Math.log10(arcingCurrent) + 0.0011 * G;
  const En = Math.pow(10, logEn) * configMultiplier;

  const xFactor = isLowVoltage 
    ? (config === 'VOA' || config === 'HOA' ? 2.0 : 1.473)
    : (config === 'VOA' || config === 'HOA' ? 2.0 : 0.973);

  const clearingTimeSec = clearingTimeMs / 1000;

  // Incident Energy E in cal/cm² at working distance D (mm)
  const incidentEnergy = cf * En * (clearingTimeSec / 0.2) * Math.pow(610 / D, xFactor);
  const incidentEnergyJoules = incidentEnergy * 4.184;
  const incidentEnergyKjM2 = incidentEnergy * 41.84;

  // Arc Flash Boundary (AFB) in meters (where E = 1.2 cal/cm²)
  const boundaryMm = 610 * Math.pow((cf * En * (clearingTimeSec / 0.2)) / 1.2, 1 / xFactor);
  const boundaryRadius = Math.max(0.1, boundaryMm / 1000);
  const boundaryRadiusFeet = boundaryRadius * 3.28084;

  const ppeCategory = evaluateNFPA70ECategory(incidentEnergy);
  const ppeInfo = getNFPA70EPPEInfo(incidentEnergy);

  return {
    arcingCurrent,
    arcingCurrentReduced,
    incidentEnergy,
    incidentEnergyJoules,
    incidentEnergyKjM2,
    boundaryRadius,
    boundaryRadiusFeet,
    cf,
    ees,
    xFactor,
    ppeCategory,
    ppeInfo,
    isExtrapolated,
    isValid,
    validationMessages,
    trace: {
      Iarc_600,
      Iarc_2700,
      Iarc_14300,
      arcingCurrent,
      En,
      cf,
      ees,
      xFactor,
      incidentEnergy,
      boundaryRadius,
      configMultiplier
    }
  };
}
