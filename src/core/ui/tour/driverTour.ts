/**
 * Driver.js Tour Orchestration Kit for Electrical Cockpits & Simulators
 */

import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export const DEFAULT_MCB_COCKPIT_TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="timewarp"]',
    popover: {
      title: '1. TIME WARP (1x / 10x / 100x)',
      description: 'Accelerate simulation speed to fast-forward prolonged thermal countdowns.'
    }
  },
  {
    element: '[data-tour="apply-fault"]',
    popover: {
      title: '2. APPLY FAULT CURRENT',
      description: 'Execute live IEC 60898-1 physics engine and trigger real-time bimetal/solenoid response.'
    }
  },
  {
    element: '[data-tour="tcc-chart"]',
    popover: {
      title: '3. TCC OPERATING POINT',
      description: 'Interactive log-log characteristic with real-time animated operating dot and fading trail.'
    }
  },
  {
    element: '[data-tour="oscilloscope"]',
    popover: {
      title: '4. 60FPS OSCILLOSCOPE',
      description: 'Continuous waveform trace with pre-fault load current and vertical trip markers.'
    }
  },
  {
    element: '[data-tour="stage-tabs"]',
    popover: {
      title: '5. MECHANISM & 3D COCKPIT',
      description: 'Switch between 2D SLD particle flow, 2D mechanism kinematics, and genuine 3D WebGL model.'
    }
  }
];

export interface TourConfig extends Partial<Config> {
  steps?: DriveStep[];
}

export function createDriverTour(options?: TourConfig) {
  const steps = options?.steps || DEFAULT_MCB_COCKPIT_TOUR_STEPS;
  return driver({
    showProgress: true,
    animate: true,
    ...options,
    steps
  });
}

export function startCockpitTour(steps?: DriveStep[]) {
  const d = createDriverTour({ steps });
  d.drive();
  return d;
}
