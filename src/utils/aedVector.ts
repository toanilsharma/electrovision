/**
 * AED Electrode Pad Placement & Vector Alignment Physics
 *
 * Standards:
 * - AHA BLS 2020-2025 / ERC 2021-2025: Anterolateral Pad Placement
 * - Pad 1 (Sternum): Upper right anterior chest (infraclavicular, right of sternum)
 * - Pad 2 (Apex): Lower left lateral chest (mid-axillary line, 5th-6th intercostal space)
 * - Transmyocardial current vector must cross the cardiac ventricles at an optimal angle (~45 degrees).
 */

export interface PadPosition {
  x: number; // Percentage of chest width (0 - 100%)
  y: number; // Percentage of chest height (0 - 100%)
  isAttached: boolean;
}

export interface AedVectorResult {
  isBothAttached: boolean;
  vectorAngleDeg: number;
  transcardiacCurrentFraction: number; // 0.0 to 1.0 (ideal ~0.95)
  padContactQuality: 'ideal' | 'acceptable' | 'poor' | 'disconnected';
  contactImpedanceOhms: number; // Typically 60 - 90 Ohms if ideal; >140 Ohms if misplaced/poor contact
  placementFeedback: string;
}

// Ideal Clinical Anterolateral Coordinates (Percentage of Torso Viewport)
export const IDEAL_PAD_STERNAL: { x: number; y: number } = { x: 68, y: 28 }; // Right upper chest
export const IDEAL_PAD_APICAL: { x: number; y: number } = { x: 30, y: 72 }; // Left lower lateral ribs

// Cardiac Electrical Axis Vector (~ -55 degrees relative to horizontal in torso coordinates)
const CARDIAC_AXIS_DX = IDEAL_PAD_APICAL.x - IDEAL_PAD_STERNAL.x; // ~ -38
const CARDIAC_AXIS_DY = IDEAL_PAD_APICAL.y - IDEAL_PAD_STERNAL.y; // ~ +44

/**
 * Calculates transmyocardial defibrillation vector efficiency and contact impedance.
 */
export function calculatePadVector(
  pad1: PadPosition,
  pad2: PadPosition
): AedVectorResult {
  if (!pad1.isAttached || !pad2.isAttached) {
    return {
      isBothAttached: false,
      vectorAngleDeg: 0,
      transcardiacCurrentFraction: 0,
      padContactQuality: 'disconnected',
      contactImpedanceOhms: 999,
      placementFeedback: !pad1.isAttached && !pad2.isAttached
        ? 'Attach both electrode pads to patient bare chest'
        : !pad1.isAttached
        ? 'Attach Upper Right (Sternum) Pad below collarbone'
        : 'Attach Lower Left (Apex) Pad below armpit',
    };
  }

  // Distance from ideal locations (Euclidean error)
  const err1 = Math.hypot(pad1.x - IDEAL_PAD_STERNAL.x, pad1.y - IDEAL_PAD_STERNAL.y);
  const err2 = Math.hypot(pad2.x - IDEAL_PAD_APICAL.x, pad2.y - IDEAL_PAD_APICAL.y);

  // Vector between actual pads
  const padDx = pad2.x - pad1.x;
  const padDy = pad2.y - pad1.y;
  const padDist = Math.hypot(padDx, padDy);

  if (padDist < 18) {
    // Pads too close together (arcing risk / bypass current)
    return {
      isBothAttached: true,
      vectorAngleDeg: 0,
      transcardiacCurrentFraction: 0.15,
      padContactQuality: 'poor',
      contactImpedanceOhms: 35,
      placementFeedback: 'DANGER: Pads placed too close together! Risk of surface arcing. Separate pads immediately.',
    };
  }

  // Vector dot product with cardiac electrical axis
  const cardiacMag = Math.hypot(CARDIAC_AXIS_DX, CARDIAC_AXIS_DY);
  const dot = (padDx * CARDIAC_AXIS_DX + padDy * CARDIAC_AXIS_DY) / (padDist * cardiacMag);
  const cosTheta = Math.max(-1, Math.min(1, dot));
  const vectorAngleDeg = Math.round(Math.acos(cosTheta) * (180 / Math.PI));

  // Distance tolerance penalty
  const totalDistErr = err1 + err2;
  const distanceFactor = Math.max(0.2, 1.0 - totalDistErr / 60.0);

  // Angle efficiency (optimal when parallel to cardiac axis, cosTheta ~ 1.0)
  const angleFactor = Math.max(0.1, cosTheta);

  // Overall transcardiac current fraction
  const currentFraction = Number((distanceFactor * angleFactor * 0.96).toFixed(2));

  // Impedance calculation
  const contactImpedanceOhms = Math.round(70 + totalDistErr * 2.2);

  let padContactQuality: AedVectorResult['padContactQuality'] = 'ideal';
  let placementFeedback = '✓ IDEAL PAD VECTOR: Optimal transcardiac current path across ventricles.';

  if (currentFraction >= 0.8) {
    padContactQuality = 'ideal';
    placementFeedback = '✓ OPTIMAL PLACEMENT: Maximum defibrillation vector through myocardium.';
  } else if (currentFraction >= 0.55) {
    padContactQuality = 'acceptable';
    placementFeedback = 'ACCEPTABLE VECTOR: Sub-optimal position. Adjust apex pad lower/lateral for higher efficacy.';
  } else {
    padContactQuality = 'poor';
    placementFeedback = 'POOR PAD VECTOR: Misaligned current vector! Less than 40% current reaches the heart.';
  }

  return {
    isBothAttached: true,
    vectorAngleDeg,
    transcardiacCurrentFraction: Math.max(0.1, Math.min(0.98, currentFraction)),
    padContactQuality,
    contactImpedanceOhms,
    placementFeedback,
  };
}
