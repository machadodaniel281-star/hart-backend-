/**
 * HART Tampa Micro-Backend
 * Exposes: GET /hart/vehicles | /hart/eta | /hart/routes | /hart/stops
 * Deploy: Railway / Render (Node.js 18+)
 */

const express = require('express');
const cors    = require('cors');
const { loadGTFS }  = require('./src/gtfs');
const { getVehicles } = require('./src/vehicles');
const { getETA }    = require('./src/eta');
const { getRoutes } = require('./src/routes');
const { getStops }  = require('./src/stops');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hart-backend', timestamp: Date.now() });
});

// ── Vehicles ──────────────────────────────────────────────────────────────

app.get('/hart/vehicles', async (req, res) => {
  const vehicles = await getVehicles();
  res.json({ vehicles, count: vehicles.length, agency: 'HART', timestamp: Date.now() });
});

// ── ETA ───────────────────────────────────────────────────────────────────

app.get('/hart/eta', async (req, res) => {
  const stopId = req.query.stopId;
  if (!stopId) return res.status(400).json({ error: 'stopId query param required' });
  const data = await getETA(stopId);
  res.json(data);
});

// ── Routes ────────────────────────────────────────────────────────────────

app.get('/hart/routes', (req, res) => {
  res.json(getRoutes());
});

// ── Stops ─────────────────────────────────────────────────────────────────

app.get('/hart/stops', (req, res) => {
  res.json(getStops());
});

// ── Boot ──────────────────────────────────────────────────────────────────

async function boot() {
  try {
    console.log('[HART] Loading GTFS static data...');
    await loadGTFS();
  } catch (e) {
    console.error('[HART] GTFS load failed (will retry in 12h):', e.message);
  }

  app.listen(PORT, () => {
    console.log(`[HART] Server running on port ${PORT}`);
  });
}

boot();