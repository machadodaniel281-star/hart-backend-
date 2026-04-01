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

// ============================
// RUTA DE PRUEBA
// ============================
router.get("/test", (req, res) => {
  res.json({ ok: true });
});

// ============================
// GET /miamidade-gtfs/vehicles
// ============================
router.get("/vehicles", async (req, res) => {
  ...
});
