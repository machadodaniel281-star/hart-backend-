const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Cargar tu módulo GTFS
const miamiRoutes = require("./miamidade_gtfs/routes");
app.use("/miami", miamiRoutes);

// Healthcheck obligatorio para Railway
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Iniciar servidor en 0.0.0.0 (OBLIGATORIO PARA RAILWAY)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

