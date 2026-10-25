import { Body, Constellation, Equator, Illumination, type Observer } from "astronomy-engine";
import {
    findHighestPoint,
    getBodyAltitude,
    getRecommendedInstrument,
    getRiseSet,
    type Instrument,
    type RiseSet
} from "@/domain/astronomy/sky";
import { twilightAltitudes } from "@/domain/astronomy/sun";

export interface Planet {
    body: Body;
    name: string;
}

export interface PlanetVisibility extends RiseSet {
    planet: Planet;
    magnitude: number;
    constellation: string;
    bestAltitude: number | null;
    bestTime: Date | null;
    visible: boolean;
    instrument: Instrument;
}

interface SunPosition {
    time: Date;
    sunAltitude: number;
}

export const planets: readonly Planet[] = [
    { body: Body.Mercury, name: "Mercure" },
    { body: Body.Venus, name: "Vénus" },
    { body: Body.Mars, name: "Mars" },
    { body: Body.Jupiter, name: "Jupiter" },
    { body: Body.Saturn, name: "Saturne" },
    { body: Body.Uranus, name: "Uranus" },
    { body: Body.Neptune, name: "Neptune" }
];

export const planetMinimumAltitude = 10;

export function getPlanetVisibility(
    planet: Planet,
    observer: Observer,
    samples: readonly SunPosition[],
    range: { start: Date; end: Date }
): PlanetVisibility {
    const darkSamples = samples.filter(({ sunAltitude }) => sunAltitude <= twilightAltitudes.civil);
    const best = findHighestPoint(darkSamples.map(({ time }) => ({
        time,
        altitude: getBodyAltitude(planet.body, time, observer)
    })));
    const referenceTime = best?.time ??
        new Date((range.start.getTime() + range.end.getTime()) / 2);
    const { ra, dec } = Equator(planet.body, referenceTime, observer, false, true);
    const magnitude = Illumination(planet.body, referenceTime).mag;

    return {
        planet,
        ...getRiseSet(planet.body, observer, range.start, range.end),
        magnitude,
        constellation: Constellation(ra, dec).symbol,
        bestAltitude: best?.altitude ?? null,
        bestTime: best?.time ?? null,
        visible: best !== null && best.altitude >= planetMinimumAltitude,
        instrument: getRecommendedInstrument(magnitude)
    };
}
