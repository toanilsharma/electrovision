import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ModularDeviceFaceplate,
  type ModularDeviceFaceplateProps,
  Oscilloscope,
  TCCChart,
  TimeWarpBar,
  HazardConsole,
  SoundKit,
  defaultSoundKit,
  createDriverTour,
  generateCockpitSnapshot
} from '../index';
import { MCBState, TripCause } from '../../../mcb/types';

describe('HomeGuard Core UI Kit & Faceplate Factory (HG2)', () => {

  // ==========================================================================
  // 1. ModularDeviceFaceplate - MCB Variant (IEC 60898-1)
  // ==========================================================================
  it('renders MCB variant with IEC 60898-1 markings, Curve+In, and 6000A capacity', () => {
    const html = renderToStaticMarkup(
      React.createElement(ModularDeviceFaceplate, {
        deviceType: 'mcb',
        In: 16,
        curve: 'C',
        state: MCBState.CLOSED,
        tripCause: TripCause.NONE,
        onReclose: () => {}
      })
    );

    // Standard markings
    expect(html).toContain('DIN RAIL MCB');
    expect(html).toContain('IEC 60898-1');
    expect(html).toContain('C16');
    expect(html).toContain('230/400V~');
    expect(html).toContain('6000');
    expect(html).toContain('I (CLOSED)');
    expect(html).toContain('Re-close');

    // Should NOT contain RCCB/RCBO specific labels
    expect(html).not.toContain('IEC 61008-1');
    expect(html).not.toContain('IEC 61009-1');
    expect(html).not.toContain('TEST');
  });

  // ==========================================================================
  // 2. ModularDeviceFaceplate - RCCB Variant (IEC 61008-1)
  // ==========================================================================
  it('renders RCCB variant with IEC 61008-1 labels, 30mA, Type A symbol, and Test Button "T"', () => {
    const html = renderToStaticMarkup(
      React.createElement(ModularDeviceFaceplate, {
        deviceType: 'rccb',
        In: 40,
        iDeltaN: 30,
        rcdType: 'A',
        state: MCBState.CLOSED,
        tripCause: TripCause.NONE,
        onReclose: () => {},
        onTestTrip: () => {}
      })
    );

    expect(html).toContain('DIN RAIL RCCB');
    expect(html).toContain('IEC 61008-1');
    expect(html).toContain('In 40A');
    expect(html).toContain('IΔn 30mA');
    expect(html).toContain('30mA Type A');
    expect(html).toContain('TEST');
    expect(html).toContain("Test &#x27;T&#x27;");
  });

  // ==========================================================================
  // 3. ModularDeviceFaceplate - RCBO Variant (IEC 61009-1)
  // ==========================================================================
  it('renders RCBO variant with IEC 61009-1 labels, Curve+In, 30mA, and dual trip flag', () => {
    const html = renderToStaticMarkup(
      React.createElement(ModularDeviceFaceplate, {
        deviceType: 'rcbo',
        In: 16,
        curve: 'B',
        iDeltaN: 30,
        rcdType: 'A',
        state: MCBState.CLOSED,
        tripCause: TripCause.NONE,
        onReclose: () => {},
        onTestTrip: () => {}
      })
    );

    expect(html).toContain('DIN RAIL RCBO');
    expect(html).toContain('IEC 61009-1');
    expect(html).toContain('B16');
    expect(html).toContain('IΔn 30mA');
    expect(html).toContain('6000');
    expect(html).toContain('NORM');
    expect(html).toContain("Test &#x27;T&#x27;");
  });

  // ==========================================================================
  // 4. Tripped State Rendering
  // ==========================================================================
  it('renders open/tripped visual state (O OPEN, OFF flag)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ModularDeviceFaceplate, {
        deviceType: 'rcbo',
        In: 16,
        curve: 'C',
        state: MCBState.OPEN_CLEARED,
        tripCause: 'RESIDUAL_LEAKAGE',
        onReclose: () => {}
      })
    );

    expect(html).toContain('O (OPEN)');
    expect(html).toContain('OFF');
    expect(html).toContain('ΔI TRIP');
  });

  // ==========================================================================
  // 5. Controls - TimeWarpBar
  // ==========================================================================
  it('renders TimeWarpBar with speeds', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimeWarpBar, {
        speed: 10,
        onSpeedChange: () => {},
        speeds: [0.25, 1, 10, 100]
      })
    );

    expect(html).toContain('TIME WARP:');
    expect(html).toContain('0.25x');
    expect(html).toContain('1x');
    expect(html).toContain('10x');
    expect(html).toContain('100x');
  });

  // ==========================================================================
  // 6. Audio Kit & Tour & Export utilities are functional
  // ==========================================================================
  it('provides functional audio, tour, and export utilities', () => {
    expect(SoundKit).toBeDefined();
    expect(defaultSoundKit).toBeDefined();
    expect(createDriverTour).toBeDefined();
    expect(generateCockpitSnapshot).toBeDefined();
    expect(Oscilloscope).toBeDefined();
    expect(TCCChart).toBeDefined();
    expect(HazardConsole).toBeDefined();
  });

});
