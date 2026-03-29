/**
 * /hart/stops — returns all HART stops from GTFS static cache.
 */

const { getCache } = require('./gtfs');

function getStops() {
  const cache = getCache();
  return {
    stops:   cache.stops,
    count:   cache.stops.length,
    source:  cache.loadedAt ? 'gtfs_static' : 'empty',
    loadedAt: cache.loadedAt,
    timestamp: Date.now(),
  };
}

module.exports = { getStops };