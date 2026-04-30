/**
 * flightController.js
 * --------------------------------------------------------------------------
 * Pure server-side controller. Handles HTTP concerns (params, status codes,
 * JSON shape) and delegates to /services/flightService.js for actual data
 * retrieval.
 *
 * Implements spec requirement: "At least one pure server-side controller"
 *
 * Two public flight endpoints:
 *   GET /api/flights/:flightNumber          -> live position only (1 credit)
 *   GET /api/flights/:flightNumber/details  -> live + summary    (2 credits)
 *
 * The detail page uses /details for departure time + runway info; the home
 * page card uses the basic endpoint to keep credit usage low.
 */

import { validateFlightNumber } from '../../src/validators.js';
import {
  fetchFlightFromProvider,
  fetchFlightDetailsFromProvider,
  fetchLastFlightFromProvider,
  searchFlightsFromProvider,
} from '../services/flightService.js';

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

/** GET /api/flights/:flightNumber/details */
export async function getFlightDetails(req, res, next) {
  try {
    const result = validateFlightNumber(req.params.flightNumber);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const flight = await fetchFlightDetailsFromProvider(result.value);
    if (!flight) {
      return res.status(404).json({ error: `Flight ${result.value} not found.` });
    }

    res.json(flight);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/flights/:flightNumber/last
 *
 * Fallback endpoint for when /flights/:flightNumber returns 404 (flight not
 * currently airborne). Looks up the most recent leg from /flight-summary/full
 * and returns a Flight-shaped object with status='LANDED'.
 *
 * Returns 404 if there's no recent leg either (genuinely unknown flight).
 */
export async function getLastFlight(req, res, next) {
  try {
    const result = validateFlightNumber(req.params.flightNumber);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const flight = await fetchLastFlightFromProvider(result.value);
    if (!flight) {
      return res.status(404).json({
        error: `No recent flight history for ${result.value}.`,
      });
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
