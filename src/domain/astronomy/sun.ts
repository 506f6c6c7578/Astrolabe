import { Body, type Observer, SearchAltitude, SearchRiseSet } from "astronomy-engine";
import { clamp } from "@/lib/math";
import { toDate } from "@/domain/astronomy/sky";

export const twilightAltitudes = {
    civil: -6,
    nautical: -12,
    astronomical: -18
} as const;

export type Twilight = keyof typeof twilightAltitudes;

export type SkyPhase = "day" | Twilight | "night";

export const skyPhases: readonly SkyPhase[] = ["day", "civil", "nautical", "astronomical", "night"];

export const skyPhaseLabels: Record<SkyPhase, string> = {
    day: "Jour",
    civil: "Crépuscule civil",
    nautical: "Crépuscule nautique",
    astronomical: "Crépuscule astronomique",
    night: "Nuit noire"
};

export interface SunEvents {
    sunset: Date | null;
    sunrise: Date | null;
    dusk: Record<Twilight, Date | null>;
    dawn: Record<Twilight, Date | null>;
}

const horizonAltitude = -0.833;
const searchWindowDays = 1;

export function getSunEvents(observer: Observer, from: Date): SunEvents {
    const search = (direction: 1 | -1, altitude: number) =>
        toDate(SearchAltitude(Body.Sun, observer, direction, from, searchWindowDays, altitude));
    const searchTwilight = (direction: 1 | -1): Record<Twilight, Date | null> => ({
        civil: search(direction, twilightAltitudes.civil),
        nautical: search(direction, twilightAltitudes.nautical),
        astronomical: search(direction, twilightAltitudes.astronomical)
    });

    return {
        sunset: toDate(SearchRiseSet(Body.Sun, observer, -1, from, searchWindowDays)),
        sunrise: toDate(SearchRiseSet(Body.Sun, observer, 1, from, searchWindowDays)),
        dusk: searchTwilight(-1),
        dawn: searchTwilight(1)
    };
}

export function getSkyPhase(sunAltitude: number): SkyPhase {
    if (sunAltitude >= horizonAltitude) return "day";
    if (sunAltitude >= twilightAltitudes.civil) return "civil";
    if (sunAltitude >= twilightAltitudes.nautical) return "nautical";
    if (sunAltitude >= twilightAltitudes.astronomical) return "astronomical";
    return "night";
}

export function getDarkness(sunAltitude: number): number {
    const { nautical, astronomical } = twilightAltitudes;
    return clamp((nautical - sunAltitude) / (nautical - astronomical), 0, 1);
}
