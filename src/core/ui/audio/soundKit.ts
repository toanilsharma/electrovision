/**
 * UI Audio Kit for Electrical Circuit Breakers & Switchgear Instruments
 * 
 * Synthesizes low-latency Web Audio sound effects:
 * - Mechanical toggle click & reclose latch
 * - Heavy spring trip clack (thermal & magnetic)
 * - Plasma arc hiss
 * - Continuous 50Hz/60Hz electromagnetic hum proportional to current
 */

import { mcbSoundSystem } from '../../../utils/mcbSoundPack';

export interface SoundKitOptions {
  muted?: boolean;
}

export class SoundKit {
  private muted: boolean = false;

  constructor(options?: SoundKitOptions) {
    if (options?.muted !== undefined) {
      this.muted = options.muted;
      mcbSoundSystem.setMuted(this.muted);
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    mcbSoundSystem.setMuted(muted);
  }

  public playClick(): void {
    if (this.muted) return;
    mcbSoundSystem.playRelayClick();
  }

  public playReclose(): void {
    if (this.muted) return;
    mcbSoundSystem.playRecloseLatch();
  }

  public playTrip(isShortCircuit: boolean = false): void {
    if (this.muted) return;
    mcbSoundSystem.playTripClack();
    if (isShortCircuit) {
      mcbSoundSystem.playArcHiss(0.08);
    }
  }

  public playArc(durationSec: number = 0.08): void {
    if (this.muted) return;
    mcbSoundSystem.playArcHiss(durationSec);
  }

  public updateHum(currentMultiple: number, isSimulating: boolean): void {
    if (this.muted) return;
    mcbSoundSystem.updateCurrentHum(currentMultiple, isSimulating);
  }
}

/** Global default sound instance */
export const defaultSoundKit = new SoundKit();

export { mcbSoundSystem };
