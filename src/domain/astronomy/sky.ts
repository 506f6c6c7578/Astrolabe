import {
    type AstroTime,
    type Body,
    Equator,
    EquatorFromVector,
    Horizon,
    Observer,
    RotateVector,
    SearchRiseSet,
    Rotation_EQJ_EQD,
    type RotationMatrix,
    Spherical,
    VectorFromSphere
} from "astronomy-engine";

export interface GeoPosition {
    latitude: number;
    longitude: number;
}

export interface SkyFrame {
    time: Date;
    precession: RotationMatrix;
}

export interface AltitudePoint {
    time: Date;
    altitude: number;
}

export interface RiseSet {
    rise: Date | null;
    set: Date | null;
}

export type Instrument = "naked-eye" | "binoculars" | "telescope";

export const instrumentLabels: Record<Instrument, string> = {
    "naked-eye": "Œil nu",
    binoculars: "Jumelles",
    telescope: "Télescope"
};

const hoursToDegrees = 15;
const dayInMs = 86_400_000;

export function toDate(time: AstroTime | null): Date | null {
    return time ? time.date : null;
}

export function createObserver({ latitude, longitude }: GeoPosition): Observer {
    return new Observer(latitude, longitude, 0);
}

export function createSkyFrame(time: Date): SkyFrame {
    return { time, precession: Rotation_EQJ_EQD(time) };
}

export function getBodyAltitude(body: Body, time: Date, observer: Observer): number {
    const { ra, dec } = Equator(body, time, observer, true, true);
    return Horizon(time, observer, ra, dec, "normal").altitude;
}

export function getRiseSet(body: Body, observer: Observer, start: Date, end: Date): RiseSet {
    const rangeInDays = (end.getTime() - start.getTime()) / dayInMs;
    const search = (direction: 1 | -1) => toDate(SearchRiseSet(body, observer, direction, start, rangeInDays));
    return { rise: search(1), set: search(-1) };
}

export function getFixedObjectAltitude(
    { time, precession }: SkyFrame,
    observer: Observer,
    rightAscension: number,
    declination: number
): number {
    const j2000 = VectorFromSphere(new Spherical(declination, rightAscension * hoursToDegrees, 1), time);
    const { ra, dec } = EquatorFromVector(RotateVector(precession, j2000));
    return Horizon(time, observer, ra, dec, "normal").altitude;
}

export function findHighestPoint(points: readonly AltitudePoint[]): AltitudePoint | null {
    return points.reduce<AltitudePoint | null>(
        (highest, point) => (!highest || point.altitude > highest.altitude ? point : highest),
        null
    );
}

export function getRecommendedInstrument(magnitude: number): Instrument {
    if (magnitude <= 5) return "naked-eye";
    return magnitude <= 8.5 ? "binoculars" : "telescope";
}
