/**
 * shareableState.ts
 * Deep-linking and iframe embedding state serializer for ElectroLive
 */

export interface SimulationUrlParams {
  sim?: string;             // Active simulator ID
  v?: number;               // Voltage (V)
  skin?: string;            // Skin condition
  ppe?: string;             // PPE level
  rcd?: string;             // RCD protection mode
  cur?: number;             // Current (kA or A)
  time?: number;            // Clearing time (ms)
  dist?: number;            // Working distance (m)
  embed?: boolean;          // Stripped-down LMS/Widget embed mode
}

/**
 * Parses query parameters from current window URL or provided search string
 */
export function parseSimulationUrlParams(searchStr?: string): SimulationUrlParams {
  if (typeof window === 'undefined') return {};
  const search = searchStr !== undefined ? searchStr : window.location.search;
  const params = new URLSearchParams(search);

  const result: SimulationUrlParams = {};

  if (params.has('sim')) result.sim = params.get('sim') || undefined;
  if (params.has('v')) {
    const v = parseFloat(params.get('v') || '');
    if (!isNaN(v)) result.v = v;
  }
  if (params.has('skin')) result.skin = params.get('skin') || undefined;
  if (params.has('ppe')) result.ppe = params.get('ppe') || undefined;
  if (params.has('rcd')) result.rcd = params.get('rcd') || undefined;
  if (params.has('cur')) {
    const cur = parseFloat(params.get('cur') || '');
    if (!isNaN(cur)) result.cur = cur;
  }
  if (params.has('time')) {
    const time = parseFloat(params.get('time') || '');
    if (!isNaN(time)) result.time = time;
  }
  if (params.has('dist')) {
    const dist = parseFloat(params.get('dist') || '');
    if (!isNaN(dist)) result.dist = dist;
  }
  if (params.has('embed')) {
    result.embed = params.get('embed') === 'true' || params.get('embed') === '1';
  }

  return result;
}

/**
 * Constructs a deep-link URL for sharing or embedding
 */
export function buildShareableUrl(params: SimulationUrlParams, options?: { embedOnly?: boolean }): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin + window.location.pathname);

  if (params.sim) url.searchParams.set('sim', params.sim);
  if (params.v !== undefined) url.searchParams.set('v', params.v.toString());
  if (params.skin) url.searchParams.set('skin', params.skin);
  if (params.ppe) url.searchParams.set('ppe', params.ppe);
  if (params.rcd) url.searchParams.set('rcd', params.rcd);
  if (params.cur !== undefined) url.searchParams.set('cur', params.cur.toString());
  if (params.time !== undefined) url.searchParams.set('time', params.time.toString());
  if (params.dist !== undefined) url.searchParams.set('dist', params.dist.toString());

  if (options?.embedOnly || params.embed) {
    url.searchParams.set('embed', 'true');
  }

  return url.toString();
}

/**
 * Constructs an HTML iframe embed snippet
 */
export function buildIframeSnippet(url: string, width: string = '100%', height: string = '700px'): string {
  return `<iframe 
  src="${url}" 
  width="${width}" 
  height="${height}" 
  style="border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
  allow="fullscreen; accelerometer; autoplay"
  loading="lazy"
  title="ElectroLive Interactive Electrical Safety Simulation">
</iframe>`;
}
