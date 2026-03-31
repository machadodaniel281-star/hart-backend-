const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");

// Helpers
function success(data) {
  return {
    success: true,
    updatedAt: new Date().toISOString(),
    data
  };
}
// updated 2


function failure(error) {
  return {
    success: false,
    error: error.toString()
  };
}

const FEED_URL = process.env.MIAMIDADE_GTFS_RT_VEHICLES_URL;

/* ============================
   GET /miamidade-gtfs/vehicles
   ============================ */

router.get("/vehicles", async (req, res) => {
  try {
    if (!FEED_URL) {
      return res.json(failure("Missing MIAMIDADE_GTFS_RT_VEHICLES_URL env var"));
    }

    const response = await fetch(FEED_URL);
    if (!response.ok) {
      return res.json(
        failure(`GTFS feed error: ${response.status} ${response.statusText}`)
      );
    }

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const vehicles = feed.entity
      .filter((e) => e.vehicle && e.vehicle.position)
      .map((e) => {
        const v = e.vehicle;
        return {
          id: v.vehicle?.id || e.id,
          routeId: v.trip?.routeId || null,
          tripId: v.trip?.tripId || null,
          latitude: v.position.latitude,
          longitude: v.position.longitude,
          bearing: v.position.bearing || null,
          speed: v.position.speed || null,
          timestamp: v.timestamp
            ? new Date(v.timestamp * 1000).toISOString()
            : null
        };
      });

    return res.json(success(vehicles));
  } catch (err) {
    return res.json(failure(err));
  }
});

module.exports = router;
