import * as z from "zod/mini";
import { isTimeZone } from "@/lib/date/zoned";

export const coordinateBounds = {
    latitude: { min: -90, max: 90 },
    longitude: { min: -180, max: 180 }
} as const;

const printableText = /^\P{Cc}*$/u;

export const placeTextSchema = z.string().check(
    z.trim(),
    z.minLength(1),
    z.maxLength(120),
    z.regex(printableText)
);

export const placeSearchSchema = z.string().check(
    z.trim(),
    z.minLength(2, { error: "Saisis au moins deux caractères." }),
    z.maxLength(100, { error: "La recherche ne doit pas dépasser 100 caractères." }),
    z.regex(printableText, { error: "La recherche contient des caractères non autorisés." })
);

const latitudeSchema = z.number().check(
    z.gte(coordinateBounds.latitude.min),
    z.lte(coordinateBounds.latitude.max)
);

const longitudeSchema = z.number().check(
    z.gte(coordinateBounds.longitude.min),
    z.lte(coordinateBounds.longitude.max)
);

export const timeZoneSchema = z.string().check(
    z.minLength(1),
    z.maxLength(64),
    z.refine(isTimeZone, { error: "Fuseau horaire inconnu." })
);

export const placeSchema = z.object({
    name: placeTextSchema,
    region: z.optional(placeTextSchema),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    timeZone: timeZoneSchema
});

export type Place = z.infer<typeof placeSchema>;

export const placesResponseSchema = z.object({
    places: z.array(placeSchema).check(z.maxLength(10))
});

export function getPlaceLabel({ name, region }: Place): string {
    return region ? `${name}, ${region}` : name;
}
