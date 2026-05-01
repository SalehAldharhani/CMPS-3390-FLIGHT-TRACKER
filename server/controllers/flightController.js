import { validateFlightNumber } from '../../src/validators.js';
import {
  fetchFlightFromProvider,
  fetchFlightDetailsFromProvider,
  fetchLastFlightFromProvider,
  searchFlightsFromProvider,
} from '../services/flightService.js';

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
