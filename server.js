const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Miami-Dade Routes
const miamiRoutes = require("./miamidade/routes");
app.use("/miamidade", miamiRoutes);

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log("Backend running");
});
