import React from 'react';
import { Oscilloscope, OscilloscopeProps } from '../../core/ui/charts/Oscilloscope';

export type CanvasOscilloscopeProps = OscilloscopeProps;

export const CanvasOscilloscope: React.FC<CanvasOscilloscopeProps> = (props) => {
  return <Oscilloscope {...props} />;
};

export { Oscilloscope };
