import { useEffect, useRef, useState, useCallback } from 'react';
import { WorkerInputParams, WorkerOutputData } from '../workers/mcbWorker';
import { BimetalThermalModel } from '../mcb/BimetalThermalModel';
import { MCBSimulator } from '../mcb/MCBSimulator';
import { MCBState } from '../mcb/types';

export function useMCBWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [data, setData] = useState<WorkerOutputData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  useEffect(() => {
    // Instantiate Web Worker using Vite module worker syntax
    try {
      workerRef.current = new Worker(
        new URL('../workers/mcbWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent<WorkerOutputData>) => {
        setData(e.data);
        setIsCalculating(false);
      };
    } catch {
      // Fallback if Web Workers are unavailable
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const calculateWaveform = useCallback((params: WorkerInputParams) => {
    setIsCalculating(true);

    if (workerRef.current) {
      workerRef.current.postMessage(params);
    } else {
      // Synchronous fallback calculation on main thread if worker unsupported
      const {
        In,
        curve,
        ambientTemp,
        faultCurrent,
        xrRatio,
        inceptionAngleDeg,
        durationSec = 0.1,
        dt = 0.0001
      } = params;

      const spec = BimetalThermalModel.createCalibratedSpec(In, curve, ambientTemp);
      const simulator = new MCBSimulator(spec, ambientTemp);
      simulator.setFaultWaveform({
        I_rms: faultCurrent,
        frequency: 50,
        inceptionAngle: (inceptionAngleDeg * Math.PI) / 180,
        xrRatio
      });

      const samples = [];
      let tDetect = -1;
      let tClear = -1;
      let maxI2t = 0;
      let maxIp = 0;
      const vPeak = 230 * Math.SQRT2;
      const omega = 2 * Math.PI * 50;

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

        if (snap.state === MCBState.OPEN_CLEARED && i > steps * 0.5) break;
      }

      setData({ samples, tDetect, tClear, maxI2t, maxIp });
      setIsCalculating(false);
    }
  }, []);

  return {
    data,
    isCalculating,
    calculateWaveform
  };
}
