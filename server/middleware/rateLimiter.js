/**
 * Tiny per-IP rate limiter so we don't burn through 3rd-party API quotas
 * if someone hammers the endpoints. In production prefer `express-rate-limit`
 * with a Redis store. TODO: BACKEND.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const buckets = new Map(); // ip -> { count, windowStart }

export function rateLimiter(req, res, next) {
  const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = buckets.get(ip) ?? { count: 0, windowStart: now };

  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  buckets.set(ip, entry);

  if (entry.count > MAX_PER_WINDOW) {
    return res.status(429).json({ error: 'Too many requests, slow down.' });
  }
  next();
}
