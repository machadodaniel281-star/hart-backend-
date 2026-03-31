const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const broward = require("./broward/routes");
const palmbeach = require("./palmbeach/routes");
const tampa = require("./tampa/routes");
const vehicles = require("./vehicles/routes");
const miamidadeRealtime = require("./miamidade/realtime/routes");
const miamidadeGtfs = require("./miamidade_gtfs/routes");

app.use("/broward", broward);
app.use("/palmbeach", palmbeach);
app.use("/tampa", tampa);
app.use("/vehicles", vehicles);
app.use("/miamidade", miamidadeRealtime);
app.use("/miamidade-gtfs", miamidadeGtfs);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HART Backend Running",
    updatedAt: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
// updated
