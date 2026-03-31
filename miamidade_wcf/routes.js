const express = require("express");
const router = express.Router();

// Helpers
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

// Headers para Miami‑Dade
const MD_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json, text/plain, */*"
};

/* ============================
   GET /routes  (DEBUG MODE)
   ============================ */
router.get("/routes", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetRoutes";
    const response = await fetch(url, { headers: MD_HEADERS });
    const raw = await response.text();

    return res.json({
      success: true,
      rawResponse: raw
    });

  } catch (err) {
    res.json(failure(err));
  }
});

/* ============================
   GET /vehicles  (DEBUG MODE)
   ============================ */
router.get("/vehicles", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetBusPositions";
    const response = await fetch(url, { headers: MD_HEADERS });
    const raw = await response.text();

    return res.json({
      success: true,
      rawResponse: raw
    });

  } catch (err) {
    res.json(failure(err));
  }
});

/* ============================
   GET /eta?stop=1234  (DEBUG MODE)
   ============================ */
router.get("/eta", async (req, res) => {
  try {
    const stop = req.query.stop;
    if (!stop) return res.json(failure("Missing stop parameter"));

    const url = `https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetPredictions?BusStopID=${stop}`;
    const response = await fetch(url, { headers: MD_HEADERS });
    const raw = await response.text();

    return res.json({
      success: true,
      rawResponse: raw
    });

  } catch (err) {
    res.json(failure(err));
  }
});

module.exports = router;
