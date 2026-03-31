const express = require("express");
const router = express.Router();

// Helper para respuestas limpias
function success(data) {
  return {
    success: true,
    updatedAt: new Date().toISOString(),
    data
  };
}

function failure(error) {
  return {
    success: false,
    error: error.toString()
  };
}

// Función para convertir XML → JSON
function extractJsonFromXml(xml) {
  const jsonString = xml.replace(/<[^>]+>/g, "").trim();
  return JSON.parse(jsonString);
}

// Headers necesarios para que Miami‑Dade NO devuelva “Web Error”
const MD_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json, text/plain, */*"
};

/* ============================
   GET /routes
   ============================ */
router.get("/routes", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetRoutes";
    const response = await fetch(url, { headers: MD_HEADERS });
    const xml = await response.text();

    const data = extractJsonFromXml(xml);
    res.json(success(data));
  } catch (err) {
    res.json(failure(err));
  }
});

/* ============================
   GET /vehicles
   ============================ */
router.get("/vehicles", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetBusPositions";
    const response = await fetch(url, { headers: MD_HEADERS });
    const xml = await response.text();

    const data = extractJsonFromXml(xml);
    res.json(success(data));
  } catch (err) {
    res.json(failure(err));
  }
});

/* ============================
   GET /eta?stop=1234
   ============================ */
router.get("/eta", async (req, res) => {
  try {
    const stop = req.query.stop;
    if (!stop) return res.json(failure("Missing stop parameter"));

    const url = `https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetPredictions?BusStopID=${stop}`;
    const response = await fetch(url, { headers: MD_HEADERS });
    const xml = await response.text();

    const data = extractJsonFromXml(xml);
    res.json(success(data));
  } catch (err) {
    res.json(failure(err));
  }
});

module.exports = router;
