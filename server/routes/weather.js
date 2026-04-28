import { Router } from 'express';
import { getWeather } from '../controllers/weatherController.js';

const router = Router();

// GET /api/weather?lat=..&lon=..
router.get('/', getWeather);

export default router;
