import { describe, expect, it } from "vitest";
import { createObserver } from "@/domain/astronomy/sky";
import { getNight, sampleStepMs } from "@/domain/observation/night";
import { buildObservationReport } from "@/domain/observation/report";
import { computeNightScore, getRating, getSampleQuality } from "@/domain/observation/score";
import { findObservationWindows } from "@/domain/observation/windows";
import type { HourlyWeather, WeatherSummary } from "@/domain/weather/forecast";

const clearSky: WeatherSummary = {
    cloudCover: 0,
    humidity: 60,
    windSpeed: 5,
    precipitationProbability: 0,
    minimumTemperature: 8,
    dewRisk: false
};

function samplesFrom(qualities: readonly number[]) {
    const start = Date.UTC(2026, 9, 24, 18);
    return qualities.map((quality, index) => ({ time: new Date(start + index * sampleStepMs), quality }));
}

describe("score de la nuit", () => {
    it("attribue la note maximale à une longue nuit sans Lune et sans nuages", () => {
        const score = computeNightScore({ darkHours: 10, moonIllumination: 0, moonPresence: 0, weather: clearSky });
        expect(score.value).toBe(100);
        expect(score.rating).toBe("excellent");
        expect(score.factors.map(({ key }) => key)).toEqual(["darkness", "moon", "clouds", "atmosphere"]);
    });

    it("pénalise la pleine lune présente toute la nuit", () => {
        const score = computeNightScore({ darkHours: 10, moonIllumination: 1, moonPresence: 1, weather: clearSky });
        expect(score.value).toBe(50);
        expect(score.factors.find(({ key }) => key === "moon")?.detail).toContain("100");
    });

    it("rend la nuit défavorable par ciel couvert", () => {
        const score = computeNightScore({
            darkHours: 10,
            moonIllumination: 0,
            moonPresence: 0,
            weather: { ...clearSky, cloudCover: 95 }
        });
        expect(score.value).toBeLessThan(20);
        expect(score.rating).toBe("bad");
    });

    it("applique les pénalités d'humidité et de vent", () => {
        const score = computeNightScore({
            darkHours: 10,
            moonIllumination: 0,
            moonPresence: 0,
            weather: { ...clearSky, humidity: 100, windSpeed: 50, dewRisk: true }
        });
        expect(score.value).toBe(60);
        expect(score.factors.find(({ key }) => key === "atmosphere")?.detail).toContain("rosée");
    });

    it("signale un score calculé sans météo", () => {
        const score = computeNightScore({ darkHours: 4, moonIllumination: 0.5, moonPresence: 0.5, weather: null });
        expect(score.weatherIncluded).toBe(false);
        expect(score.value).toBe(63);
        expect(score.factors.find(({ key }) => key === "clouds")?.value).toBeNull();
    });

    it("convertit un score en appréciation", () => {
        expect(getRating(80)).toBe("excellent");
        expect(getRating(79)).toBe("good");
        expect(getRating(40)).toBe("fair");
        expect(getRating(20)).toBe("poor");
        expect(getRating(0)).toBe("bad");
    });

    it("combine obscurité, Lune et nuages dans la qualité d'un instant", () => {
        expect(getSampleQuality({ darkness: 1, moonLight: 0, cloudCover: null })).toBe(1);
        expect(getSampleQuality({ darkness: 1, moonLight: 0.5, cloudCover: 50 })).toBe(0.25);
        expect(getSampleQuality({ darkness: 0, moonLight: 0, cloudCover: 0 })).toBe(0);
    });
});

describe("créneaux d'observation", () => {
    it("trouve le meilleur créneau en premier", () => {
        const windows = findObservationWindows(samplesFrom([0, 0.9, 0.9, 0.9, 0.2, 1, 1, 1, 1, 0]), sampleStepMs);
        expect(windows).toHaveLength(2);
        expect(windows[0]?.quality).toBe(1);
        expect(windows[0]?.start.getTime()).toBe(Date.UTC(2026, 9, 24, 18) + 5 * sampleStepMs);
        expect(windows[0]?.end.getTime()).toBe(Date.UTC(2026, 9, 24, 18) + 9 * sampleStepMs);
    });

    it("ignore les créneaux trop courts et les nuits sans qualité suffisante", () => {
        expect(findObservationWindows(samplesFrom([0, 1, 1, 0]), sampleStepMs)).toEqual([]);
        expect(findObservationWindows(samplesFrom([0.1, 0.2, 0.2, 0.2, 0.1]), sampleStepMs)).toEqual([]);
    });

    it("limite le nombre de créneaux", () => {
        const qualities = Array.from({ length: 5 }, () => [1, 1, 1, 0]).flat();
        expect(findObservationWindows(samplesFrom(qualities), sampleStepMs)).toHaveLength(3);
    });
});

describe("rapport d'observation", () => {
    const place = { name: "Paris", latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" };
    const observer = createObserver(place);
    const night = getNight(observer, "2026-10-24", place.timeZone);

    it("produit un rapport complet sans météo", () => {
        const report = buildObservationReport({ place, observer, night, forecast: { status: "out-of-range" } });
        expect(report.weather).toEqual({ status: "out-of-range", summary: null, hours: [] });
        expect(report.score.weatherIncluded).toBe(false);
        expect(report.samples).toHaveLength(night.samples.length);
        expect(report.planets).toHaveLength(7);
        expect(report.deepSky.length).toBeGreaterThan(10);
        expect(report.moon.presence).toBeGreaterThanOrEqual(0);
        expect(report.moon.presence).toBeLessThanOrEqual(1);
    });

    it("intègre les nuages heure par heure", () => {
        const hours: HourlyWeather[] = [];
        for (let time = night.start.getTime(); time <= night.end.getTime(); time += 3_600_000) {
            hours.push({
                time: new Date(time),
                cloudCover: 100,
                cloudCoverLow: 100,
                cloudCoverMid: 0,
                cloudCoverHigh: 0,
                humidity: 70,
                temperature: 10,
                dewPoint: 5,
                windSpeed: 10,
                precipitationProbability: 20
            });
        }
        const report = buildObservationReport({ place, observer, night, forecast: { status: "available", hours } });
        expect(report.weather.summary?.cloudCover).toBeCloseTo(100);
        expect(report.score.value).toBe(0);
        expect(report.windows).toEqual([]);
        expect(report.samples.every(({ quality }) => quality === 0)).toBe(true);
    });
});
