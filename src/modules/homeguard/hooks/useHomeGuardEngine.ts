/**
 * HomeGuard Physics Engine Hook
 * 
 * Directly consumes pure physics factories from src/core/physics (R1/R2 Single Source of Truth).
 * Simulates multi-circuit residential consumer unit (230V TN-S):
 * - Lighting (10A B-curve)
 * - Living Room Sockets (16A C-curve)
 * - Kitchen Sockets (16A C-curve)
 * - Main RCCB Incomer (40A, 30mA Type A)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createMCB, MCBEngineInstance } from '../../../core/physics/mcbEngine';
import { createRCD, RCDEngineInstance } from '../../../core/physics/rcdEngine';
import { MCBState, TripCause } from '../../../mcb/types';
import { RESIDENTIAL_SCENARIOS, ResidentialScenario } from '../data/residentialProfile';
import { defaultSoundKit } from '../../../core/ui/audio/soundKit';

export interface CircuitState {
  state: MCBState;
  tripCause: TripCause | 'RESIDUAL_LEAKAGE' | 'TEST_TRIP';
  currentAmps: number;
  temperatureC: number;
  remainingTripTimeSec: number;
}

export function useHomeGuardEngine(
  initialScenarioId: string = 'normal_living',
  dynamicC2Amps?: number,
  dynamicC3Amps?: number
) {
  const [selectedScenario, setSelectedScenario] = useState<ResidentialScenario>(() => {
    return RESIDENTIAL_SCENARIOS.find(s => s.id === initialScenarioId) || RESIDENTIAL_SCENARIOS[0];
  });

  const [timeLapseSpeed, setTimeLapseSpeed] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Circuit MCB Engines (Isolated instances per R5)
  const enginesRef = useRef<{
    c1: MCBEngineInstance;
    c2: MCBEngineInstance;
    c3: MCBEngineInstance;
    rccb: RCDEngineInstance;
  }>({
    c1: createMCB({ In: 10, curve: 'B', ambientTemp: 30 }),
    c2: createMCB({ In: 16, curve: 'C', ambientTemp: 30 }),
    c3: createMCB({ In: 16, curve: 'C', ambientTemp: 30 }),
    rccb: createRCD({ iDeltaN: 30 })
  });

  // Reactive state for UI
  const [circuitStates, setCircuitStates] = useState<Record<string, CircuitState>>({
    c1_lighting: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: 1.5, temperatureC: 30, remainingTripTimeSec: Infinity },
    c2_living_sockets: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: 4.2, temperatureC: 30, remainingTripTimeSec: Infinity },
    c3_kitchen_sockets: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: 2.0, temperatureC: 30, remainingTripTimeSec: Infinity },
    main_rccb: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: 7.7, temperatureC: 30, remainingTripTimeSec: Infinity }
  });

  // Theoretical countdown remaining on the living room socket circuit (c2)
  const [livingCountdownSec, setLivingCountdownSec] = useState<number>(Infinity);

  // Reset simulation and reload engines on scenario change
  const resetScenario = useCallback((scenario: ResidentialScenario) => {
    setSelectedScenario(scenario);

    // Reset core physics instances
    enginesRef.current.c1 = createMCB({ In: 10, curve: 'B', ambientTemp: 30 });
    enginesRef.current.c2 = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    enginesRef.current.c3 = createMCB({ In: 16, curve: 'C', ambientTemp: 30 });
    enginesRef.current.rccb = createRCD({ iDeltaN: 30 });

    const c2Current = scenario.targetCircuitId === 'c2_living_sockets' ? scenario.totalLoadAmps : (dynamicC2Amps ?? 4.2);
    const c3Current = scenario.targetCircuitId === 'c3_kitchen_sockets' ? scenario.totalLoadAmps : (dynamicC3Amps ?? 2.0);

    // Calculate theoretical trip time on c2 using the exact calibrated bimetal thermal model
    let countdown = Infinity;
    if (scenario.faultType === 'thermal_overload') {
      const model = enginesRef.current.c2.getRawSimulator().getThermalModel();
      countdown = model.calculateTheoreticalTripTime(c2Current, 30);
    } else if (scenario.faultType === 'short_circuit') {
      countdown = 0.008;
    } else if (scenario.faultType === 'earth_leakage') {
      countdown = 0.040;
    }
    setLivingCountdownSec(countdown);

    setCircuitStates({
      c1_lighting: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: 1.5, temperatureC: 30, remainingTripTimeSec: Infinity },
      c2_living_sockets: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: c2Current, temperatureC: 30, remainingTripTimeSec: countdown },
      c3_kitchen_sockets: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: c3Current, temperatureC: 30, remainingTripTimeSec: Infinity },
      main_rccb: { state: MCBState.CLOSED, tripCause: TripCause.NONE, currentAmps: c2Current + c3Current + 1.5, temperatureC: 30, remainingTripTimeSec: scenario.faultType === 'earth_leakage' ? 0.040 : Infinity }
    });

    setIsSimulating(true);
  }, [dynamicC2Amps, dynamicC3Amps]);

  // Sync mute with soundKit
  useEffect(() => {
    defaultSoundKit.setMuted(isMuted);
  }, [isMuted]);

  // Handle Breaker Re-close
  const handleRecloseBreaker = useCallback((circuitId: string) => {
    defaultSoundKit.playReclose();

    if (circuitId === 'c2_living_sockets') {
      enginesRef.current.c2.reset(30);
    } else if (circuitId === 'c1_lighting') {
      enginesRef.current.c1.reset(30);
    } else if (circuitId === 'c3_kitchen_sockets') {
      enginesRef.current.c3.reset(30);
    }

    setCircuitStates(prev => ({
      ...prev,
      [circuitId]: {
        ...prev[circuitId],
        state: MCBState.CLOSED,
        tripCause: TripCause.NONE
      }
    }));
  }, []);

  // Handle RCCB Test Button "T"
  const handleTestTripRCCB = useCallback(() => {
    defaultSoundKit.playTrip(false);
    setCircuitStates(prev => ({
      ...prev,
      main_rccb: {
        ...prev.main_rccb,
        state: MCBState.OPEN_CLEARED,
        tripCause: 'TEST_TRIP'
      }
    }));
  }, []);

  // Simulation physics step loop (Multi-branch C2 and C3)
  useEffect(() => {
    if (!isSimulating) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaSec = (time - lastTime) / 1000;
      lastTime = time;

      const isC1Tripped = circuitStates.c1_lighting.state !== MCBState.CLOSED;
      const isC2Tripped = circuitStates.c2_living_sockets.state !== MCBState.CLOSED;
      const isC3Tripped = circuitStates.c3_kitchen_sockets.state !== MCBState.CLOSED;
      const isRCCBTripped = circuitStates.main_rccb.state !== MCBState.CLOSED;

      // ── Branch C2 (Living Room) ──
      const baseLoadC2 = dynamicC2Amps !== undefined ? dynamicC2Amps : (
        selectedScenario.targetCircuitId === 'c2_living_sockets' ? selectedScenario.totalLoadAmps : 4.2
      );
      const c2TargetCurrent = isC2Tripped || isRCCBTripped
        ? 0
        : selectedScenario.faultType === 'short_circuit' && selectedScenario.targetCircuitId === 'c2_living_sockets'
        ? 250.0
        : baseLoadC2;

      // ── Branch C3 (Kitchen Heavy Sockets) ──
      const baseLoadC3 = dynamicC3Amps !== undefined ? dynamicC3Amps : (
        selectedScenario.targetCircuitId === 'c3_kitchen_sockets' ? selectedScenario.totalLoadAmps : 2.0
      );
      const c3TargetCurrent = isC3Tripped || isRCCBTripped
        ? 0
        : selectedScenario.faultType === 'short_circuit' && selectedScenario.targetCircuitId === 'c3_kitchen_sockets'
        ? 250.0
        : baseLoadC3;

      const dt = Math.min(2.0, deltaSec * timeLapseSpeed);

      // Step C2 Engine
      if (!isC2Tripped && !isRCCBTripped) {
        const snapC2 = enginesRef.current.c2.step(dt, c2TargetCurrent);

        if (snapC2.state !== MCBState.CLOSED) {
          const isShort = snapC2.tripCause === TripCause.MAGNETIC || snapC2.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;
          defaultSoundKit.playTrip(isShort);

          setCircuitStates(prev => ({
            ...prev,
            c2_living_sockets: {
              ...prev.c2_living_sockets,
              state: snapC2.state,
              tripCause: snapC2.tripCause,
              currentAmps: 0,
              temperatureC: snapC2.thermal.temperature,
              remainingTripTimeSec: 0
            }
          }));
          setLivingCountdownSec(0);
        } else {
          const model = enginesRef.current.c2.getRawSimulator().getThermalModel();
          const rem = Math.max(0, model.calculateTheoreticalTripTime(c2TargetCurrent, 30) - snapC2.time);
          setLivingCountdownSec(rem);

          setCircuitStates(prev => ({
            ...prev,
            c2_living_sockets: {
              ...prev.c2_living_sockets,
              currentAmps: c2TargetCurrent,
              temperatureC: snapC2.thermal.temperature,
              remainingTripTimeSec: rem
            }
          }));
        }
      }

      // Step C3 Engine (Kitchen)
      if (!isC3Tripped && !isRCCBTripped) {
        const snapC3 = enginesRef.current.c3.step(dt, c3TargetCurrent);

        if (snapC3.state !== MCBState.CLOSED) {
          const isShort = snapC3.tripCause === TripCause.MAGNETIC || snapC3.tripCause === TripCause.MAGNETIC_TOLERANCE_ZONE;
          defaultSoundKit.playTrip(isShort);

          setCircuitStates(prev => ({
            ...prev,
            c3_kitchen_sockets: {
              ...prev.c3_kitchen_sockets,
              state: snapC3.state,
              tripCause: snapC3.tripCause,
              currentAmps: 0,
              temperatureC: snapC3.thermal.temperature,
              remainingTripTimeSec: 0
            }
          }));
        } else {
          setCircuitStates(prev => ({
            ...prev,
            c3_kitchen_sockets: {
              ...prev.c3_kitchen_sockets,
              currentAmps: c3TargetCurrent,
              temperatureC: snapC3.thermal.temperature
            }
          }));
        }
      }

      // Check Earth Leakage on RCCB
      if (!isRCCBTripped && selectedScenario.faultType === 'earth_leakage' && selectedScenario.leakageCurrentMA) {
        const rcdResult = enginesRef.current.rccb.evaluate(selectedScenario.leakageCurrentMA);
        if (rcdResult.shouldTrip) {
          defaultSoundKit.playTrip(false);
          setCircuitStates(prev => ({
            ...prev,
            main_rccb: {
              ...prev.main_rccb,
              state: MCBState.OPEN_CLEARED,
              tripCause: 'RESIDUAL_LEAKAGE',
              currentAmps: 0
            }
          }));
        }
      }

      // Update total incomer RCCB current
      const liveC1 = isC1Tripped || isRCCBTripped ? 0 : 1.5;
      const liveC2 = isC2Tripped || isRCCBTripped ? 0 : c2TargetCurrent;
      const liveC3 = isC3Tripped || isRCCBTripped ? 0 : c3TargetCurrent;
      const totalIncomerCurrent = isRCCBTripped ? 0 : Number((liveC1 + liveC2 + liveC3).toFixed(1));

      setCircuitStates(prev => {
        if (prev.main_rccb.currentAmps === totalIncomerCurrent) return prev;
        return {
          ...prev,
          main_rccb: {
            ...prev.main_rccb,
            currentAmps: totalIncomerCurrent
          }
        };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    isSimulating,
    selectedScenario,
    timeLapseSpeed,
    dynamicC2Amps,
    dynamicC3Amps,
    circuitStates.c1_lighting.state,
    circuitStates.c2_living_sockets.state,
    circuitStates.c3_kitchen_sockets.state,
    circuitStates.main_rccb.state
  ]);

  return {
    selectedScenario,
    selectScenario: resetScenario,
    circuitStates,
    livingCountdownSec,
    leakageCurrentMA: selectedScenario.leakageCurrentMA ?? 0,
    timeLapseSpeed,
    setTimeLapseSpeed,
    isMuted,
    setIsMuted,
    handleRecloseBreaker,
    handleTestTripRCCB
  };
}
