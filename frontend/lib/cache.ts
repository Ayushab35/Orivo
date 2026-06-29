import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generic TTL cache wrapper used for expensive or remote payloads
 * (daily brief, choghadiya, astro charts, etc.). Falls back gracefully if
 * the underlying storage is unavailable.
 */
type Entry<T> = { v: T; e: number };

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`orivo.cache.${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (parsed.e && Date.now() > parsed.e) {
      await AsyncStorage.removeItem(`orivo.cache.${key}`);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlMs = 1000 * 60 * 60): Promise<void> {
  try {
    const entry: Entry<T> = { v: value, e: Date.now() + ttlMs };
    await AsyncStorage.setItem(`orivo.cache.${key}`, JSON.stringify(entry));
  } catch {
    // no-op
  }
}

export async function cacheBust(prefix: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((k) => k.startsWith(`orivo.cache.${prefix}`));
    if (targets.length) await AsyncStorage.multiRemove(targets);
  } catch {}
}

/** Convenience: fetch-from-network-or-cache helper. */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached) return cached;
  const fresh = await fetcher();
  await cacheSet<T>(key, fresh, ttlMs);
  return fresh;
}
