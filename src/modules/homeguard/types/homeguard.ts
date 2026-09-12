/**
 * homeguard.ts
 * 
 * Shared types for HomeGuard simulator presentation shells.
 */

import { CircuitState } from '../hooks/useHomeGuardEngine';
import { ResidentialScenario } from '../data/residentialProfile';

export type { CircuitState };
export type CircuitStates = Record<string, CircuitState>;
export type ScenarioProfile = ResidentialScenario;
