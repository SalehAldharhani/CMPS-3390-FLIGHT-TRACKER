const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const buckets = new Map();

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
