import { BimetalThermalModel } from '../mcb/BimetalThermalModel';
import { MCBSimulator } from '../mcb/MCBSimulator';
import { MCBState, MCBTrippingCurve } from '../mcb/types';

export interface WorkerInputParams {
  In: number;
  curve: MCBTrippingCurve;
  ambientTemp: number;
  faultCurrent: number;
  xrRatio: number;
  inceptionAngleDeg: number;
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
    durationSec = 0.1,
    dt = 0.0001
  } = e.data;

  const spec = BimetalThermalModel.createCalibratedSpec(In, curve, ambientTemp);
  const simulator = new MCBSimulator(spec, ambientTemp);
  simulator.setFaultWaveform({
    I_rms: faultCurrent,
    frequency: 50,
    inceptionAngle: (inceptionAngleDeg * Math.PI) / 180,
    xrRatio
  });

  const samples: WaveformSample[] = [];
  let tDetect = -1;
  let tClear = -1;
  let maxI2t = 0;
  let maxIp = 0;

  const omega = 2 * Math.PI * 50;
  const vPeak = 230 * Math.SQRT2; // 230V RMS grid voltage

  const steps = Math.min(2000, Math.ceil(durationSec / dt));

  for (let i = 0; i < steps; i++) {
    const snap = simulator.step(dt, faultCurrent);
    const time = snap.time;
    const voltage = snap.state === MCBState.OPEN_CLEARED ? 0 : vPeak * Math.sin(omega * time + (inceptionAngleDeg * Math.PI) / 180);

    const isDetectPoint = tDetect < 0 && snap.state === MCBState.UNLATCHED;
    if (isDetectPoint) tDetect = time;

    const isClearPoint = tClear < 0 && snap.state === MCBState.OPEN_CLEARED;
    if (isClearPoint) tClear = time;

    if (snap.letThrough.i2t > maxI2t) maxI2t = snap.letThrough.i2t;
    if (snap.letThrough.peakLetThroughCurrent > maxIp) maxIp = snap.letThrough.peakLetThroughCurrent;

    samples.push({
      time,
      current: snap.current,
      voltage,
      bimetalTemp: snap.thermal.temperature,
      i2t: snap.letThrough.i2t,
      peakIp: snap.letThrough.peakLetThroughCurrent,
      state: snap.state,
      isDetectPoint,
      isClearPoint
    });

    if (snap.state === MCBState.OPEN_CLEARED && i > steps * 0.5) {
      break;
    }
  }

  const result: WorkerOutputData = {
    samples,
    tDetect,
    tClear,
    maxI2t,
    maxIp
  };

  self.postMessage(result);
};
