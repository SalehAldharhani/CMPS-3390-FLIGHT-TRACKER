/**
 * flightController.js
 * --------------------------------------------------------------------------
 * Pure server-side controller. Handles HTTP concerns (params, status codes,
 * JSON shape) and delegates to /services/flightService.js for actual data
 * retrieval.
 *
 * Implements spec requirement: "At least one pure server-side controller"
 *
 * VALIDATION:
 *   We re-run the same flight-number validator as the client. The client's
 *   copy gives quick UX feedback; the server's copy is the real defence.
 */

import { validateFlightNumber } from '../../src/validators.js';
import { fetchFlightFromProvider, searchFlightsFromProvider } from '../services/flightService.js';

/** GET /api/flights/:flightNumber */
export async function getFlight(req, res, next) {
  try {
    const result = validateFlightNumber(req.params.flightNumber);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const flight = await fetchFlightFromProvider(result.value);
    if (!flight) {
      return res.status(404).json({ error: `Flight ${result.value} not found.` });
    }

    res.json(flight);
  } catch (err) {
    next(err);
  }
}

/** GET /api/flights/search?q=... */
export async function searchFlights(req, res, next) {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) return res.json([]);
    if (q.length > 32) return res.status(400).json({ error: 'Query too long.' });

    const results = await searchFlightsFromProvider(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
