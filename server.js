const express = require("express");
const app = express();

const miamiRoutes = require("./miamidade/routes");

app.use("/miamidade", miamiRoutes);

app.get("/health", (req, res) => res.send("OK"));

app.listen(process.env.PORT || 3000, () => {
  console.log("Backend running");
});
