import React from 'react';
import { MCBState, TripCause, MCBTrippingCurve } from '../../mcb/types';
import { ModularDeviceFaceplate, ModularDeviceFaceplateProps, BreakerDeviceType } from '../../core/ui/faceplates/ModularDeviceFaceplate';

export interface DINRailMCBFaceplateProps {
  In: number;
  curve: MCBTrippingCurve;
  state: MCBState;
  tripCause: TripCause;
  onReclose: () => void;
  className?: string;
  deviceType?: BreakerDeviceType;
  onTestTrip?: () => void;
  iDeltaN?: number;
  rcdType?: 'AC' | 'A' | 'B';
}

export const DINRailMCBFaceplate: React.FC<DINRailMCBFaceplateProps> = ({
  deviceType = 'mcb',
  ...props
}) => {
  return <ModularDeviceFaceplate deviceType={deviceType} {...props} />;
};

export { ModularDeviceFaceplate };
export type { ModularDeviceFaceplateProps, BreakerDeviceType };
