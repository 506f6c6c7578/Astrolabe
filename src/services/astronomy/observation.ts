import { createObserver } from "@/domain/astronomy/sky";
import { getNight } from "@/domain/observation/night";
import { buildObservationReport, type ObservationReport } from "@/domain/observation/report";
import { createTtlCache } from "@/lib/cache/ttl-cache";
import { type IsoDate, toIsoDate } from "@/lib/date/zoned";
import { createNightPath, type NightQuery } from "@/lib/validation/night-query";
import type { Place } from "@/lib/validation/place";
import { searchPlaces } from "@/services/geocoding/open-meteo";
import { getWeatherForecast } from "@/services/weather/open-meteo";

export const reportCacheTtl = 10 * 60_000;

const cache = createTtlCache<ObservationReport>({
    ttl: reportCacheTtl,
    maxEntries: 200,
    isCacheable: ({ weather }) => weather.status !== "error"
});

function getCacheKey({ name, region, latitude, longitude, timeZone }: Place, date: IsoDate): string {
    return JSON.stringify([name, region, latitude.toFixed(4), longitude.toFixed(4), timeZone, date]);
}

function getObservationReport(place: Place, date: IsoDate, now = new Date()): Promise<ObservationReport> {
    return cache.get(getCacheKey(place, date), async () => {
        const observer = createObserver(place);
        const night = getNight(observer, date, place.timeZone);
        const forecast = await getWeatherForecast(place, night, now);
        return buildObservationReport({ place, observer, night, forecast });
    });
}

export interface NightFailure {
    status: number;
    title: string;
    message: string;
}

export type NightResolution =
    | { kind: "home" }
    | { kind: "redirect"; location: string }
    | { kind: "report"; report: ObservationReport }
    | { kind: "failure"; failure: NightFailure };

const failures = {
    invalid: {
        status: 400,
        title: "Paramètres invalides",
        message: "Le lieu ou la date demandés ne sont pas valides. Choisis-les à nouveau avec le formulaire."
    },
    unavailable: {
        status: 502,
        title: "Recherche indisponible",
        message: "La recherche de lieux est momentanément indisponible. Réessaie dans quelques instants."
    }
} as const satisfies Record<string, NightFailure>;

async function resolveSearch(search: string, date: IsoDate | undefined): Promise<NightResolution> {
    try {
        const [place] = await searchPlaces(search);
        if (place) return { kind: "redirect", location: createNightPath(place, date) };
        return {
            kind: "failure",
            failure: {
                status: 404,
                title: "Lieu introuvable",
                message: `Aucun lieu ne correspond à "${search}". Essaie une autre orthographe ou une ville proche.`
            }
        };
    } catch (error) {
        console.error("Recherche de lieu impossible :", error);
        return { kind: "failure", failure: failures.unavailable };
    }
}

export async function resolveNightQuery(query: NightQuery, now = new Date()): Promise<NightResolution> {
    switch (query.kind) {
        case "empty":
            return { kind: "home" };
        case "invalid":
            return { kind: "failure", failure: failures.invalid };
        case "search":
            return resolveSearch(query.search, query.date);
        case "place":
            return {
                kind: "report",
                report: await getObservationReport(query.place, query.date ?? toIsoDate(now, query.place.timeZone), now)
            };
    }
}
