import { readJsonCache, writeJsonCache } from './cache';
import { fetchJsonWithRetry } from './http';

type Row = Record<string, any>;

const TIGERWEB = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/3/query';
const STATE_FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10', DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54', WI: '55', WY: '56', PR: '72', VI: '78', GU: '66', AS: '60', MP: '69',
};

const text = (value: unknown) => String(value ?? '').trim();

const roundCoordinates = (value: any): any => {
  if (!Array.isArray(value)) return value;
  if (typeof value[0] === 'number' && typeof value[1] === 'number') return [Math.round(Number(value[0]) * 10000) / 10000, Math.round(Number(value[1]) * 10000) / 10000];
  return value.map(roundCoordinates);
};

export async function getTerritoryMap(stateRaw: string, force = false) {
  const state = text(stateRaw).toUpperCase();
  const stateFips = STATE_FIPS[state];
  if (!stateFips) throw new Error(`No Census county geometry routing is configured for ${state || 'the selected market'}.`);
  const path = `cms-cache/territory-map-v1/${state}.json`;
  if (!force) {
    const cached = await readJsonCache<any>(path, 30 * 86400000);
    if (cached) return { ...cached.data, cache: { mode: 'persistent', ageMinutes: cached.ageMinutes } };
  }
  const url = new URL(TIGERWEB);
  url.searchParams.set('where', `STATE='${stateFips}'`);
  url.searchParams.set('outFields', 'GEOID,NAME,STATE');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('geometryPrecision', '4');
  url.searchParams.set('f', 'geojson');
  const raw = await fetchJsonWithRetry(url.toString(), { timeout: 30000, retries: 2 }) as Row;
  const rawFeatures = Array.isArray(raw.features) ? raw.features as Row[] : [];
  if (!rawFeatures.length) throw new Error(`Census TIGERweb returned no county/equivalent geometry for ${state}.`);
  const features = rawFeatures.map((feature) => {
    const properties = (feature.properties || {}) as Row;
    const geometry = (feature.geometry || {}) as Row;
    return {
      geoid: text(properties.GEOID),
      name: text(properties.NAME) || text(properties.BASENAME) || text(properties.GEOID),
      geometry: { type: text(geometry.type), coordinates: roundCoordinates(geometry.coordinates) },
    };
  }).filter((feature) => /^\d{5}$/.test(feature.geoid) && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'));
  if (!features.length) throw new Error(`Census TIGERweb geometry for ${state} did not contain usable county/equivalent polygons.`);
  const result = {
    state,
    stateFips,
    featureCount: features.length,
    features,
    source: {
      label: 'U.S. Census Bureau TIGERweb State_County · Counties layer',
      vintage: 'January 1, 2026',
      format: 'GeoJSON · WGS84',
      layer: 3,
    },
    caveat: 'County/equivalent boundary geometry is geographic context only. It does not establish hospice licensure, serviceability, drive time, staffing readiness or patient-level eligibility.',
  };
  await writeJsonCache(path, result);
  return { ...result, cache: { mode: 'refreshed', ageMinutes: 0 } };
}
