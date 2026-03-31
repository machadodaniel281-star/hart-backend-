const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Helper to format responses
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

// GET /routes
router.get("/routes", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetRoutes";
    const response = await fetch(url);
    const text = await response.text();

    const json = JSON.parse(text);
    res.json(success(json));
  } catch (err) {
    res.json(failure(err));
  }
});

// GET /vehicles
router.get("/vehicles", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetBusPositions";
    const response = await fetch(url);
    const text = await response.text();

    const json = JSON.parse(text);
    res.json(success(json));
  } catch (err) {
    res.json(failure(err));
  }
});

// GET /eta?stop=1234
router.get("/eta", async (req, res) => {
  try {
    const stop = req.query.stop;
    if (!stop) return res.json({ success: false, error: "Missing stop parameter" });

    const url = `https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetPredictions?BusStopID=${stop}`;
    const response = await fetch(url);
    const text = await response.text();

    const json = JSON.parse(text);
    res.json(success(json));
  } catch (err) {
    res.json(failure(err));
  }
});

module.exports = router;
