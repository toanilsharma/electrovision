import { BimetalThermalModel } from '../mcb/BimetalThermalModel';
import { MCBSimulator } from '../mcb/MCBSimulator';
import { MCBState, MCBTrippingCurve, SystemType, CurrentType, FaultType } from '../mcb/types';

export interface WorkerInputParams {
  In: number;
  curve: MCBTrippingCurve;
  ambientTemp: number;
  faultCurrent: number;
  xrRatio: number;
  inceptionAngleDeg: number;
  systemType?: SystemType;
  currentType?: CurrentType;
  faultType?: FaultType;
  durationSec?: number;
  dt?: number;
}

export interface WaveformSample {
  time: number;
  current: number;
  voltage: number;
  bimetalTemp: number;
  i2t: number;
  peakIp: number;
  state: MCBState;
  isDetectPoint: boolean;
  isClearPoint: boolean;
}

export interface WorkerOutputData {
  samples: WaveformSample[];
  tDetect: number;
  tClear: number;
  maxI2t: number;
  maxIp: number;
}

// Background computation handler
self.onmessage = (e: MessageEvent<WorkerInputParams>) => {
  const {
    In,
    curve,
    ambientTemp,
    faultCurrent,
    xrRatio,
    inceptionAngleDeg,
    systemType = '1ph_230v',
    currentType = 'ac',
    faultType = 'L-N',
    durationSec = 0.1,
    dt = 0.0001
  } = e.data;

  const spec = BimetalThermalModel.createCalibratedSpec(In, curve, ambientTemp);
  const simulator = new MCBSimulator(spec, ambientTemp);
  simulator.setFaultWaveform({
    I_rms: faultCurrent,
    frequency: currentType === 'dc' ? 0 : 50,
    inceptionAngle: (inceptionAngleDeg * Math.PI) / 180,
    xrRatio,
    systemType,
    currentType,
    faultType
  });

  const samples: WaveformSample[] = [];
  let tDetect = -1;
  let tClear = -1;
  let maxI2t = 0;
  let maxIp = 0;

  const totalSteps = Math.ceil(durationSec / dt);

  for (let step = 0; step < totalSteps; step++) {
    const snap = simulator.step(dt);

    if (snap.state === MCBState.UNLATCHED && tDetect < 0) {
      tDetect = snap.time;
    }
    if (snap.state === MCBState.OPEN_CLEARED && tClear < 0) {
      tClear = snap.time;
    }

    if (snap.letThrough.i2t > maxI2t) maxI2t = snap.letThrough.i2t;
    if (snap.letThrough.peakLetThroughCurrent > maxIp) maxIp = snap.letThrough.peakLetThroughCurrent;

    samples.push({
      time: snap.time,
      current: snap.current,
      voltage: snap.threePhase.v_ln,
      bimetalTemp: snap.thermal.temperature,
      i2t: snap.letThrough.i2t,
      peakIp: snap.letThrough.peakLetThroughCurrent,
      state: snap.state,
      isDetectPoint: tDetect === snap.time,
      isClearPoint: tClear === snap.time
    });

    if (snap.state === MCBState.OPEN_CLEARED && step > totalSteps * 0.3) {
      break;
    }
  }

  self.postMessage({
    samples,
    tDetect,
    tClear,
    maxI2t,
    maxIp
  });
};
