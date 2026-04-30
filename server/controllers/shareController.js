/**
 * shareController.js
 * --------------------------------------------------------------------------
 * Implements the "Shared Live Link" feature from the brief.
 *
 * Storage: in-memory Map. Each share record contains the flight number,
 * the username of whoever created the share (so the public page can say
 * "Jon will arrive at 9:56 PM"), and the creation timestamp.
 *
 * The shared GET endpoint returns the FULL flight details (including
 * departure time + runway) so the recipient sees a complete picture.
 */

import crypto from 'node:crypto';
import {
  fetchFlightFromProvider,
  fetchFlightDetailsFromProvider,
} from '../services/flightService.js';
import { validateFlightNumber, validateUsername } from '../../src/validators.js';

const shares = new Map(); // shareId -> { flightNumber, sharedBy, createdAt }
const SHARE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** POST /api/share { flightNumber, sharedBy? } -> { shareId, url } */
export async function createShare(req, res, next) {
  try {
    const result = validateFlightNumber(req.body?.flightNumber);
    if (!result.ok) return res.status(400).json({ error: result.error });

    // sharedBy is optional. If provided, validate format (same rules as signup)
    // so we never store junk that could be used for injection on the public page.
    let sharedBy = null;
    if (req.body?.sharedBy) {
      const u = validateUsername(req.body.sharedBy);
      if (u.ok) sharedBy = u.value;
      // If username is malformed, silently drop it rather than failing the
      // whole share creation. The link still works; it just won't be attributed.
    }

    // Sanity-check that the flight exists before minting a link.
    // Use the cheap live endpoint here (1 credit).
    const flight = await fetchFlightFromProvider(result.value);
    if (!flight) return res.status(404).json({ error: 'Flight not found.' });

    const shareId = crypto.randomBytes(8).toString('hex');
    shares.set(shareId, {
      flightNumber: result.value,
      sharedBy,
      createdAt: Date.now(),
    });

    res.json({ shareId, url: `/share/${shareId}` });
  } catch (err) { next(err); }
}

/** GET /api/share/:shareId -> { flight, sharedBy } */
export async function getShare(req, res, next) {
  try {
    const entry = shares.get(req.params.shareId);
    if (!entry) return res.status(404).json({ error: 'Share link not found or expired.' });

    if (Date.now() - entry.createdAt > SHARE_TTL_MS) {
      shares.delete(req.params.shareId);
      return res.status(410).json({ error: 'Share link expired.' });
    }

    // Use DETAILED fetch so the recipient gets departure time + runway.
    // Costs 2 credits per cache miss but worth it for the share experience —
    // the whole point is "tell my family when I'm arriving".
    const flight = await fetchFlightDetailsFromProvider(entry.flightNumber);
    if (!flight) return res.status(404).json({ error: 'Flight no longer available.' });

    res.json({
      flight,
      sharedBy: entry.sharedBy,
    });
  } catch (err) { next(err); }
}
