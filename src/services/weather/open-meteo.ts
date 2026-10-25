import * as z from "zod/mini";
import type { GeoPosition } from "@/domain/astronomy/sky";
import type { Interval } from "@/domain/observation/night";
import { type HourlyWeather, isWithinForecastRange, type WeatherForecast } from "@/domain/weather/forecast";
import { createTtlCache } from "@/lib/cache/ttl-cache";
import { toIsoDate } from "@/lib/date/zoned";
import { fetchJson } from "@/lib/http";

const endpoint = "https://api.open-meteo.com/v1/forecast";
const timeout = 8_000;
const coordinatePrecision = 2;
const secondInMs = 1_000;

const variables = {
    cloudCover: "cloud_cover",
    cloudCoverLow: "cloud_cover_low",
    cloudCoverMid: "cloud_cover_mid",
    cloudCoverHigh: "cloud_cover_high",
    humidity: "relative_humidity_2m",
    temperature: "temperature_2m",
    dewPoint: "dew_point_2m",
    windSpeed: "wind_speed_10m",
    precipitationProbability: "precipitation_probability"
} as const;

const series = z.array(z.nullable(z.number()));

const responseSchema = z.object({
    hourly: z.object({
        time: z.array(z.number()),
        [variables.cloudCover]: series,
        [variables.cloudCoverLow]: series,
        [variables.cloudCoverMid]: series,
        [variables.cloudCoverHigh]: series,
        [variables.humidity]: series,
        [variables.temperature]: series,
        [variables.dewPoint]: series,
        [variables.windSpeed]: series,
        [variables.precipitationProbability]: series
    }).check(z.refine(({ time, ...values }) =>
        Object.values(values).every((values) => values.length === time.length)))
});

type ForecastResponse = z.infer<typeof responseSchema>;

export const weatherCacheTtl = 30 * 60_000;

const cache = createTtlCache<readonly HourlyWeather[]>({ ttl: weatherCacheTtl, maxEntries: 500 });

function toHourlyWeather({ hourly }: ForecastResponse): HourlyWeather[] {
    return hourly.time.flatMap((timestamp, index) => {
        const read = (variable: (typeof variables)[keyof typeof variables]) => hourly[variable][index] ?? null;
        const cloudCover = read(variables.cloudCover);
        if (cloudCover === null) return [];
        return [{
            time: new Date(timestamp * secondInMs),
            cloudCover,
            cloudCoverLow: read(variables.cloudCoverLow),
            cloudCoverMid: read(variables.cloudCoverMid),
            cloudCoverHigh: read(variables.cloudCoverHigh),
            humidity: read(variables.humidity),
            temperature: read(variables.temperature),
            dewPoint: read(variables.dewPoint),
            windSpeed: read(variables.windSpeed),
            precipitationProbability: read(variables.precipitationProbability)
        }];
    });
}

function fetchHourlyWeather({ latitude, longitude }: GeoPosition, { start, end }: Interval) {
    const url = new URL(endpoint);
    url.search = new URLSearchParams({
        latitude: latitude.toFixed(coordinatePrecision),
        longitude: longitude.toFixed(coordinatePrecision),
        hourly: Object.values(variables).join(","),
        start_date: toIsoDate(start, "UTC"),
        end_date: toIsoDate(end, "UTC"),
        timezone: "GMT",
        timeformat: "unixtime",
        wind_speed_unit: "kmh"
    }).toString();
    return cache.get(url.search, async () => toHourlyWeather(await fetchJson(url, responseSchema, timeout)));
}

export async function getWeatherForecast(position: GeoPosition, night: Interval, now: Date): Promise<WeatherForecast> {
    if (!isWithinForecastRange(night.start, night.end, now)) return { status: "out-of-range" };
    try {
        return { status: "available", hours: await fetchHourlyWeather(position, night) };
    } catch (error) {
        console.error("Prévisions météo indisponibles :", error);
        return { status: "error" };
    }
}
