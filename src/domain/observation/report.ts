import type { Observer } from "astronomy-engine";
import { messierObjects } from "@/data/catalog/messier";
import type { IsoDate } from "@/lib/date/zoned";
import { weightedAverage } from "@/lib/math";
import type { Place } from "@/lib/validation/place";
import { type DeepSkyVisibility, getVisibleDeepSkyObjects } from "@/domain/astronomy/deep-sky";
import { getMoonEvents, getMoonState, type MoonEvents, type MoonState } from "@/domain/astronomy/moon";
import { getPlanetVisibility, planets, type PlanetVisibility } from "@/domain/astronomy/planets";
import {
    findHourlyWeather,
    type HourlyWeather,
    summarizeWeather,
    type WeatherForecast,
    type WeatherSummary
} from "@/domain/weather/forecast";
import { getDarkHours, type Night, type NightSample, sampleStepMs } from "@/domain/observation/night";
import { computeNightScore, getMoonImpact, getSampleQuality, type NightScore } from "@/domain/observation/score";
import { findObservationWindows, type ObservationWindow } from "@/domain/observation/windows";

export interface ObservationSample extends NightSample {
    moonLight: number;
    weather: HourlyWeather | null;
    quality: number;
}

export interface MoonReport extends MoonState, MoonEvents {
    presence: number;
    impact: number;
}

export interface WeatherReport {
    status: WeatherForecast["status"];
    summary: WeatherSummary | null;
    hours: readonly HourlyWeather[];
}

export interface ObservationReport {
    place: Place;
    date: IsoDate;
    night: Night;
    samples: readonly ObservationSample[];
    moon: MoonReport;
    weather: WeatherReport;
    score: NightScore;
    windows: readonly ObservationWindow[];
    planets: readonly PlanetVisibility[];
    deepSky: readonly DeepSkyVisibility[];
}

interface ReportInput {
    place: Place;
    observer: Observer;
    night: Night;
    forecast: WeatherForecast;
}

function getObservationWeight(samples: readonly NightSample[]): (sample: NightSample) => number {
    return samples.some(({ darkness }) => darkness > 0)
        ? ({ darkness }) => darkness
        : ({ skyPhase }) => (skyPhase === "day" ? 0 : 1);
}

function getReferenceTime({ astronomicalNight, start, end }: Night): Date {
    const { start: from, end: to } = astronomicalNight ?? { start, end };
    return new Date((from.getTime() + to.getTime()) / 2);
}

function getHoursWithinNight(forecast: WeatherForecast, { start, end }: Night): readonly HourlyWeather[] {
    if (forecast.status !== "available") return [];
    return forecast.hours.filter(({ time }) => time >= start && time <= end);
}

export function buildObservationReport({ place, observer, night, forecast }: ReportInput): ObservationReport {
    const moonState = getMoonState(getReferenceTime(night));
    const hours = getHoursWithinNight(forecast, night);
    const samples = night.samples.map((sample) => {
        const weather = findHourlyWeather(hours, sample.time);
        const moonLight = sample.moonAltitude > 0 ? moonState.illumination : 0;
        return {
            ...sample,
            moonLight,
            weather,
            quality: getSampleQuality({ darkness: sample.darkness, moonLight, cloudCover: weather?.cloudCover ?? null })
        };
    });
    const weightOf = getObservationWeight(night.samples);
    const weatherSummary = summarizeWeather(samples.flatMap((sample) =>
        sample.weather ? [{ weather: sample.weather, weight: weightOf(sample) }] : []));
    const presence = weightedAverage(night.samples.map((sample) => ({
        value: sample.moonAltitude > 0 ? 1 : 0,
        weight: weightOf(sample)
    }))) ?? 0;

    return {
        place,
        date: night.date,
        night,
        samples,
        moon: {
            ...moonState,
            ...getMoonEvents(observer, night.start, night.end),
            presence,
            impact: getMoonImpact(moonState.illumination, presence)
        },
        weather: { status: forecast.status, summary: weatherSummary, hours },
        score: computeNightScore({
            darkHours: getDarkHours(night.samples),
            moonIllumination: moonState.illumination,
            moonPresence: presence,
            weather: weatherSummary
        }),
        windows: findObservationWindows(samples, sampleStepMs),
        planets: planets.map((planet) => getPlanetVisibility(planet, observer, night.samples, night)),
        deepSky: getVisibleDeepSkyObjects(messierObjects, observer, night.samples)
    };
}
