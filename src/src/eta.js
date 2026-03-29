/**
 * /hart/eta?stopId=XXXX — real-time arrival predictions for a HART stop.
 * Source: GTFS-RT trip-updates protobuf.
 * Enriched with routeShortName and headsign from GTFS static.
 */

const http = require('http');
const { readMessage, dec } = require('./utils');
const { getCache }         = require('./gtfs');

const TRIPS_URL = 'http://realtime.prod.obahart.org:8088/trip-updates';

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

function parseTripUpdates(buf) {
  const data = new Uint8Array(buf);
  const msg  = readMessage(data, 0, data.length);
  const updates = [];

  for (const entityBuf of (msg[2] || [])) {
    const entity = readMessage(entityBuf, 0, entityBuf.length);
    const tuArr  = entity[3];
    if (!tuArr?.length) continue;
    const tu = readMessage(tuArr[0], 0, tuArr[0].length);

    const tripArr = tu[1];
    let tripId = '', routeId = '';
    if (tripArr?.length) {
      const trip = readMessage(tripArr[0], 0, tripArr[0].length);
      tripId  = trip[1]?.[0] ? dec(trip[1][0]) : '';
      routeId = trip[5]?.[0] ? dec(trip[5][0]) : '';
    }

    const stopUpdates = (tu[2] || []).map(suBuf => {
      const su = readMessage(suBuf, 0, suBuf.length);
      let arrivalTime = null, departureTime = null, isRealtime = false;
      if (su[2]?.[0]) {
        const a = readMessage(su[2][0], 0, su[2][0].length);
        if (a[2]?.[0] != null) { arrivalTime = Number(a[2][0]); isRealtime = true; }
      }
      if (su[3]?.[0]) {
        const d = readMessage(su[3][0], 0, su[3][0].length);
        if (d[2]?.[0] != null) departureTime = Number(d[2][0]);
      }
      const stopId = su[4]?.[0] ? dec(su[4][0]) : '';
      return { stopId, arrivalTime, departureTime, isRealtime };
    });

    updates.push({ tripId, routeId, stopUpdates });
  }
  return updates;
}

async function getETA(stopId) {
  const cache = getCache();
  const buf   = await fetchBuffer(TRIPS_URL);
  const updates = parseTripUpdates(buf);
  const now   = Math.floor(Date.now() / 1000);
  const arrivals = [];

  for (const tu of updates) {
    const su = tu.stopUpdates.find(s => String(s.stopId) === String(stopId));
    if (!su) continue;

    const time = su.arrivalTime || su.departureTime;
    if (!time || time < now - 60) continue;

    const minutesAway = Math.round((time - now) / 60);
    if (minutesAway < 0 || minutesAway > 90) continue;

    const routeId   = cache.tripRouteMap[tu.tripId] || tu.routeId || '';
    const shortName = routeId ? (cache.routeShortName[routeId] || routeId.replace(/^HART[_:]?/i,'').replace(/^0+/,'') || routeId) : '';
    const headsign  = cache.tripHeadsign[tu.tripId]  || '';
    const dirId     = cache.tripDirection[tu.tripId] || '0';

    arrivals.push({
      routeId,
      routeShortName:   shortName,
      headsign,
      directionId:      parseInt(dirId),
      direction:        dirId === '0' ? 'Outbound' : 'Inbound',
      tripId:           tu.tripId,
      scheduledArrival: time,
      predictedArrival: su.isRealtime ? time : null,
      minutesAway,
      isRealtime:       su.isRealtime,
      arrivalTime:      new Date(time * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  // Sort by arrival time
  arrivals.sort((a, b) => a.minutesAway - b.minutesAway);

  // Stop name from GTFS static
  const stopInfo = cache.stops.find(s => String(s.stopId) === String(stopId));
  const stopName = stopInfo?.name || `Stop #${stopId}`;

  return { stopId, stopName, arrivals, count: arrivals.length, timestamp: Date.now() };
}

module.exports = { getETA };