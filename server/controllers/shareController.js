/**
 * shareController.js
 * --------------------------------------------------------------------------
 * Implements the "Shared Live Link" feature from the brief.
 *
 * Storage strategy: in-memory Map for now. This satisfies the persistent-
 * storage spec item only weakly. TODO: BACKEND - move this to:
 *   - SQLite (via better-sqlite3) for a tiny zero-config db, OR
 *   - Postgres if the DB schema item is implemented for real, OR
 *   - Redis if we end up running multiple server instances.
 */

import crypto from 'node:crypto';
import { fetchFlightFromProvider } from '../services/flightService.js';
import { validateFlightNumber } from '../../src/validators.js';

const shares = new Map(); // shareId -> { flightNumber, createdAt }
const SHARE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** POST /api/share { flightNumber } -> { shareId, url } */
export async function createShare(req, res, next) {
  try {
    const result = validateFlightNumber(req.body?.flightNumber);
    if (!result.ok) return res.status(400).json({ error: result.error });

    // Sanity-check that the flight actually exists before minting a link.
    const flight = await fetchFlightFromProvider(result.value);
    if (!flight) return res.status(404).json({ error: 'Flight not found.' });

    const shareId = crypto.randomBytes(8).toString('hex');
    shares.set(shareId, { flightNumber: result.value, createdAt: Date.now() });

    res.json({ shareId, url: `/share/${shareId}` });
  } catch (err) { next(err); }
}

/** GET /api/share/:shareId -> Flight */
export async function getShare(req, res, next) {
  try {
    const entry = shares.get(req.params.shareId);
    if (!entry) return res.status(404).json({ error: 'Share link not found or expired.' });

    if (Date.now() - entry.createdAt > SHARE_TTL_MS) {
      shares.delete(req.params.shareId);
      return res.status(410).json({ error: 'Share link expired.' });
    }

    const flight = await fetchFlightFromProvider(entry.flightNumber);
    if (!flight) return res.status(404).json({ error: 'Flight no longer available.' });

    res.json(flight);
  } catch (err) { next(err); }
}
