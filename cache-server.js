const express = require("express");
const axios = require("axios");

const app = express();
let lastGoodData = null;
let lastUpdate = null;

// URL del feed de Miami-Dade
const FEED_URL = "https://www.miamidade.gov/transit/gtfs-realtime/VehiclePositions.pb";

// Función que actualiza el cache cada 10 segundos
async function updateCache() {
  try {
    const response = await axios.get(FEED_URL, { responseType: "arraybuffer" });
    lastGoodData = response.data;
    lastUpdate = new Date();
    console.log("Cache actualizado:", lastUpdate.toISOString());
  } catch (err) {
    console.log("Error al actualizar feed, usando cache anterior");
  }
}

// Endpoint para obtener el cache
app.get("/cache", (req, res) => {
  if (!lastGoodData) {
    return res.status(503).json({ error: "Cache no disponible" });
  }
  res.set("Content-Type", "application/octet-stream");
  res.send(lastGoodData);
});

// Healthcheck interno (no público)
app.get("/health", (req, res) => {
  res.json({ status: "ok", lastUpdate });
});

// Iniciar el ciclo de actualización
setInterval(updateCache, 10000);
updateCache();

// IMPORTANTE: ESTE ARCHIVO NO DEBE ESCUCHAR PUERTOS EN RAILWAY
module.exports = app;
