import React from 'react';
import { TCCChart, TCCChartProps, OEMManufacturer } from '../../core/ui/charts/TCCChart';

export type CanvasTCCChartProps = TCCChartProps;
export type { OEMManufacturer };

export const CanvasTCCChart: React.FC<CanvasTCCChartProps> = (props) => {
  return <TCCChart {...props} />;
};

export { TCCChart };
