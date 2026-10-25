interface CacheEntry<Value> {
    value: Promise<Value>;
    expiresAt: number;
}

interface TtlCacheOptions<Value> {
    ttl: number;
    maxEntries: number;
    isCacheable?: (value: Value) => boolean;
    now?: () => number;
}

export interface TtlCache<Value> {
    get: (key: string, load: () => Promise<Value>) => Promise<Value>;
    size: () => number;
}

export function createTtlCache<Value>({
    ttl,
    maxEntries,
    isCacheable = () => true,
    now = Date.now
}: TtlCacheOptions<Value>): TtlCache<Value> {
    const entries = new Map<string, CacheEntry<Value>>();

    const evict = () => {
        const time = now();
        for (const [key, entry] of entries) {
            if (entry.expiresAt <= time) entries.delete(key);
        }
        while (entries.size >= maxEntries) {
            const oldestKey = entries.keys().next().value;
            if (oldestKey === undefined) break;
            entries.delete(oldestKey);
        }
    };

    const get = (key: string, load: () => Promise<Value>) => {
        const entry = entries.get(key);
        if (entry && entry.expiresAt > now()) return entry.value;
        evict();
        const value = load();
        entries.set(key, { value, expiresAt: now() + ttl });
        const forget = () => {
            if (entries.get(key)?.value === value) entries.delete(key);
        };
        value.then((result) => {
            if (!isCacheable(result)) forget();
        }, forget);
        return value;
    };

    return { get, size: () => entries.size };
}
