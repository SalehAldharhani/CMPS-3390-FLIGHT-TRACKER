import { Router } from 'express';
import {
  getFlight,
  getFlightDetails,
  getLastFlight,
  searchFlights,
} from '../controllers/flightController.js';

const router = Router();

router.get('/search', searchFlights);
router.get('/:flightNumber/details', getFlightDetails);
router.get('/:flightNumber/last', getLastFlight);
router.get('/:flightNumber', getFlight);

export default router;
