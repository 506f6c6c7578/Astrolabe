import {
    Body,
    Illumination,
    MoonPhase as getMoonPhaseAngle,
    type Observer,
    SearchMoonPhase
} from "astronomy-engine";
import { getRiseSet, type RiseSet, toDate } from "@/domain/astronomy/sky";

const moonPhases = [
    "new",
    "waxing-crescent",
    "first-quarter",
    "waxing-gibbous",
    "full",
    "waning-gibbous",
    "last-quarter",
    "waning-crescent"
] as const;

export type MoonPhase = (typeof moonPhases)[number];

export const moonPhaseLabels: Record<MoonPhase, string> = {
    new: "Nouvelle lune",
    "waxing-crescent": "Premier croissant",
    "first-quarter": "Premier quartier",
    "waxing-gibbous": "Lune gibbeuse croissante",
    full: "Pleine lune",
    "waning-gibbous": "Lune gibbeuse décroissante",
    "last-quarter": "Dernier quartier",
    "waning-crescent": "Dernier croissant"
};

export interface MoonState {
    phase: MoonPhase;
    phaseAngle: number;
    illumination: number;
}

export interface MoonEvents extends RiseSet {
    nextNewMoon: Date | null;
    nextFullMoon: Date | null;
}

const phaseSector = 360 / moonPhases.length;
const lunationSearchDays = 32;
const phaseLongitudes = { new: 0, full: 180 } as const;

export function getMoonPhase(phaseAngle: number): MoonPhase {
    const index = Math.round(phaseAngle / phaseSector) % moonPhases.length;
    return moonPhases[index] ?? "new";
}

export function getMoonState(time: Date): MoonState {
    const phaseAngle = getMoonPhaseAngle(time);
    return {
        phase: getMoonPhase(phaseAngle),
        phaseAngle,
        illumination: Illumination(Body.Moon, time).phase_fraction
    };
}

export function getMoonEvents(observer: Observer, start: Date, end: Date): MoonEvents {
    return {
        ...getRiseSet(Body.Moon, observer, start, end),
        nextNewMoon: toDate(SearchMoonPhase(phaseLongitudes.new, start, lunationSearchDays)),
        nextFullMoon: toDate(SearchMoonPhase(phaseLongitudes.full, start, lunationSearchDays))
    };
}
