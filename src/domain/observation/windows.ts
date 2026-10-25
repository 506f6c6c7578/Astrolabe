import { getRating, type Rating } from "@/domain/observation/score";

export interface QualitySample {
    time: Date;
    quality: number;
}

export interface ObservationWindow {
    start: Date;
    end: Date;
    quality: number;
    rating: Rating;
}

export const windowCriteria = {
    minimumQuality: 0.3,
    relativeThreshold: 0.8,
    minimumDurationMs: 30 * 60_000,
    limit: 3
} as const;

export function getDuration({ start, end }: { start: Date; end: Date }): number {
    return end.getTime() - start.getTime();
}

function toWindow(run: readonly QualitySample[], stepMs: number): ObservationWindow | null {
    const first = run.at(0);
    const last = run.at(-1);
    if (!first || !last) return null;
    const quality = run.reduce((total, sample) => total + sample.quality, 0) / run.length;
    return {
        start: first.time,
        end: new Date(last.time.getTime() + stepMs),
        quality,
        rating: getRating(quality * 100)
    };
}

export function findObservationWindows(samples: readonly QualitySample[], stepMs: number): ObservationWindow[] {
    const best = Math.max(0, ...samples.map(({ quality }) => quality));
    if (best < windowCriteria.minimumQuality) return [];
    const threshold = Math.max(windowCriteria.minimumQuality, best * windowCriteria.relativeThreshold);

    const runs: QualitySample[][] = [];
    let current: QualitySample[] = [];
    for (const sample of samples) {
        if (sample.quality >= threshold) {
            current.push(sample);
        } else if (current.length > 0) {
            runs.push(current);
            current = [];
        }
    }
    if (current.length > 0) runs.push(current);

    return runs
        .flatMap((run) => {
            const window = toWindow(run, stepMs);
            return window && getDuration(window) >= windowCriteria.minimumDurationMs ? [window] : [];
        })
        .sort((first, second) => second.quality - first.quality || getDuration(second) - getDuration(first))
        .slice(0, windowCriteria.limit);
}
