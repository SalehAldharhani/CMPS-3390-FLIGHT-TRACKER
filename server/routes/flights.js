import { Router } from 'express';
import { getFlight, searchFlights } from '../controllers/flightController.js';

const router = Router();

// GET /api/flights/search?q=...
router.get('/search', searchFlights);

// GET /api/flights/:flightNumber
router.get('/:flightNumber', getFlight);

export default router;
