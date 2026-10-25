import { Body, Equator, type Observer } from "astronomy-engine";
import type { MessierObject } from "@/data/catalog/messier";
import {
    createObserver,
    createSkyFrame,
    findHighestPoint,
    getFixedObjectAltitude
} from "@/domain/astronomy/sky";

export interface DeepSkyVisibility {
    object: MessierObject;
    bestAltitude: number;
    bestTime: Date;
}

interface DarknessSample {
    time: Date;
    darkness: number;
}

export const deepSkyMinimumAltitude = 25;
const deepSkyMinimumDarkness = 0.5;

const hoursPerTurn = 24;
const referenceYear = 2026;
const geocentricObserver = createObserver({ latitude: 0, longitude: 0 });

export function getVisibleDeepSkyObjects(
    objects: readonly MessierObject[],
    observer: Observer,
    samples: readonly DarknessSample[]
): DeepSkyVisibility[] {
    const frames = samples
        .filter(({ darkness }) => darkness >= deepSkyMinimumDarkness)
        .map(({ time }) => createSkyFrame(time));

    return objects
        .flatMap((object) => {
            const best = findHighestPoint(frames.map((frame) => ({
                time: frame.time,
                altitude: getFixedObjectAltitude(frame, observer, object.rightAscension, object.declination)
            })));
            return best && best.altitude >= deepSkyMinimumAltitude
                ? [{ object, bestAltitude: best.altitude, bestTime: best.time }]
                : [];
        })
        .sort((first, second) => first.object.magnitude - second.object.magnitude);
}

function getHourAngleDistance(first: number, second: number): number {
    const difference = Math.abs(first - second) % hoursPerTurn;
    return Math.min(difference, hoursPerTurn - difference);
}

export function getBestObservationMonth(rightAscension: number): number {
    const oppositeSunPosition = (month: number) => {
        const time = new Date(Date.UTC(referenceYear, month, 15));
        const { ra } = Equator(Body.Sun, time, geocentricObserver, true, true);
        return getHourAngleDistance(ra + hoursPerTurn / 2, rightAscension);
    };
    const distances = Array.from({ length: 12 }, (_, month) => oppositeSunPosition(month));
    return distances.indexOf(Math.min(...distances));
}

export function getObservableLatitudes(declination: number): { min: number; max: number } {
    const reach = 90 - deepSkyMinimumAltitude;
    return {
        min: Math.max(-90, Math.round(declination - reach)),
        max: Math.min(90, Math.round(declination + reach))
    };
}
