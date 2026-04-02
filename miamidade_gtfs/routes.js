const express = require("express");
const router = express.Router();

router.get("/bus-locations", async (req, res) => {
  try {
    const url = "https://miami-json-proxy.vercel.app/buses";

    // fetch nativo usando globalThis
    const response = await globalThis.fetch(url);
    const data = await response.json();

    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      buses: data || []
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
