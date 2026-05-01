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

app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(rateLimiter);

app.use('/api/flights', flightRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/share',   shareRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[flight-tracker] API listening on http://localhost:${PORT}`);
});
