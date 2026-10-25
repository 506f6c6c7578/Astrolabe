import * as z from "zod/mini";
import { createTtlCache } from "@/lib/cache/ttl-cache";
import { fetchJson } from "@/lib/http";
import { type Place, placeSchema } from "@/lib/validation/place";

const endpoint = "https://geocoding-api.open-meteo.com/v1/search";
const timeout = 5_000;
const resultLimit = 8;

const responseSchema = z.object({
    results: z.optional(z.array(z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.optional(z.string()),
        admin1: z.optional(z.string()),
        country: z.optional(z.string())
    })))
});

type GeocodingResult = NonNullable<z.infer<typeof responseSchema>["results"]>[number];

export const placesCacheTtl = 24 * 60 * 60_000;

const cache = createTtlCache<readonly Place[]>({ ttl: placesCacheTtl, maxEntries: 1_000 });

function toPlace({ name, latitude, longitude, timezone, admin1, country }: GeocodingResult): Place[] {
    const region = [admin1, country].filter(Boolean).join(", ");
    const result = placeSchema.safeParse({
        name,
        region: region || undefined,
        latitude,
        longitude,
        timeZone: timezone
    });
    return result.success ? [result.data] : [];
}

export function searchPlaces(query: string): Promise<readonly Place[]> {
    const url = new URL(endpoint);
    url.search = new URLSearchParams({
        name: query,
        count: String(resultLimit),
        language: "fr",
        format: "json"
    }).toString();
    return cache.get(query.toLocaleLowerCase("fr"), async () => {
        const { results = [] } = await fetchJson(url, responseSchema, timeout);
        return results.flatMap(toPlace);
    });
}
