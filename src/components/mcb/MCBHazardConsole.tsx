import React from 'react';
import { HazardConsole, HazardConsoleProps, AlertFeedItem } from '../../core/ui/alerts/HazardConsole';

export type MCBHazardConsoleProps = HazardConsoleProps;
export type { AlertFeedItem };

export const MCBHazardConsole: React.FC<MCBHazardConsoleProps> = (props) => {
  return <HazardConsole {...props} />;
};

export { HazardConsole };
