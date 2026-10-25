import { describe, expect, it } from "vitest";
import {
    findHourlyWeather,
    type HourlyWeather,
    isWithinForecastRange,
    summarizeWeather
} from "@/domain/weather/forecast";

function hour(time: string, overrides: Partial<HourlyWeather> = {}): HourlyWeather {
    return {
        time: new Date(time),
        cloudCover: 20,
        cloudCoverLow: 10,
        cloudCoverMid: 5,
        cloudCoverHigh: 5,
        humidity: 70,
        temperature: 12,
        dewPoint: 6,
        windSpeed: 10,
        precipitationProbability: 5,
        ...overrides
    };
}

describe("prévisions météo", () => {
    it("vérifie la portée des prévisions", () => {
        const now = new Date("2026-10-24T12:00:00Z");
        expect(isWithinForecastRange(new Date("2026-10-30T18:00:00Z"), new Date("2026-10-31T07:00:00Z"), now)).toBe(true);
        expect(isWithinForecastRange(new Date("2026-11-20T18:00:00Z"), new Date("2026-11-21T07:00:00Z"), now)).toBe(false);
        expect(isWithinForecastRange(new Date("2026-01-01T18:00:00Z"), new Date("2026-01-02T07:00:00Z"), now)).toBe(false);
    });

    it("trouve l'heure la plus proche à moins d'une heure", () => {
        const hours = [hour("2026-10-24T18:00:00Z"), hour("2026-10-24T19:00:00Z", { cloudCover: 80 })];
        expect(findHourlyWeather(hours, new Date("2026-10-24T18:40:00Z"))?.cloudCover).toBe(80);
        expect(findHourlyWeather(hours, new Date("2026-10-24T22:00:00Z"))).toBeNull();
    });

    it("résume la nuit en pondérant les heures et en détectant la rosée", () => {
        const summary = summarizeWeather([
            { weather: hour("2026-10-24T20:00:00Z", { cloudCover: 0, precipitationProbability: null }), weight: 1 },
            { weather: hour("2026-10-24T21:00:00Z", { cloudCover: 60, temperature: 4, dewPoint: 3 }), weight: 0.5 },
            { weather: hour("2026-10-24T22:00:00Z", { cloudCover: 100 }), weight: 0 }
        ]);
        expect(summary?.cloudCover).toBeCloseTo(20);
        expect(summary?.minimumTemperature).toBe(4);
        expect(summary?.precipitationProbability).toBe(5);
        expect(summary?.dewRisk).toBe(true);
    });

    it("retourne null sans heure pondérée", () => {
        expect(summarizeWeather([])).toBeNull();
    });
});
