const express = require("express");
const router = express.Router();
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

router.get("/bus-locations", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/gtfs-realtime/VehiclePositions.pb";

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const buses = feed.entity.map((entity) => {
      const v = entity.vehicle;
      return {
        id: v.vehicle?.id || null,
        label: v.vehicle?.label || null,
        route: v.trip?.routeId || null,
        latitude: v.position?.latitude || null,
        longitude: v.position?.longitude || null,
        bearing: v.position?.bearing || null,
        speed: v.position?.speed || null,
        updated: v.timestamp ? new Date(v.timestamp * 1000).toISOString() : null
      };
    });

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      buses
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
