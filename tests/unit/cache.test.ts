import { describe, expect, it, vi } from "vitest";
import { createTtlCache } from "@/lib/cache/ttl-cache";

describe("cache à durée de vie", () => {
    it("réutilise la valeur avant expiration et la recharge ensuite", async () => {
        let time = 0;
        const cache = createTtlCache<number>({ ttl: 1_000, maxEntries: 10, now: () => time });
        const load = vi.fn(async () => time);

        expect(await cache.get("clé", load)).toBe(0);
        time = 999;
        expect(await cache.get("clé", load)).toBe(0);
        time = 1_000;
        expect(await cache.get("clé", load)).toBe(1_000);
        expect(load).toHaveBeenCalledTimes(2);
    });

    it("partage une requête en cours entre plusieurs appels", async () => {
        const cache = createTtlCache<string>({ ttl: 1_000, maxEntries: 10 });
        const load = vi.fn(async () => "valeur");
        const results = await Promise.all([cache.get("clé", load), cache.get("clé", load)]);
        expect(results).toEqual(["valeur", "valeur"]);
        expect(load).toHaveBeenCalledTimes(1);
    });

    it("oublie les échecs et les valeurs non cachables", async () => {
        const cache = createTtlCache<string>({ ttl: 1_000, maxEntries: 10, isCacheable: (value) => value !== "erreur" });
        await expect(cache.get("a", () => Promise.reject(new Error("panne")))).rejects.toThrow("panne");
        await cache.get("b", async () => "erreur");
        await Promise.resolve();
        expect(cache.size()).toBe(0);
    });

    it("borne le nombre d'entrées en évinçant les plus anciennes", async () => {
        const cache = createTtlCache<number>({ ttl: 1_000, maxEntries: 2 });
        await cache.get("a", async () => 1);
        await cache.get("b", async () => 2);
        await cache.get("c", async () => 3);
        expect(cache.size()).toBe(2);
        const reload = vi.fn(async () => 10);
        expect(await cache.get("a", reload)).toBe(10);
    });
});
