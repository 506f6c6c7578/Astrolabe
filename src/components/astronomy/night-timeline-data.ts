import { findHighestPoint } from "@/domain/astronomy/sky";
import { type SkyPhase, skyPhaseLabels } from "@/domain/astronomy/sun";
import { sampleStepMs } from "@/domain/observation/night";
import type { ObservationReport } from "@/domain/observation/report";
import { interpolateCloudCover } from "@/domain/weather/forecast";

const hourInMs = 3_600_000;

export interface TimeRange {
    start: number;
    end: number;
}

export interface TimelinePoint {
    time: number;
    sun: number;
    moon: number;
    clouds: number | null;
    quality: number;
    phase: string;
}

export interface TimelineBand extends TimeRange {
    phase: SkyPhase;
}

export interface NightTimelineData {
    timeZone: string;
    range: TimeRange;
    hours: number[];
    points: TimelinePoint[];
    bands: TimelineBand[];
    windows: TimeRange[];
    moonPeak: { time: number; altitude: number } | null;
}

function toBands(samples: ObservationReport["samples"], end: number): TimelineBand[] {
    return samples.reduce<TimelineBand[]>((bands, { time, skyPhase }) => {
        const start = time.getTime();
        const last = bands.at(-1);
        const bandEnd = Math.min(start + sampleStepMs, end);
        if (last?.phase === skyPhase) last.end = bandEnd;
        else bands.push({ phase: skyPhase, start, end: bandEnd });
        return bands;
    }, []);
}

export function toNightTimelineData({ night, samples, windows, weather }: ObservationReport): NightTimelineData {
    const range = { start: night.start.getTime(), end: night.end.getTime() };
    const hourCount = Math.floor((range.end - range.start) / hourInMs);
    const moonPeak = findHighestPoint(samples.map(({ time, moonAltitude }) => ({ time, altitude: moonAltitude })));

    return {
        timeZone: night.timeZone,
        range,
        hours: Array.from({ length: hourCount + 1 }, (_, index) => range.start + index * hourInMs),
        points: samples.map(({ time, sunAltitude, moonAltitude, quality, skyPhase }) => ({
            time: time.getTime(),
            sun: sunAltitude,
            moon: moonAltitude,
            clouds: interpolateCloudCover(weather.hours, time),
            quality,
            phase: skyPhaseLabels[skyPhase]
        })),
        bands: toBands(samples, range.end),
        windows: windows.map(({ start, end }) => ({ start: start.getTime(), end: end.getTime() })),
        moonPeak: moonPeak && { time: moonPeak.time.getTime(), altitude: moonPeak.altitude }
    };
}
