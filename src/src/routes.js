/**
 * /hart/routes — returns all HART routes from GTFS static cache.
 */

const { getCache } = require('./gtfs');

function getRoutes() {
  const cache = getCache();
  return {
    routes: cache.routes,
    count:  cache.routes.length,
    source: cache.loadedAt ? 'gtfs_static' : 'empty',
    loadedAt: cache.loadedAt,
    timestamp: Date.now(),
  };
}

module.exports = { getRoutes };