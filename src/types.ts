export type SimulationType = 
  | 'ac_shock'
  | 'dc_shock'
  | 'earth_fault'
  | 'short_circuit'
  | 'step_touch'
  | 'arc_flash'
  | 'loto'
  | 'first_aid'
  | 'assessment';

export type Environment = 'residential' | 'industrial';

export type DigitalTwinProfile = 
  | 'adult_male'
  | 'adult_female'
  | 'teenager'
  | 'child'
  | 'electrician'
  | 'engineer'
  | 'technician'
  | 'supervisor';

export interface UserConfig {
  environment: Environment;
  profile: DigitalTwinProfile;
  name?: string;
}

export type UserMode = 'residential' | 'industrial';
export type ShockEffectLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface PPEItem {
  id: string;
  name: string;
  mandatory: boolean;
  icon: string;
}
