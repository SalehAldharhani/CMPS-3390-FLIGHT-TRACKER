/**
 * server/index.js
 * --------------------------------------------------------------------------
 * OWNER: Clonexstax (Back End)
 *
 * Express app that:
 *   - Serves the React build in production (static + SSR-ready)
 *   - Proxies / normalises 3rd-party APIs (FlightRadar24, Weather)
 *   - Hosts share-link endpoints
 *
 * Routes are split into /server/routes/* so each concern is its own file.
 * Controllers (the request -> response logic) live in /server/controllers/*.
 * Service modules in /server/services/* talk to external APIs.
 *
 * This MVC-ish layout satisfies the "Architecture patterns" spec item.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import flightRoutes from './routes/flights.js';
import weatherRoutes from './routes/weather.js';
import shareRoutes from './routes/share.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3001;

// ---- middleware -----------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(rateLimiter);

// ---- API routes -----------------------------------------------------------
app.use('/api/flights', flightRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/share',   shareRoutes);

// ---- health probe ---------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ---- static assets in production -----------------------------------------
// In dev, Vite serves the client; in prod, we serve `dist/` from here.
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// ---- errors --------------------------------------------------------------
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[flight-tracker] API listening on http://localhost:${PORT}`);
});
