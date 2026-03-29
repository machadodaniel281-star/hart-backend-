/**
 * GTFS static cache — downloads and parses HART GTFS zip.
 * Builds lookups: tripId → routeId, tripId → headsign, routeId → shortName.
 * Refreshes every 12 hours.
 */

const https = require('https');
const http  = require('http');
const { readZip, parseCSV } = require('./utils');

const GTFS_URLS = [
  'http://www.gohart.org/google/google_transit.zip',
  'https://storage.googleapis.com/mdb-latest/us-florida-hillsborough-area-regional-transit-gtfs-1163.zip',
];

let cache = {
  tripRouteMap:   {},   // tripId → routeId
  tripHeadsign:   {},   // tripId → headsign
  tripDirection:  {},   // tripId → directionId (0|1)
  tripShapeId:    {},   // tripId → shapeId
  routeShortName: {},   // routeId → shortName
  routes:         [],   // [{routeId, shortName, longName, color}]
  stops:          [],   // [{stopId, name, lat, lng}]
  loadedAt: null,
};

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'SunListFL-HART/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

async function loadGTFS() {
  let zipBuf = null;
  for (const url of GTFS_URLS) {
    try {
      console.log(`[GTFS] Downloading from ${url}`);
      zipBuf = await fetchBuffer(url);
      console.log(`[GTFS] Downloaded ${(zipBuf.length / 1024).toFixed(0)} KB`);
      break;
    } catch (e) {
      console.warn(`[GTFS] Failed ${url}: ${e.message}`);
    }
  }
  if (!zipBuf) {
    console.error('[GTFS] All GTFS sources failed. Trip→Route map will be empty.');
    return;
  }

  const files = readZip(zipBuf);

  // Parse routes.txt
  const routeRows = files['routes.txt'] ? parseCSV(files['routes.txt']) : [];
  const routeShortName = {};
  const routes = [];
  for (const r of routeRows) {
    routeShortName[r.route_id] = r.route_short_name || r.route_id;
    routes.push({
      routeId:   r.route_id,
      shortName: r.route_short_name || r.route_id,
      longName:  r.route_long_name  || '',
      color:     r.route_color      || '',
    });
  }

  // Parse trips.txt
  const tripRows = files['trips.txt'] ? parseCSV(files['trips.txt']) : [];
  const tripRouteMap  = {};
  const tripHeadsign  = {};
  const tripDirection = {};
  const tripShapeId   = {};
  for (const t of tripRows) {
    tripRouteMap[t.trip_id]  = t.route_id;
    tripHeadsign[t.trip_id]  = t.trip_headsign || '';
    tripDirection[t.trip_id] = t.direction_id  || '0';
    tripShapeId[t.trip_id]   = t.shape_id      || '';
  }

  // Parse stops.txt
  const stopRows = files['stops.txt'] ? parseCSV(files['stops.txt']) : [];
  const stops = stopRows
    .map(s => ({
      stopId: s.stop_id,
      name:   s.stop_name || '',
      lat:    parseFloat(s.stop_lat)  || 0,
      lng:    parseFloat(s.stop_lon)  || 0,
    }))
    .filter(s => s.lat && s.lng);

  cache = { tripRouteMap, tripHeadsign, tripDirection, tripShapeId, routeShortName, routes, stops, loadedAt: new Date() };
  console.log(`[GTFS] Loaded ${tripRows.length} trips, ${routeRows.length} routes, ${stops.length} stops`);
}

function getCache() { return cache; }

// Auto-refresh every 12 hours
setInterval(() => { loadGTFS().catch(e => console.error('[GTFS] Refresh error:', e.message)); }, 12 * 60 * 60 * 1000);

module.exports = { loadGTFS, getCache };