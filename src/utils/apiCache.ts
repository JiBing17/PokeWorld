interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export interface CacheOptions {
  ttlMs?: number;
  persist?: 'session';
}

function readSession<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(`apiCache:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeSession<T>(key: string, entry: CacheEntry<T>): void {
  try {
    sessionStorage.setItem(`apiCache:${key}`, JSON.stringify(entry));
  } catch {
    // Ignore quota errors — in-memory cache still works.
  }
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? 60 * 60 * 1000;
  const now = Date.now();

  const memoryHit = memoryCache.get(key);
  if (memoryHit && memoryHit.expiresAt > now) {
    return memoryHit.value as T;
  }

  if (options.persist === 'session') {
    const sessionHit = readSession<T>(key);
    if (sessionHit && sessionHit.expiresAt > now) {
      memoryCache.set(key, sessionHit);
      return sessionHit.value;
    }
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = fetcher()
    .then((value) => {
      const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
      memoryCache.set(key, entry);
      if (options.persist === 'session') {
        writeSession(key, entry);
      }
      inFlight.delete(key);
      return value;
    })
    .catch((error) => {
      inFlight.delete(key);
      throw error;
    });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
    inFlight.delete(key);
    try {
      sessionStorage.removeItem(`apiCache:${key}`);
    } catch {
      // no-op
    }
    return;
  }

  memoryCache.clear();
  inFlight.clear();
}

export const CACHE_TTL = {
  SHORT: 15 * 60 * 1000,
  MEDIUM: 60 * 60 * 1000,
  LONG: 24 * 60 * 60 * 1000,
} as const;
