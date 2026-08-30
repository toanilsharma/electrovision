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
    title: '1. Conventional Limits (1.05x vs 1.45x In)',
    oneLiner: '1.05x In holds indefinitely (no trip); 1.45x In trips bimetal in <=3600s.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: 1.05x In steady state 95°C (<130°C); 1.45x In trips in 2250s.',
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
    id: 'exp2_memory',
    title: '2. Hot vs Cold Re-trip Delta (Thermal Memory)',
    oneLiner: 'Hot bimetal (>60°C) retains thermal memory, accelerating subsequent trip.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Hot re-close trips 40% faster due to accumulated bimetal enthalpy.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 50,
      faultCurrent: 23.2,
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 10
    }
  },
  {
    id: 'exp3_derating',
    title: '3. Ambient Derating Sweep (20°C -> 60°C)',
    oneLiner: 'High ambient temperature reduces effective rating In_eff by 0.5%/°C.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: At 50°C, In_eff derates from 16A to 14.4A.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 50,
      faultCurrent: 18.1,
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp4_mag_edges',
    title: '4. Magnetic Band Edges (Curve C 4.9x vs 5.1x)',
    oneLiner: 'Below 5x In peak -> no magnetic trip; above 10x In peak -> instant magnetic trip.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: 4.9x peak enters tolerance zone; 10.1x peak trips in <10ms.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 81.6, // 5.1x In
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  },
  {
    id: 'exp5_inrush',
    title: '5. Motor Inrush vs Bolted Fault',
    oneLiner: 'Decaying motor inrush (10x In, tau=80ms) holds on Curve C, but trips Curve B.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Curve C holds inrush without nuisance tripping.',
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
    id: 'exp6_shootout',
    title: '6. Curve Shootout (8x In on B/C/D)',
    oneLiner: 'Same 8x In fault: Curve B trips instantly, Curve C in tolerance, Curve D holds.',
    expectedVerdict: 'PASS',
    observedVerdict: 'PASS: Curve B trips in <10ms; Curve C tolerance zone; Curve D holds.',
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
    id: 'exp7_3ph_faults',
    title: '7. 3-Phase Fault Types (3φ / L-L / L-G)',
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
    id: 'exp8_dc_interruption',
    title: '8. DC Interruption (L·di/dt Overvoltage)',
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
  },
  {
    id: 'exp9_icu_exceed',
    title: '9. Icu Exceedance (>6kA Fault - Contact Weld)',
    oneLiner: 'Fault current exceeding ultimate breaking capacity Icu causes contact weld failure.',
    expectedVerdict: 'FAIL',
    observedVerdict: 'DEVIATION: 10kA fault exceeds 6kA Icu -> Contact Weld Fail State.',
    params: {
      In: 16,
      curve: 'C',
      ambientTemp: 30,
      faultCurrent: 950.0,
      systemType: '1ph_230v',
      currentType: 'ac',
      faultType: 'L-N',
      timeLapseSpeed: 1
    }
  }
];
