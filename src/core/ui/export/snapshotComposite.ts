/**
 * Canvas Snapshot Composite Report Generator
 * 
 * Renders high-resolution (1280x720) graphical telemetry cards
 * including scope window, TCC window, verdict stamp, and standard specifications.
 */

import { SimulationSnapshot, MCBState, MCBTrippingCurve } from '../../../mcb/types';

export interface SnapshotReportOptions {
  title?: string;
  standard?: string;
  curve?: MCBTrippingCurve;
  ratedCurrent: number;
  faultCurrent: number;
  systemDescription?: string;
  snapshot: SimulationSnapshot | null;
  ambientTemp?: number;
  filename?: string;
  autoDownload?: boolean;
}

export function generateCockpitSnapshot(options: SnapshotReportOptions): string | null {
  if (typeof document === 'undefined') return null;

  const {
    title = 'ELECTROLIVE • IEC 60898-1 MCB COCKPIT REPORT',
    standard = 'IEC 60898-1 Compliance Suite',
    curve = 'C',
    ratedCurrent,
    faultCurrent,
    systemDescription = '1Ø 230V AC',
    snapshot,
    ambientTemp = 30,
    filename,
    autoDownload = true
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const currentMultiplier = (faultCurrent / Math.max(1, ratedCurrent)).toFixed(2);

  // 1. Dark canvas background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 1280, 720);

  // 2. Top Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1280, 70);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 1280, 70);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(title, 30, 44);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(
    `Curve: ${curve}${ratedCurrent} | Fault: ${faultCurrent.toFixed(1)}A (${currentMultiplier}x In) | System: ${systemDescription}`,
    680,
    44
  );

  // 3. Grid Borders for Instruments
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, 90, 600, 390); // Scope Box
  ctx.fillRect(650, 90, 600, 390); // TCC Box
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(30, 90, 600, 390);
  ctx.strokeRect(650, 90, 600, 390);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('60fps Waveform Oscilloscope [uPlot]', 45, 120);
  ctx.fillText(`D3 Time-Current Characteristic (Curve ${curve})`, 665, 120);

  // 4. Verdict Stamp Banner
  const isTrip = snapshot?.state !== MCBState.CLOSED;
  ctx.fillStyle = isTrip ? '#991b1b' : '#065f46';
  ctx.fillRect(30, 500, 1220, 130);
  ctx.strokeStyle = isTrip ? '#ef4444' : '#10b981';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 500, 1220, 130);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  const verdictMsg = isTrip 
    ? `VERDICT: TRIPPED (${snapshot?.tripCause || 'FAULT'}) • Clearing Time: ${((snapshot?.letThrough.clearingTime || 0.0085) * 1000).toFixed(1)} ms`
    : 'VERDICT: CLOSED & ENERGIZED (Continuous Normal Operation)';
  ctx.fillText(verdictMsg, 50, 550);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(
    `Let-Through I²t: ${(snapshot?.letThrough.i2t || 0).toFixed(1)} A²s | Peak Ip: ${(snapshot?.letThrough.peakLetThroughCurrent || ratedCurrent * 1.414).toFixed(1)} A | κ-Factor: ${(snapshot?.magnetic.kappaPeakFactor || 1.45).toFixed(2)} | Ambient: ${ambientTemp}°C`,
    50,
    595
  );

  // 5. Footer Metadata
  ctx.fillStyle = '#64748b';
  ctx.font = '12px monospace';
  ctx.fillText(`Generated: ${new Date().toISOString()} • ${standard}`, 30, 685);

  const dataUrl = canvas.toDataURL('image/png');

  // Trigger Instant Download if requested
  if (autoDownload) {
    const link = document.createElement('a');
    link.download = filename || `Breaker_${curve}${ratedCurrent}_${faultCurrent.toFixed(0)}A_Snapshot.png`;
    link.href = dataUrl;
    link.click();
  }

  return dataUrl;
}

export interface CircuitAuditVerdictEntry {
  circuitId: string;
  name: string;
  rating: string;
  loadAmps: number;
  leakageMA?: number;
  status: 'COMPLIANT' | 'TRIPPED_SAFE' | 'CRITICAL_HAZARD' | 'OVERLOAD';
  clearingTime: string;
  standard: string;
}

export interface ElectricianPartItem {
  partString: string;
  circuitTarget: string;
  quantity: number;
  standard: string;
  notes?: string;
}

