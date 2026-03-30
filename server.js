const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Miami-Dade Routes
const miamiRoutes = require("./miamidade/routes");
app.use("/miamidade", miamiRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando correctamente" });
});

// Healthcheck for Railway
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Puerto obligatorio de Railway
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
