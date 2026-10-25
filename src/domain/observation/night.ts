import { Body, type Observer } from "astronomy-engine";
import {
    addDays,
    ceilToZonedHour,
    floorToZonedHour,
    type IsoDate,
    zonedTimeToInstant
} from "@/lib/date/zoned";
import { getBodyAltitude } from "@/domain/astronomy/sky";
import { getDarkness, getSkyPhase, getSunEvents, type SkyPhase, type SunEvents } from "@/domain/astronomy/sun";

export interface NightSample {
    time: Date;
    sunAltitude: number;
    moonAltitude: number;
    darkness: number;
    skyPhase: SkyPhase;
}

export interface Interval {
    start: Date;
    end: Date;
}

export interface Night extends Interval {
    date: IsoDate;
    timeZone: string;
    sun: SunEvents;
    astronomicalNight: Interval | null;
    samples: readonly NightSample[];
}

export const sampleStepMs = 10 * 60_000;

const hourInMs = 3_600_000;
const localHours = { noon: 12, evening: 18, morning: 8 } as const;

function createSamples(observer: Observer, { start, end }: Interval): NightSample[] {
    const count = Math.floor((end.getTime() - start.getTime()) / sampleStepMs) + 1;
    return Array.from({ length: count }, (_, index) => {
        const time = new Date(start.getTime() + index * sampleStepMs);
        const sunAltitude = getBodyAltitude(Body.Sun, time, observer);
        return {
            time,
            sunAltitude,
            moonAltitude: getBodyAltitude(Body.Moon, time, observer),
            darkness: getDarkness(sunAltitude),
            skyPhase: getSkyPhase(sunAltitude)
        };
    });
}

function getAstronomicalNight(sun: SunEvents, samples: readonly NightSample[]): Interval | null {
    const darkSamples = samples.filter(({ skyPhase }) => skyPhase === "night");
    const firstDark = darkSamples.at(0);
    const lastDark = darkSamples.at(-1);
    if (!firstDark || !lastDark) return null;
    const { dusk, dawn } = sun;
    return {
        start: dusk.astronomical && dusk.astronomical < lastDark.time ? dusk.astronomical : firstDark.time,
        end: dawn.astronomical && dawn.astronomical > firstDark.time ? dawn.astronomical : lastDark.time
    };
}

export function getNight(observer: Observer, date: IsoDate, timeZone: string): Night {
    const sun = getSunEvents(observer, zonedTimeToInstant(date, localHours.noon, timeZone));
    const evening = sun.sunset ?? zonedTimeToInstant(date, localHours.evening, timeZone);
    const morning = sun.sunrise ?? zonedTimeToInstant(addDays(date, 1), localHours.morning, timeZone);
    const range = {
        start: floorToZonedHour(new Date(evening.getTime() - hourInMs), timeZone),
        end: ceilToZonedHour(new Date(morning.getTime() + hourInMs), timeZone)
    };
    const samples = createSamples(observer, range);

    return {
        ...range,
        date,
        timeZone,
        sun,
        astronomicalNight: getAstronomicalNight(sun, samples),
        samples
    };
}

export function getDarkHours(samples: readonly NightSample[]): number {
    return samples.reduce((total, { darkness }) => total + darkness, 0) * sampleStepMs / hourInMs;
}
