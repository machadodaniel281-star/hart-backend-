
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/bus-locations", async (req, res) => {
  try {
    const url = "https://www.miamidade.gov/transit/WebServices/BusTracker.svc/GetBusLocations";
    const response = await fetch(url);
    const data = await response.json();

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      buses: data?.BusLocationResult || []
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
