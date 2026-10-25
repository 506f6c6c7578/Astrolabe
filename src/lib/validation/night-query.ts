import * as z from "zod/mini";
import { type IsoDate, isIsoDate } from "@/lib/date/zoned";
import { pages } from "@/data/site";
import {
    coordinateBounds,
    type Place,
    placeSearchSchema,
    placeTextSchema,
    timeZoneSchema
} from "@/lib/validation/place";

const decimalPattern = /^-?\d{1,3}(?:\.\d{1,8})?$/;
const supportedYears = { min: 1900, max: 2100 } as const;
const coordinatePrecision = 4;

function decimalParameter({ min, max }: { min: number; max: number }) {
    return z.pipe(
        z.pipe(z.string().check(z.trim(), z.regex(decimalPattern)), z.transform(Number)),
        z.number().check(z.gte(min), z.lte(max))
    );
}

const isoDateSchema = z.custom<IsoDate>((value) => {
    if (typeof value !== "string" || !isIsoDate(value)) return false;
    const year = Number(value.slice(0, 4));
    return year >= supportedYears.min && year <= supportedYears.max;
}, { error: "Date invalide." });

const coordinatesQuerySchema = z.object({
    lat: decimalParameter(coordinateBounds.latitude),
    lon: decimalParameter(coordinateBounds.longitude),
    tz: timeZoneSchema,
    nom: z.optional(placeTextSchema),
    region: z.optional(placeTextSchema),
    date: z.optional(isoDateSchema)
});

const searchQuerySchema = z.object({
    lieu: placeSearchSchema,
    date: z.optional(isoDateSchema)
});

export type NightQuery =
    | { kind: "empty" }
    | { kind: "invalid" }
    | { kind: "place"; place: Place; date?: IsoDate }
    | { kind: "search"; search: string; date?: IsoDate };

const defaultPlaceName = "Position personnalisée";

export function parseNightQuery(parameters: URLSearchParams): NightQuery {
    const values = Object.fromEntries(
        [...parameters].filter(([, value]) => value.trim() !== "")
    );
    if (Object.keys(values).length === 0) return { kind: "empty" };

    if ("lat" in values || "lon" in values) {
        const result = coordinatesQuerySchema.safeParse(values);
        if (!result.success) return { kind: "invalid" };
        const { lat, lon, tz, nom, region, date } = result.data;
        return {
            kind: "place",
            place: { name: nom ?? defaultPlaceName, region, latitude: lat, longitude: lon, timeZone: tz },
            date
        };
    }

    const result = searchQuerySchema.safeParse(values);
    return result.success
        ? { kind: "search", search: result.data.lieu, date: result.data.date }
        : { kind: "invalid" };
}

export function createNightPath(place: Place, date?: IsoDate): string {
    const parameters = new URLSearchParams({
        lat: place.latitude.toFixed(coordinatePrecision),
        lon: place.longitude.toFixed(coordinatePrecision),
        tz: place.timeZone,
        nom: place.name
    });
    if (place.region) parameters.set("region", place.region);
    if (date) parameters.set("date", date);
    return `${pages.night}?${parameters}`;
}
