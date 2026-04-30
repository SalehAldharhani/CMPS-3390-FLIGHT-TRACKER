/**
 * server/services/cache.js
 * --------------------------------------------------------------------------
 * Tiny TTL-based in-memory cache. Keeps FR24 credit usage in check by
 * reusing recent responses for repeated requests.
 *
 * WHY THIS EXISTS:
 *   Without caching, every page view / refresh / navigation hits FR24,
 *   burning credits. With this cache, multiple requests for the same
 *   flight within the TTL window share a single upstream response.
 *
 * USAGE:
 *   const cached = cacheGet('live:AA100');
 *   if (cached) return cached;
 *   const fresh = await fr24.get(...);
 *   cacheSet('live:AA100', fresh, 60_000);
 *
 * This is intentionally simple (Map + timestamp). For production you'd use
 * Redis or similar; for a class demo this is enough.
 */

// Map<key, { value, expiresAt }>
const store = new Map();

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;

  // Expired? Remove and report miss.
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function cacheDelete(key) {
  store.delete(key);
}

export function cacheClear() {
  store.clear();
}

/** Periodically purge expired entries so the Map doesn't grow forever. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.expiresAt) store.delete(key);
  }
}, 5 * 60 * 1000); // every 5 minutes
