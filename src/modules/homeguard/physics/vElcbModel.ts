/**
 * Voltage-Operated Earth Leakage Circuit Breaker (v-ELCB) Physics Model
 * 
 * Standard: Pre-IEC 61008 / BS 4293 (1950s - 1970s).
 * Classification: "OBSOLETE (voltage-operated, pre-IEC 61008)"
 * 
 * Operating Principle:
 * Unlike modern current-operated RCCBs that sense residual current (IL - IN)
 * via a toroidal core, a v-ELCB senses voltage rise on the equipment metallic
 * frame (CPC) relative to an independent auxiliary earth electrode.
 * 
 * Fatal Flaw:
 * If the protective earth conductor (CPC) between the appliance and the v-ELCB
 * is broken, corroded, or disconnected, the frame stays at 230V live potential,
 * but V_coil = 0V -> THE BREAKER CANNOT TRIP!
 * Also, parallel earth paths (water pipes, gas pipes) bleed potential away
 * from the coil, blinding the trip mechanism.
 * 
 * Maintained strictly inside homeguard module per protocol until validated.
 */

export interface VELCBConfig {
  /** Trip threshold voltage across sense coil in Volts (typically 24V - 50V AC, standard 50V) */
  tripVoltageThreshold?: number;
  /** Internal resistance of the v-ELCB sense coil in Ohms (typically 200 - 500 Ohms) */
  coilResistance?: number;
  /** Resistance of the independent auxiliary earth electrode in Ohms (typically 10 - 50 Ohms) */
  auxiliaryEarthResistance?: number;
  /** Typical mechanical unlatch trip time in milliseconds */
  tripTimeMs?: number;
}

export interface VELCBEvaluationInput {
  /** Frame/chassis potential relative to true earth in Volts (e.g. 230V during phase-to-casing fault) */
  frameVoltage: number;
  /** Whether the protective earth conductor (CPC) between appliance frame and v-ELCB is intact */
  isEarthConductorIntact: boolean;
  /** Resistance of accidental parallel earth paths (e.g. metal water pipes, building steel) in Ohms. Infinity if none. */
  parallelEarthResistance?: number;
}

export type VELCBStatus =
  | 'STANDBY_SAFE'
  | 'TRIPPED_SAFE'
  | 'CRITICAL_FAILURE_CPC_BROKEN'
  | 'DESENSITIZED_PARALLEL_PATH'
  | 'BELOW_THRESHOLD';

export interface VELCBEvaluationResult {
  /** Always marked as obsolete */
  classification: string;
  /** Voltage appearing across the v-ELCB detection coil */
  coilVoltage: number;
  /** Current flowing through the trip coil in mA */
  coilCurrentMA: number;
  /** Voltage on the equipment metal chassis */
  chassisVoltage: number;
  /** Whether the mechanism tripped */
  isTripped: boolean;
  /** Trip time in milliseconds (Infinity if failed to trip) */
  tripTimeMs: number;
  /** Operational diagnostic status */
  status: VELCBStatus;
  /** Educational warning explaining what happened */
  explanation: string;
}

export interface VELCBInstance {
  readonly classification: string;
  readonly tripVoltageThreshold: number;
  readonly coilResistance: number;
  readonly auxiliaryEarthResistance: number;
  evaluate: (input: VELCBEvaluationInput) => VELCBEvaluationResult;
}

export const VELCB_OBSOLETE_LABEL = "OBSOLETE (voltage-operated, pre-IEC 61008)";

/**
 * Pure Factory function to create a v-ELCB simulation instance.
 */
