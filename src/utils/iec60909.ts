/**
 * IEC 60909 / IEC 60364-4-43 Short Circuit & Cable Thermal Physics Engine
 */

export interface IEC60909Params {
  transformerKVA: number; // e.g. 630 kVA
  ukPercent: number; // e.g. 6.0%
  voltageUn: number; // e.g. 415 V (Line-to-Line)
  voltageFactorC: number; // e.g. 1.05
  cableLengthM: number; // e.g. 0 m (or 0-50 m)
  cableSizeMm2: number; // e.g. 16 mm²
  cableMaterial?: 'Cu' | 'Al'; // default 'Cu'
  cableInsulation?: 'PVC' | 'XLPE'; // default 'PVC'
  transformerXR?: number; // X/R ratio of transformer (default 10.0)
  z0z1Ratio: number; // Z0/Z1 ratio for line-to-ground faults (default 1.7)
  faultType: 'three_phase' | 'line_ground';
  protectionSpeed: 'fast' | 'delayed' | 'fail';
  isLimitingBreaker: boolean; // Current limiting breaker mode toggle
  relayOperateMs?: number; // Custom operate time override in ms
  breakerOpeningMs?: number; // Breaker opening time in ms (default 6ms)
  arcDurationMs?: number; // Arc duration in ms (default 3ms)
}

export interface IEC60909Result {
  // Transformer & System Impedances
  Z_T: number; // Transformer impedance (Ohms)
  R_T: number; // Transformer resistance (Ohms)
  X_T: number; // Transformer reactance (Ohms)
  R_C: number; // Cable resistance (Ohms)
  X_C: number; // Cable reactance (Ohms)
  Z1: number; // Positive sequence impedance Z1 (Ohms)
  systemXR: number; // Overall system X/R ratio
  systemRX: number; // Overall system R/X ratio

  // Fault Currents
  Ik3: number; // Symmetrical 3-phase fault current (A)
  Ik3_kA: number; // Symmetrical 3-phase fault current (kA)
  Ik1: number; // Single line-to-ground fault current (A)
  Ik1_kA: number; // Single line-to-ground fault current (kA)
  Ik: number; // Selected fault current Ik (A)
  Ik_kA: number; // Selected fault current Ik (kA)

  // Peak Making Current
  kappa: number; // Peak factor κ
  ip: number; // Peak making current ip (A)
  ip_kA: number; // Peak making current ip (kA)

  // Clearing Time Breakdown
  tRelayMs: number; // Relay operate time (ms)
  tBreakerMs: number; // Breaker opening time (ms)
  tArcMs: number; // Arc duration (ms)
  tTotalMs: number; // Total clearing time (ms)

  // Energy & Thermal Withstand
  letThroughEnergy: number; // Let-through energy I²t (A²s)
  letThroughEnergy_kA2s: number; // Let-through energy I²t (kA²s)
  kFactor: number; // Conductor thermal factor k (e.g. 115 for PVC Cu)
  withstandEnergy: number; // Cable withstand capacity k²S² (A²s)
  withstandEnergy_kA2s: number; // Cable withstand capacity k²S² (kA²s)
  Smin: number; // Minimum required cable size (mm²)
  isThermalPass: boolean; // Verdict: PASS (true) / MELT (false)
  isLimitingActive: boolean; // Whether current-limiting capping is active
}

/**
 * Returns conductor thermal factor k based on material and insulation (IEC 60364-4-43)
 */
export function getKFactor(material: 'Cu' | 'Al' = 'Cu', insulation: 'PVC' | 'XLPE' = 'PVC'): number {
  if (material === 'Cu') {
    return insulation === 'XLPE' ? 143 : 115;
  } else {
    return insulation === 'XLPE' ? 95 : 76;
  }
}

/**
 * Calculates Peak Factor κ according to IEC 60909
 * κ = 1.02 + 0.98 * e^(-3 * R / X)
 */
export function calculateKappa(rxRatio: number): number {
  const kappa = 1.02 + 0.98 * Math.exp(-3 * rxRatio);
  return Math.min(2.0, Math.max(1.0, kappa));
}

/**
 * Calculates Cable Withstand Energy k²S² (A²s)
 */
export function calculateCableWithstand(sizeMm2: number, kFactor: number): number {
  return Math.pow(kFactor * sizeMm2, 2);
}

/**
 * Calculates Minimum Required Conductor Size S_min = √(I²t) / k (mm²)
 */
export function calculateSmin(letThroughA2s: number, kFactor: number): number {
  if (letThroughA2s <= 0 || !isFinite(letThroughA2s) || kFactor <= 0) return 0;
  return Math.sqrt(letThroughA2s) / kFactor;
}

/**
 * Main IEC 60909 Short Circuit Engine
 */
