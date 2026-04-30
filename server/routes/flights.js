import { Router } from 'express';
import {
  getFlight,
  getFlightDetails,
  getLastFlight,
  searchFlights,
} from '../controllers/flightController.js';

const router = Router();

// GET /api/flights/search?q=...
router.get('/search', searchFlights);

// GET /api/flights/:flightNumber/details   (live + summary, 2 credits)
router.get('/:flightNumber/details', getFlightDetails);

// GET /api/flights/:flightNumber/last      (most recent historical leg, 1 credit, 24h cache)
router.get('/:flightNumber/last', getLastFlight);

// GET /api/flights/:flightNumber           (live only, 1 credit)
router.get('/:flightNumber', getFlight);

export default router;