export function createVELCB(config: VELCBConfig = {}): VELCBInstance {
  const tripVoltageThreshold = config.tripVoltageThreshold ?? 50; // 50V standard touch voltage limit
  const coilResistance = config.coilResistance ?? 300; // 300 ohms standard coil
  const auxiliaryEarthResistance = config.auxiliaryEarthResistance ?? 20; // 20 ohms rod
  const nominalTripTimeMs = config.tripTimeMs ?? 60; // 60ms solenoid latch release

  return {
    classification: VELCB_OBSOLETE_LABEL,
    tripVoltageThreshold,
    coilResistance,
    auxiliaryEarthResistance,

    evaluate: (input: VELCBEvaluationInput): VELCBEvaluationResult => {
      const {
        frameVoltage,
        isEarthConductorIntact,
        parallelEarthResistance = Infinity
      } = input;

      // Case 1: Broken Earth Conductor (CPC severed / loose connection)
      // The fatal flaw: appliance chassis is live, but circuit to v-ELCB coil is broken!
      if (!isEarthConductorIntact) {
        return {
          classification: VELCB_OBSOLETE_LABEL,
          coilVoltage: 0,
          coilCurrentMA: 0,
          chassisVoltage: frameVoltage,
          isTripped: false,
          tripTimeMs: Infinity,
          status: 'CRITICAL_FAILURE_CPC_BROKEN',
          explanation:
            'FATAL FLAW OCCURRED: The protective earth wire (CPC) is broken! Although the metal chassis is dangerously live at 230V, 0V reaches the v-ELCB sensing coil. The breaker FAILS TO TRIP, exposing anyone touching the frame to lethal shock!'
        };
      }

      // Case 2: Parallel Earth Path (e.g. copper plumbing / concrete foundation)
      // Fault current diverts around the coil through the plumbing, collapsing coil voltage
      let effectiveFrameVoltage = frameVoltage;
      if (Number.isFinite(parallelEarthResistance) && parallelEarthResistance > 0) {
        const coilBranchR = coilResistance + auxiliaryEarthResistance;
        const parallelR = parallelEarthResistance;
        const totalGroundR = (coilBranchR * parallelR) / (coilBranchR + parallelR);
        effectiveFrameVoltage = frameVoltage * (totalGroundR / (totalGroundR + 10));
      }

      // Voltage divider across the coil vs auxiliary earth electrode
      const coilVoltage = effectiveFrameVoltage * (coilResistance / (coilResistance + auxiliaryEarthResistance));
      const coilCurrentMA = (coilVoltage / coilResistance) * 1000;

      // Check if threshold reached
      if (coilVoltage >= tripVoltageThreshold) {
        return {
          classification: VELCB_OBSOLETE_LABEL,
          coilVoltage: Math.round(coilVoltage * 10) / 10,
          coilCurrentMA: Math.round(coilCurrentMA * 10) / 10,
          chassisVoltage: effectiveFrameVoltage,
          isTripped: true,
          tripTimeMs: nominalTripTimeMs,
          status: 'TRIPPED_SAFE',
          explanation: `Frame voltage reached ${Math.round(coilVoltage)}V (exceeding ${tripVoltageThreshold}V threshold). Trip coil energized (${Math.round(coilCurrentMA)}mA), releasing mechanical latch.`
        };
      }

      // If desensitized by parallel path
      if (Number.isFinite(parallelEarthResistance) && parallelEarthResistance < 50 && frameVoltage >= 50) {
        return {
          classification: VELCB_OBSOLETE_LABEL,
          coilVoltage: Math.round(coilVoltage * 10) / 10,
          coilCurrentMA: Math.round(coilCurrentMA * 10) / 10,
          chassisVoltage: effectiveFrameVoltage,
          isTripped: false,
          tripTimeMs: Infinity,
          status: 'DESENSITIZED_PARALLEL_PATH',
          explanation: `BLINDED BY PARALLEL EARTH: Metal water plumbing diverted fault current away from the coil. Coil voltage is only ${Math.round(coilVoltage)}V (< ${tripVoltageThreshold}V threshold). Breaker fails to trip!`
        };
      }

      // Normal safe / below threshold
      return {
        classification: VELCB_OBSOLETE_LABEL,
        coilVoltage: Math.round(coilVoltage * 10) / 10,
        coilCurrentMA: Math.round(coilCurrentMA * 10) / 10,
        chassisVoltage: effectiveFrameVoltage,
        isTripped: false,
        tripTimeMs: Infinity,
        status: frameVoltage > 0 ? 'BELOW_THRESHOLD' : 'STANDBY_SAFE',
        explanation: frameVoltage > 0
          ? `Frame voltage is ${Math.round(coilVoltage)}V, which is below the hazardous touch voltage threshold (${tripVoltageThreshold}V).`
          : 'Normal standby. 0V across coil. Circuit closed.'
      };
    }
  };
}
