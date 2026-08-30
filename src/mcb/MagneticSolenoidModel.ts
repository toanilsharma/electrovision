import { MCBTrippingCurve, MagneticState } from './types';

export interface CurveBounds {
  lowerMultiple: number; // Lower bound (non-tripping threshold in multiples of In)
  upperMultiple: number; // Upper bound (must-trip threshold in multiples of In)
}

/**
 * IEC 60898-1 Magnetic Solenoid Model
 * 
 * Evaluates instantaneous peak currents for magnetic instantaneous tripping.
 * Multipliers:
 * - Curve B: 3x - 5x In
 * - Curve C: 5x - 10x In
 * - Curve D: 10x - 20x In
 */
export class MagneticSolenoidModel {
  private In: number;
  private curve: MCBTrippingCurve;

  constructor(In: number, curve: MCBTrippingCurve) {
    this.In = In;
    this.curve = curve;
  }

  /**
   * Returns curve boundaries in multiples of rated RMS current (In).
   */
  public static getCurveBounds(curve: MCBTrippingCurve): CurveBounds {
    switch (curve) {
      case 'B':
        return { lowerMultiple: 3, upperMultiple: 5 };
      case 'C':
        return { lowerMultiple: 5, upperMultiple: 10 };
      case 'D':
        return { lowerMultiple: 10, upperMultiple: 20 };
      default:
        throw new Error(`Unsupported MCB curve type: ${curve}`);
    }
  }

  /**
   * Evaluates magnetic solenoid trip status based on instantaneous peak current i_inst (Amperes).
   * 
   * @param instantaneousCurrent Instantaneous current magnitude |i(t)|
   * @param randomSeed Optional seed or probability threshold for deterministic tolerance zone testing (0.0 to 1.0)
   */
  public evaluate(instantaneousCurrent: number, randomValue: number = Math.random()): MagneticState {
    const absCurrent = Math.abs(instantaneousCurrent);
    
    // Rated peak current I_n_peak = √2 * I_n
    const ratedPeak = Math.SQRT2 * this.In;
    const multipleOfInPeak = absCurrent / ratedPeak;
    const bounds = MagneticSolenoidModel.getCurveBounds(this.curve);

    let isTripped = false;
    let isToleranceZone = false;
    let toleranceProbability = 0;

    if (multipleOfInPeak < bounds.lowerMultiple) {
      // Below lower threshold -> NEVER magnetic trip
      isTripped = false;
      isToleranceZone = false;
      toleranceProbability = 0;
    } else if (multipleOfInPeak >= bounds.upperMultiple) {
      // Above upper threshold -> GUARANTEED magnetic trip
      isTripped = true;
      isToleranceZone = false;
      toleranceProbability = 1.0;
    } else {
      // Inside Tolerance Zone: lowerMultiple <= multiple < upperMultiple
      isToleranceZone = true;
      // Linear interpolation of probability across tolerance band
      const range = bounds.upperMultiple - bounds.lowerMultiple;
      toleranceProbability = (multipleOfInPeak - bounds.lowerMultiple) / range;

      // Trip occurs if random threshold is less than probability
      isTripped = randomValue < toleranceProbability;
    }

    return {
      peakCurrent: absCurrent,
      kappaPeakFactor: 1.02 + 0.98 * Math.exp(-3 / 5),
      multipleOfIn: multipleOfInPeak,
      isToleranceZone,
      isTripped,
      toleranceProbability
    };
  }

  public setCurve(curve: MCBTrippingCurve): void {
    this.curve = curve;
  }

  public setRatedCurrent(In: number): void {
    this.In = In;
  }
}
