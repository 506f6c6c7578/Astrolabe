export interface Weighted {
    value: number;
    weight: number;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function weightedAverage(entries: readonly Weighted[]): number | null {
    let total = 0;
    let weights = 0;
    for (const { value, weight } of entries) {
        total += value * weight;
        weights += weight;
    }
    return weights > 0 ? total / weights : null;
}
