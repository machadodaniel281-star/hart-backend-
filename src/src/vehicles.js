/**
 * /hart/vehicles — real-time HART bus positions.
 * Primary: GTFS-RT vehicle-positions protobuf.
 * Enriched with: routeId, headsign, direction, shapeId from GTFS static.
 */

const http  = require('http');
const { readMessage, dec } = require('./utils');
const { getCache }         = require('./gtfs');

const VEHICLES_URL = 'http://realtime.prod.obahart.org:8088/vehicle-positions';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: { 'Accept': 'application/octet-stream', 'User-Agent': 'SunListFL-HART/1.0' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

function parseVehiclePositions(buf) {
  const data = new Uint8Array(buf);
  const msg  = readMessage(data, 0, data.length);
  const vehicles = [];

  for (const entityBuf of (msg[2] || [])) {
    const entity = readMessage(entityBuf, 0, entityBuf.length);
    const vArr = entity[4];
    if (!vArr?.length) continue;
    const vehicle = readMessage(vArr[0], 0, vArr[0].length);

    const posArr = vehicle[2];
    if (!posArr?.length) continue;
    const pos = readMessage(posArr[0], 0, posArr[0].length);
    const lat = pos[1]?.[0];
    const lng = pos[2]?.[0];
    if (!lat || !lng) continue;

    const tripArr = vehicle[1];
    let tripId = '', rawRouteId = '';
    if (tripArr?.length) {
      const trip = readMessage(tripArr[0], 0, tripArr[0].length);
      tripId      = trip[1]?.[0] ? dec(trip[1][0]) : '';
      rawRouteId  = trip[5]?.[0] ? dec(trip[5][0]) : '';
    }

    const vdArr = vehicle[4];
    let vehicleId = '', vehicleLabel = '';
    if (vdArr?.length) {
      const vd = readMessage(vdArr[0], 0, vdArr[0].length);
      vehicleId    = vd[1]?.[0] ? dec(vd[1][0]) : '';
      vehicleLabel = vd[2]?.[0] ? dec(vd[2][0]) : vehicleId;
    }

    vehicles.push({
      vehicleId,
      vehicleLabel,
      tripId,
      rawRouteId,
      lat:  Number(lat),
      lng:  Number(lng),
      bearing: pos[3]?.[0] != null ? Number(pos[3][0]) : null,
      speed:   pos[4]?.[0] != null ? Number(pos[4][0]) : null,
      timestamp: vehicle[3]?.[0] != null ? Number(vehicle[3][0]) : null,
    });
  }
  return vehicles;
}

async function getVehicles() {
  const cache = getCache();
  const buf   = await fetchBuffer(VEHICLES_URL);
  const raw   = parseVehiclePositions(buf);

  return raw.map(v => {
    const routeId   = cache.tripRouteMap[v.tripId]  || v.rawRouteId || null;
    const shortName = routeId ? (cache.routeShortName[routeId] || routeId.replace(/^HART[_:]?/i,'').replace(/^0+/,'') || routeId) : null;
    const headsign  = cache.tripHeadsign[v.tripId]  || '';
    const dirId     = cache.tripDirection[v.tripId] || '0';
    const shapeId   = cache.tripShapeId[v.tripId]   || '';

    return {
      vehicleId:    v.vehicleId,
      vehicleLabel: v.vehicleLabel,
      tripId:       v.tripId,
      routeId:      routeId || '',
      routeShortName: shortName || '',
      headsign,
      directionId:  parseInt(dirId),
      direction:    dirId === '0' ? 'Outbound' : 'Inbound',
      shapeId,
      lat:       v.lat,
      lng:       v.lng,
      bearing:   v.bearing,
      speed:     v.speed,
      timestamp: v.timestamp,
      agency:    'HART',
    };
  }).filter(v => v.lat && v.lng);
}

module.exports = { getVehicles };