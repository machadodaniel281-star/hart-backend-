const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Miami-Dade Routes
const miamiRoutes = require("./miamidade/routes");
app.use("/miamidade", miamiRoutes);

// HART (Hillsborough County - Tampa)
app.use("/hart", require("./hart/routes"));

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log("Backend running");
});

// Monitor Miami-Dade
setInterval(async () => {
  try {
    const url = "https://www.miamidade.gov/transit/gtfs-realtime/VehiclePositions.pb";
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const text = new TextDecoder().decode(buffer);
    if (text.startsWith("<") || text.includes("html") || text.includes("404")) {
      console.log("Miami-Dade sigue caído:", new Date().toISOString());
      return;
    }

    console.log("🔥🔥🔥 MIAMI-DADE VOLVIÓ 🔥🔥🔥", new Date().toISOString());
  } catch (err) {
    console.log("Error verificando Miami-Dade:", err.message);
  }
}, 60000);
