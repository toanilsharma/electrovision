/**
 * HomeGuard Core UI Kit Hub
 * 
 * Reusable electrical instrumentation, faceplates, charts, alerts,
 * audio synthesizers, tour orchestrators, and snapshot composites.
 */

// Faceplates (Breaker Family)
export {
  ModularDeviceFaceplate,
  type ModularDeviceFaceplateProps,
  type BreakerDeviceType
} from './faceplates/ModularDeviceFaceplate';

// Charts & Oscilloscopes
export {
  Oscilloscope,
  type OscilloscopeProps
} from './charts/Oscilloscope';

export {
  TCCChart,
  type TCCChartProps,
  type OEMManufacturer
} from './charts/TCCChart';

// Controls
export {
  TimeWarpBar,
  type TimeWarpBarProps
} from './controls/TimeWarpBar';

// Alerts & Diagnostic Consoles
export {
  HazardConsole,
  type HazardConsoleProps,
  type AlertFeedItem
} from './alerts/HazardConsole';

// Audio Kit
export {
  SoundKit,
  defaultSoundKit,
  mcbSoundSystem,
  type SoundKitOptions
} from './audio/soundKit';

// Tours
export {
  createDriverTour,
  startCockpitTour,
  DEFAULT_MCB_COCKPIT_TOUR_STEPS,
  type TourConfig
} from './tour/driverTour';

// Snapshot Composite Generators
export {
  generateCockpitSnapshot,
  generateHomeSafetyAuditSnapshot,
  type SnapshotReportOptions,
  type CircuitAuditVerdictEntry,
  type ElectricianPartItem,
  type HomeSafetyAuditSnapshotOptions
} from './export/snapshotComposite';

