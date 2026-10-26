import * as z from "zod/mini";
import { parseJson } from "@/lib/validation/json";
import { placeSchema } from "@/lib/validation/place";

export const favoriteLimits = { places: 20, objects: 110, recentPlaces: 5 } as const;

export const favoriteStorageKeys = {
    places: "astrolabe:lieux-favoris",
    objects: "astrolabe:objets-favoris",
    recentPlaces: "astrolabe:lieux-recents"
} as const;

const objectIdSchema = z.string().check(z.regex(/^m(?:[1-9]\d?|10\d|110)$/));

const placeListSchema = (limit: number) => z.array(placeSchema).check(z.maxLength(limit));

export const favoritePlacesSchema = placeListSchema(favoriteLimits.places);

export const favoriteObjectsSchema = z.array(objectIdSchema).check(z.maxLength(favoriteLimits.objects));

export const recentPlacesSchema = placeListSchema(favoriteLimits.recentPlaces);

export function parseStoredList<Item>(raw: string | null, schema: z.ZodMiniType<Item[]>): Item[] {
    return parseJson(raw, schema) ?? [];
}