export function calculateIEC60909(params: IEC60909Params): IEC60909Result {
  const {
    transformerKVA = 630,
    ukPercent = 6.0,
    voltageUn = 415,
    voltageFactorC = 1.05,
    cableLengthM = 0,
    cableSizeMm2 = 16,
    cableMaterial = 'Cu',
    cableInsulation = 'PVC',
    transformerXR = 10.0,
    z0z1Ratio = 1.7,
    faultType = 'three_phase',
    protectionSpeed = 'fast',
    isLimitingBreaker = false,
    relayOperateMs,
    breakerOpeningMs = 6,
    arcDurationMs = 3
  } = params;

  // 1. Transformer Parameters (IEC 60909)
  const S_rT = transformerKVA * 1000; // VA
  const Z_T = (ukPercent / 100) * (Math.pow(voltageUn, 2) / S_rT); // Ohms
  const R_T = Z_T / Math.sqrt(1 + Math.pow(transformerXR, 2)); // Ohms
  const X_T = R_T * transformerXR; // Ohms

  // 2. Cable Parameters
  const rho = cableMaterial === 'Cu' ? 0.0178 : 0.0282; // Ohms.mm²/m at 20°C
  const R_C = (rho * cableLengthM) / cableSizeMm2; // Ohms
  const X_C = 0.00008 * cableLengthM; // Reactance ~0.08 mOhm/m for LV cable

  // 3. Total Positive Sequence Impedance Z1
  const R1 = R_T + R_C;
  const X1 = X_T + X_C;
  const Z1 = Math.sqrt(Math.pow(R1, 2) + Math.pow(X1, 2));

  const systemXR = R1 > 0 ? X1 / R1 : 10;
  const systemRX = systemXR > 0 ? 1 / systemXR : 0.1;

  // 4. Fault Currents
  // 3-Phase Symmetrical Fault Current: Ik3 = (c * Un) / (sqrt(3) * Z1)
  const cUn = voltageFactorC * voltageUn;
  const Ik3 = cUn / (Math.sqrt(3) * Z1);

  // Single Line-to-Ground Fault Current: Ik1 = (sqrt(3) * c * Un) / (2 * Z1 + Z0)
  // Expressed with Z0/Z1 ratio: 2*Z1 + Z0 = (2 + ratio) * Z1
  const Ik1 = (Math.sqrt(3) * cUn) / ((2 + z0z1Ratio) * Z1);

  const Ik = faultType === 'three_phase' ? Ik3 : Ik1;

  // 5. Peak Factor κ & Peak Making Current ip
  const kappa = calculateKappa(systemRX);
  const ip = kappa * Math.sqrt(2) * Ik;

  // 6. Clearing Time Breakdown
  let tRelayMs = 5;
  if (protectionSpeed === 'delayed') {
    tRelayMs = relayOperateMs ?? 67;
  } else if (protectionSpeed === 'fail') {
    tRelayMs = Infinity;
  } else if (relayOperateMs !== undefined) {
    tRelayMs = relayOperateMs;
  }

  const tBreakerMs = breakerOpeningMs;
  const tArcMs = arcDurationMs;

  const tTotalMs = tRelayMs === Infinity ? Infinity : (tRelayMs + tBreakerMs + tArcMs);

  // 7. Energy & Thermal Withstand
  let letThroughEnergy = 0; // A²s
  let isLimitingActive = false;

  if (tTotalMs !== Infinity) {
    const uncappedEnergy = Math.pow(Ik, 2) * (tTotalMs / 1000); // A²s
    if (isLimitingBreaker) {
      // IEC 60898 Class 3 Current Limiting Breaker caps energy at high fault current
      // Standard target: 0.6 kA²s (600,000 A²s) at 15 kA prospective fault current
      const capTargetA2s = 600000 * Math.pow(Ik / 15000, 2);
      const cappedEnergy = Math.min(uncappedEnergy, Math.max(100000, capTargetA2s));
      if (cappedEnergy < uncappedEnergy) {
        letThroughEnergy = cappedEnergy;
        isLimitingActive = true;
      } else {
        letThroughEnergy = uncappedEnergy;
      }
    } else {
      letThroughEnergy = uncappedEnergy;
    }
  } else {
    letThroughEnergy = Infinity;
  }

  const kFactor = getKFactor(cableMaterial, cableInsulation);
  const withstandEnergy = calculateCableWithstand(cableSizeMm2, kFactor);
  const Smin = calculateSmin(letThroughEnergy, kFactor);
  const isThermalPass = letThroughEnergy <= withstandEnergy;

  return {
    Z_T,
    R_T,
    X_T,
    R_C,
    X_C,
    Z1,
    systemXR,
    systemRX,
    Ik3,
    Ik3_kA: Ik3 / 1000,
    Ik1,
    Ik1_kA: Ik1 / 1000,
    Ik,
    Ik_kA: Ik / 1000,
    kappa,
    ip,
    ip_kA: ip / 1000,
    tRelayMs,
    tBreakerMs,
    tArcMs,
    tTotalMs,
    letThroughEnergy,
    letThroughEnergy_kA2s: letThroughEnergy / 1000000,
    kFactor,
    withstandEnergy,
    withstandEnergy_kA2s: withstandEnergy / 1000000,
    Smin,
    isThermalPass,
    isLimitingActive
  };
}
