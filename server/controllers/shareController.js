import crypto from 'node:crypto';
import {
  fetchFlightFromProvider,
  fetchFlightDetailsFromProvider,
} from '../services/flightService.js';
import { validateFlightNumber, validateUsername } from '../../src/validators.js';

const shares = new Map();
const SHARE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export async function createShare(req, res, next) {
  try {
    const result = validateFlightNumber(req.body?.flightNumber);
    if (!result.ok) return res.status(400).json({ error: result.error });

    let sharedBy = null;
    if (req.body?.sharedBy) {
      const u = validateUsername(req.body.sharedBy);
      if (u.ok) sharedBy = u.value;
    }

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

export async function getShare(req, res, next) {
  try {
    const entry = shares.get(req.params.shareId);
    if (!entry) return res.status(404).json({ error: 'Share link not found or expired.' });

    if (Date.now() - entry.createdAt > SHARE_TTL_MS) {
      shares.delete(req.params.shareId);
      return res.status(410).json({ error: 'Share link expired.' });
    }

    const flight = await fetchFlightDetailsFromProvider(entry.flightNumber);
    if (!flight) return res.status(404).json({ error: 'Flight no longer available.' });

    res.json({
      flight,
      sharedBy: entry.sharedBy,
    });
  } catch (err) { next(err); }
}