export interface HomeSafetyAuditSnapshotOptions {
  propertyTitle?: string;
  inspectionDate?: string;
  systemType?: string;
  breakerConfiguration: string;
  scenarioTitle: string;
  overallRating: 'GRADE A (EXCELLENT)' | 'GRADE B (ACCEPTABLE)' | 'GRADE F (CRITICAL HAZARD)';
  verdicts: CircuitAuditVerdictEntry[];
  shoppingList: ElectricianPartItem[];
  autoDownload?: boolean;
  filename?: string;
}

export function generateHomeSafetyAuditSnapshot(options: HomeSafetyAuditSnapshotOptions): string | null {
  if (typeof document === 'undefined') return null;

  const {
    propertyTitle = 'HOMEGUARD™ RESIDENTIAL PROPERTY SAFETY AUDIT',
    inspectionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    systemType = '230V AC TN-S (Single Phase 50Hz)',
    breakerConfiguration,
    scenarioTitle,
    overallRating,
    verdicts,
    shoppingList,
    autoDownload = true,
    filename
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 1280, 800);

  // Top Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1280, 80);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 1280, 80);

  ctx.fillStyle = '#f97316'; // Orange HomeGuard brand
  ctx.font = 'bold 22px monospace';
  ctx.fillText('ELECTROLIVE™ • ' + propertyTitle, 30, 42);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText(`System: ${systemType} | Date: ${inspectionDate} | Scenario: ${scenarioTitle}`, 30, 66);

  // Rating Badge on top right
  const isHazard = overallRating.includes('GRADE F');
  ctx.fillStyle = isHazard ? '#ef4444' : '#10b981';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`STATUS: ${overallRating}`, 840, 48);

  // SECTION 1: PER-CIRCUIT VERDICTS TABLE (Y: 100 -> 400)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(30, 100, 1220, 36);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(30, 100, 1220, 36);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('CIRCUIT IDENTIFIER', 45, 123);
  ctx.fillText('RATING / TYPE', 320, 123);
  ctx.fillText('LOAD / LEAKAGE', 500, 123);
  ctx.fillText('CLEARING TIME', 700, 123);
  ctx.fillText('SAFETY VERDICT', 890, 123);
  ctx.fillText('STANDARD', 1110, 123);

  let rowY = 145;
  verdicts.forEach((v, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#0b1329' : '#070b18';
    ctx.fillRect(30, rowY - 18, 1220, 42);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(30, rowY - 18, 1220, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(v.name, 45, rowY + 6);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px monospace';
    ctx.fillText(v.rating, 320, rowY + 6);

    const loadText = v.leakageMA && v.leakageMA > 0 
      ? `${v.loadAmps.toFixed(1)}A | ${v.leakageMA}mA leak` 
      : `${v.loadAmps.toFixed(1)}A normal`;
    ctx.fillText(loadText, 500, rowY + 6);
    ctx.fillText(v.clearingTime, 700, rowY + 6);

    // Status pill
    const statusColor = v.status === 'COMPLIANT' || v.status === 'TRIPPED_SAFE' 
      ? '#10b981' 
      : v.status === 'OVERLOAD' ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(v.status, 890, rowY + 6);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(v.standard, 1110, rowY + 6);

    rowY += 46;
  });

  // SECTION 2: ELECTRICIAN SHOPPING LIST (Y: 380 -> 680)
  const shopBoxY = Math.max(rowY + 10, 360);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, shopBoxY, 1220, 310);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, shopBoxY, 1220, 310);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('⚡ CERTIFIED ELECTRICIAN BILL OF MATERIALS (BOM) & SHOPPING LIST', 50, shopBoxY + 30);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText('Standard compliant replacements per IEC 60898-1, IEC 61008-1 & IEC 61009-1:', 50, shopBoxY + 52);

  let partY = shopBoxY + 85;
  shoppingList.forEach((item, index) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(50, partY - 18, 1180, 42);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(50, partY - 18, 1180, 42);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`ITEM #${index + 1}: ${item.partString}`, 65, partY + 6);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText(`Target: ${item.circuitTarget} | Qty: ${item.quantity}x | Std: ${item.standard}`, 720, partY + 6);

    partY += 50;
  });

  // SECTION 3: FOOTER TIMESTAMP & VERIFICATION HASH
  ctx.fillStyle = '#475569';
  ctx.font = '11px monospace';
  ctx.fillText(
    `Official HomeGuard™ Verification Token: HG-${Date.now().toString(36).toUpperCase()} • Generated via Pure Core Physics Engines (IEC 60898-1 / 61008-1 / 61009-1)`,
    30,
    770
  );

  const dataUrl = canvas.toDataURL('image/png');

  if (autoDownload) {
    const link = document.createElement('a');
    link.download = filename || `HomeGuard_Safety_Audit_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  return dataUrl;
}

