type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/** Browser-session cache for read-only server functions. Financial updates must force-refresh. */
export async function cachedRequest<T>(
  key: string,
  request: () => Promise<T>,
  ttlMs = 30_000,
  force = false,
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (!force && existing && existing.expiresAt > now) return existing.value;

  if (!force) {
    const pending = inFlight.get(key) as Promise<T> | undefined;
    if (pending) return pending;
  }

  const pending = request().then((value) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

export function invalidateCachedRequest(prefix: string) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
