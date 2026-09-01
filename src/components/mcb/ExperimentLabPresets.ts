import { MCBTrippingCurve, SystemType, CurrentType, FaultType } from '../../mcb/types';

export interface ExperimentPreset {
  id: string;
  title: string;
  oneLiner: string;
  expectedVerdict: 'PASS' | 'DEVIATION' | 'FAIL';
  observedVerdict: string;
  params: {
    In: number;
    curve: MCBTrippingCurve;
    ambientTemp: number;
    faultCurrent: number;
    systemType: SystemType;
    currentType: CurrentType;
    faultType: FaultType;
    timeLapseSpeed: number;
  };
}

export const EXPERIMENT_LAB_PRESETS: ExperimentPreset[] = [
  {
    id: 'exp1_limits',
    title: '1. Conventional Limits (1.13x vs 1.45x In)',
    oneLiner: '1.13x In holds indefinitely (no trip <=1h); 1.45x In trips bimetal in <=3600s.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: 1.13x In steady state 120°C (<130°C); 1.45x In trips in 2246s.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 23.2, // 1.45x In
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 100
    }
  },
  {
    id: 'exp2_heavy_overload',
    title: '2. High Overload (2.55x In, 1-60s trip)',
    oneLiner: '2.55x In accelerates bimetal heating, tripping in 1s to 60s per IEC 60898-1 Table 7.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: 2.55x In trips in ~26.0s (strictly within 1-60s limit).',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 40.8, // 2.55x In
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 10
    }
  },
  {
    id: 'exp3_memory',
    title: '3. Hot vs Cold Re-trip Delta (Thermal Memory)',
    oneLiner: 'Hot bimetal (>60°C) retains thermal memory, accelerating subsequent trip upon re-closing.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Hot re-close trips 40% faster due to accumulated bimetal enthalpy.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 40,
      faultCurrent: 23.2,
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 10
    }
  },
  {
    id: 'exp4_derating',
    title: '4. Ambient Derating Sweep (-5°C -> +40°C)',
    oneLiner: 'Ambient temperature alters nominal rating In_eff by 0.5%/°C from 30°C reference.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: At 40°C, In_eff derates from 16A to 15.2A.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 40,
      faultCurrent: 20.0,
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp5_inrush',
    title: '5. Motor Inrush Preset (6-8x In, 20-100ms Decay)',
    oneLiner: 'Motor starting surge (7x In decaying in 60ms) safely holds on Curve C with NO nuisance trip.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Curve C solenoid withstands transient surge without nuisance trip.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 112.0, // 7x In
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp6_mag_edges',
    title: '6. Magnetic Band Edges (Curve C: 4.9x vs 10.0x)',
    oneLiner: 'Below 5x In peak -> NO magnetic trip; at 10x In peak -> instantaneous trip <10ms.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: 4.9x enters tolerance zone; 10x peak trips instantaneously in <10ms.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 160.0, // 10x In
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp7_shootout',
    title: '7. Curve Shootout (8x In on Curves B/C/D)',
    oneLiner: '8x In fault: Curve B trips instantly, Curve C in tolerance band, Curve D holds.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Curve B trips in <10ms; Curve C tolerance band; Curve D holds.',
    params: {
      In: 16,
      curve: 'B',
      ambientTemp: 30,
      faultCurrent: 128.0, // 8x In
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp8_3ph_faults',
    title: '8. 3-Phase Fault Types (3φ / L-L / L-G)',
    oneLiner: '3-pole ganged MCB opens all 3 poles simultaneously on any phase fault.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Mechanical tie-bar opens Phase A, B, C simultaneously.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 200.0,
      systemType: '3ph_400v',
      currentType: 'ac',
      faultType: '3ph_bolted',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp9_dc_interruption',
    title: '9. DC Interruption (L·di/dt Overvoltage)',
    oneLiner: 'DC fault has no natural current zero; arc tail & inductive voltage spike generated.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Overvoltage spike clamped by 35V arc voltage; exponential decay.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 150.0,
      systemType: '1ph_230v',
      currentType: 'dc',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  }
];
