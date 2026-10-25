import { formatHours, formatPercent, formatPercentValue, formatSpeed } from "@/lib/format";
import { clamp } from "@/lib/math";
import type { WeatherSummary } from "@/domain/weather/forecast";

export const ratings = ["excellent", "good", "fair", "poor", "bad"] as const;

export type Rating = (typeof ratings)[number];

export const ratingLabels: Record<Rating, string> = {
    excellent: "Excellente",
    good: "Bonne",
    fair: "Moyenne",
    poor: "Médiocre",
    bad: "Défavorable"
};

export const ratingVerdicts: Record<Rating, string> = {
    excellent: "Nuit excellente, idéale pour le ciel profond.",
    good: "Bonne nuit d'observation.",
    fair: "Nuit moyenne : privilégie les objets brillants.",
    poor: "Nuit médiocre : la Lune et les planètes restent accessibles.",
    bad: "Nuit défavorable à l'observation."
};

export type MoonImpactLevel = "negligible" | "low" | "moderate" | "high";

export const moonImpactLabels: Record<MoonImpactLevel, string> = {
    negligible: "Négligeable",
    low: "Faible",
    moderate: "Modérée",
    high: "Forte"
};

export type ScoreFactorKey = "darkness" | "moon" | "clouds" | "atmosphere";

export interface ScoreFactor {
    key: ScoreFactorKey;
    label: string;
    value: number | null;
    detail: string;
}

export interface NightScore {
    value: number;
    rating: Rating;
    weatherIncluded: boolean;
    factors: readonly ScoreFactor[];
}

export interface ScoreInput {
    darkHours: number;
    moonIllumination: number;
    moonPresence: number;
    weather: WeatherSummary | null;
}

export interface QualityInput {
    darkness: number;
    moonLight: number;
    cloudCover: number | null;
}

export const scoreModel = {
    fullDarknessHours: 8,
    darknessWeight: 0.5,
    moonWeight: 0.5,
    humidity: { threshold: 80, range: 20, maximumPenalty: 0.2 },
    wind: { threshold: 20, range: 30, maximumPenalty: 0.2 }
} as const;

export const ratingMinimums: Record<Rating, number> = {
    excellent: 80,
    good: 60,
    fair: 40,
    poor: 20,
    bad: 0
};

const negligible = 0.05;

export function getRating(score: number): Rating {
    return ratings.find((rating) => score >= ratingMinimums[rating]) ?? "bad";
}

export function getMoonImpact(illumination: number, presence: number): number {
    return clamp(illumination * presence, 0, 1);
}

export function getMoonImpactLevel(impact: number): MoonImpactLevel {
    if (impact < 0.1) return "negligible";
    if (impact < 0.3) return "low";
    return impact < 0.6 ? "moderate" : "high";
}

export function getSampleQuality({ darkness, moonLight, cloudCover }: QualityInput): number {
    return darkness * (1 - moonLight) * (1 - (cloudCover ?? 0) / 100);
}

function getPenalty(value: number | null, { threshold, range, maximumPenalty }: {
    threshold: number;
    range: number;
    maximumPenalty: number;
}): number {
    return value === null ? 0 : clamp((value - threshold) / range, 0, 1) * maximumPenalty;
}

function describeDarkness(darkHours: number): string {
    return darkHours < negligible
        ? "Le Soleil ne descend pas assez sous l'horizon : pas de véritable nuit noire."
        : `Environ ${formatHours(darkHours)} de ciel pleinement noir.`;
}

function describeMoon(illumination: number, presence: number): string {
    if (illumination < negligible) return "Nouvelle lune : aucune gêne lumineuse.";
    if (presence < negligible) return "La Lune reste couchée pendant la nuit noire.";
    return `Lune éclairée à ${formatPercent(illumination)}, levée pendant ${formatPercent(presence)} de la nuit noire.`;
}

function describeAtmosphere({ humidity, windSpeed, dewRisk }: WeatherSummary): string {
    const conditions = [
        humidity === null ? null : `humidité ${formatPercentValue(humidity)}`,
        windSpeed === null ? null : `vent ${formatSpeed(windSpeed)}`
    ].filter((condition) => condition !== null);
    const summary = conditions.length > 0
        ? `${conditions.join(", ").replace(/^./, (first) => first.toUpperCase())}.`
        : "Humidité et vent inconnus.";
    return dewRisk ? `${summary} Risque de rosée sur l'optique.` : summary;
}

export function computeNightScore({ darkHours, moonIllumination, moonPresence, weather }: ScoreInput): NightScore {
    const darkness = clamp(darkHours / scoreModel.fullDarknessHours, 0, 1);
    const moon = 1 - getMoonImpact(moonIllumination, moonPresence);
    const sky = scoreModel.darknessWeight * darkness + scoreModel.moonWeight * moon;
    const clouds = weather ? 1 - clamp(weather.cloudCover / 100, 0, 1) : null;
    const atmosphere = weather
        ? 1 - getPenalty(weather.humidity, scoreModel.humidity) - getPenalty(weather.windSpeed, scoreModel.wind)
        : null;
    const value = Math.round(100 * sky * (clouds ?? 1) * (atmosphere ?? 1));

    return {
        value,
        rating: getRating(value),
        weatherIncluded: weather !== null,
        factors: [
            { key: "darkness", label: "Obscurité", value: darkness, detail: describeDarkness(darkHours) },
            { key: "moon", label: "Lune", value: moon, detail: describeMoon(moonIllumination, moonPresence) },
            {
                key: "clouds",
                label: "Ciel dégagé",
                value: clouds,
                detail: weather
                    ? `Couverture nuageuse moyenne de ${formatPercentValue(weather.cloudCover)} pendant la nuit.`
                    : "Prévisions indisponibles pour cette date."
            },
            {
                key: "atmosphere",
                label: "Atmosphère",
                value: atmosphere,
                detail: weather ? describeAtmosphere(weather) : "Prévisions indisponibles pour cette date."
            }
        ]
    };
}
