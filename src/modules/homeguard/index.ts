/**
 * HomeGuard Residential Electrical Safety Module
 * 
 * Public API export hub
 */

export { HomeGuardSimulator } from './HomeGuardSimulator';
export { IsometricHouseView } from './components/IsometricHouseView';
export { DistributionBoard } from './components/DistributionBoard';
export { ToroidCoreVisualizer } from './components/ToroidCoreVisualizer';
export { VELCBComparisonModal } from './components/VELCBComparisonModal';
export { JargonTooltip } from './components/JargonTooltip';
export { RESIDENTIAL_SCENARIOS, RESIDENTIAL_CIRCUITS, AVAILABLE_APPLIANCES } from './data/residentialProfile';
export { RESIDENTIAL_GLOSSARY } from './data/residentialGlossary';
export { useHomeGuardEngine } from './hooks/useHomeGuardEngine';
export { DeathRaceView } from './components/DeathRaceView';
export { VerdictStamp } from './components/VerdictStamp';
export { HomeGuardMissionCards } from './components/HomeGuardMissionCards';
export { HOMEGUARD_PRESETS, type HomeGuardPreset } from './data/homeguardPresets';
export { loadAssessmentState, recordMissionPassed, resetAssessmentState, getHomeGuardRank, type MissionAssessmentState } from './data/assessmentStorage';
export { createVELCB, VELCB_OBSOLETE_LABEL, type VELCBInstance, type VELCBEvaluationResult } from './physics/vElcbModel';
export { HomeSafetyAuditModal, type HomeSafetyAuditModalProps } from './components/HomeSafetyAuditModal';
export {
  generateAuditReport,
  ELECTRICIAN_SHOPPING_ITEMS,
  parseHomeGuardUrlParams,
  buildHomeGuardShareableUrl,
  updateHomeGuardUrl,
  scenarioToQuerySlug,
  type BreakerConfigurationMode,
  type AuditReportModel
} from './data/auditReportData';

