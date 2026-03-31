const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// =========================
//  IMPORTAR MÓDULOS EXISTENTES
// =========================
const broward = require("./broward/routes");
const palmbeach = require("./palmbeach/routes");
const tampa = require("./tampa/routes");
const vehicles = require("./vehicles/routes");
const miamidadeRealtime = require("./miamidade/realtime/routes");

// =========================
//  ⭐ IMPORTAR MIAMI‑DADE GTFS (NUEVO)
// =========================
const miamidadeGtfs = require("./miamidade_gtfs/routes");

// =========================
//  MONTAR RUTAS
// =========================
app.use("/broward", broward);
app.use("/palmbeach", palmbeach);
app.use("/tampa", tampa);
app.use("/vehicles", vehicles);
app.use("/miamidade", miamidadeRealtime);

// ⭐ RUTA NUEVA — MIAMI‑DADE GTFS
app.use("/miamidade-gtfs", miamidadeGtfs);

// =========================
//  ROOT
// =========================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HART Backend Running",
    updatedAt: new Date().toISOString()
  });
});

// =========================
//  SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
