import { weightedAverage } from "@/lib/math";

export interface HourlyWeather {
    time: Date;
    cloudCover: number;
    cloudCoverLow: number | null;
    cloudCoverMid: number | null;
    cloudCoverHigh: number | null;
    humidity: number | null;
    temperature: number | null;
    dewPoint: number | null;
    windSpeed: number | null;
    precipitationProbability: number | null;
}

export type WeatherForecast =
    | { status: "available"; hours: readonly HourlyWeather[] }
    | { status: "out-of-range" }
    | { status: "error" };

export interface WeatherSummary {
    cloudCover: number;
    humidity: number | null;
    windSpeed: number | null;
    precipitationProbability: number | null;
    minimumTemperature: number | null;
    dewRisk: boolean;
}

export interface WeightedWeather {
    weather: HourlyWeather;
    weight: number;
}

export const forecastRangeDays = { past: 90, future: 15 } as const;

const hourInMs = 3_600_000;
const dayInMs = 86_400_000;
const dewSpread = 2;

export function isWithinForecastRange(start: Date, end: Date, now: Date): boolean {
    return start.getTime() >= now.getTime() - forecastRangeDays.past * dayInMs &&
        end.getTime() <= now.getTime() + forecastRangeDays.future * dayInMs;
}

export function findHourlyWeather(hours: readonly HourlyWeather[], time: Date): HourlyWeather | null {
    let nearest: HourlyWeather | null = null;
    let nearestDistance = hourInMs;
    for (const hour of hours) {
        const distance = Math.abs(hour.time.getTime() - time.getTime());
        if (distance <= nearestDistance) {
            nearest = hour;
            nearestDistance = distance;
        }
    }
    return nearest;
}

export function interpolateCloudCover(hours: readonly HourlyWeather[], time: Date): number | null {
    const nextIndex = hours.findIndex((hour) => hour.time >= time);
    const next = hours[nextIndex];
    const previous = hours[nextIndex - 1];
    if (!next || !previous) return findHourlyWeather(hours, time)?.cloudCover ?? null;
    const ratio = (time.getTime() - previous.time.getTime()) / (next.time.getTime() - previous.time.getTime());
    return previous.cloudCover + (next.cloudCover - previous.cloudCover) * ratio;
}

function averageOf(entries: readonly WeightedWeather[], read: (weather: HourlyWeather) => number | null) {
    return weightedAverage(entries.flatMap(({ weather, weight }) => {
        const value = read(weather);
        return value === null ? [] : [{ value, weight }];
    }));
}

function extremumOf(values: readonly (number | null)[], pick: (...values: number[]) => number): number | null {
    const known = values.filter((value) => value !== null);
    return known.length > 0 ? pick(...known) : null;
}

export function summarizeWeather(entries: readonly WeightedWeather[]): WeatherSummary | null {
    const relevant = entries.filter(({ weight }) => weight > 0);
    const cloudCover = averageOf(relevant, ({ cloudCover }) => cloudCover);
    if (cloudCover === null) return null;
    const hours = relevant.map(({ weather }) => weather);

    return {
        cloudCover,
        humidity: averageOf(relevant, ({ humidity }) => humidity),
        windSpeed: averageOf(relevant, ({ windSpeed }) => windSpeed),
        precipitationProbability: extremumOf(hours.map(({ precipitationProbability }) => precipitationProbability), Math.max),
        minimumTemperature: extremumOf(hours.map(({ temperature }) => temperature), Math.min),
        dewRisk: hours.some(({ temperature, dewPoint }) =>
            temperature !== null && dewPoint !== null && temperature - dewPoint <= dewSpread)
    };
}
