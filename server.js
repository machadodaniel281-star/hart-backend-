import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Ruta principal para que Railway pase el healthcheck
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente ✔");
});

// Ruta de healthcheck explícita (Railway la ama)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Ejemplo de ruta (puedes borrar o modificar)
app.get("/api/test", (req, res) => {
  res.json({ message: "API funcionando" });
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
