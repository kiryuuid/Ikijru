/**
 * Simple in-memory TTL cache.
 * Works in Next.js because warm serverless instances retain global state.
 * For high-traffic production use, replace with Redis (ioredis).
 */

const store = new Map(); // key -> { value, expiresAt }

/**
 * Get cached value. Returns undefined if missing or expired.
 * @param {string} key
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set a value in cache with TTL.
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function cacheSet(key, value, ttlMs = 5 * 60 * 1000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Delete a key from cache (use after write operations to invalidate).
 * @param {string} key
 */
export function cacheDel(key) {
  store.delete(key);
}

/**
 * Delete all keys matching a prefix.
 * @param {string} prefix
 */
export function cacheDelPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Cache-aside helper: get from cache, or fetch from DB and store.
 * @param {string} key
 * @param {Function} fetchFn - Async function that fetches fresh data
 * @param {number} ttlMs
 */
export async function cacheOrFetch(key, fetchFn, ttlMs = 5 * 60 * 1000) {
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const fresh = await fetchFn();
  cacheSet(key, fresh, ttlMs);
  return fresh;
}
