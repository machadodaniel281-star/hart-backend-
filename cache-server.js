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

// Actualizar cada 10 segundos
setInterval(updateCache, 10000);
updateCache();

// Endpoint para tu app
app.get("/miami/cache", (req, res) => {
  if (!lastGoodData) {
    return res.status(503).json({ error: "No hay datos todavía" });
  }
  res.set("Content-Type", "application/octet-stream");
  res.send(lastGoodData);
});

// Healthcheck perfecto
app.get("/health", (req, res) => {
  res.json({ status: "ok", lastUpdate });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Cache server escuchando en", PORT));
