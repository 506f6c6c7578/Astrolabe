export type IsoDate = `${number}-${number}-${number}`;

interface ZonedParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const hourInMs = 3_600_000;
const dayInMs = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
    const cached = formatters.get(timeZone);
    if (cached) return cached;
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    formatters.set(timeZone, formatter);
    return formatter;
}

function getZonedParts(instant: Date, timeZone: string): ZonedParts {
    const values = new Map(getPartsFormatter(timeZone).formatToParts(instant)
        .map(({ type, value }) => [type, Number(value)]));
    const read = (type: Intl.DateTimeFormatPartTypes) => values.get(type) ?? 0;
    return {
        year: read("year"),
        month: read("month"),
        day: read("day"),
        hour: read("hour"),
        minute: read("minute"),
        second: read("second")
    };
}

function pad(value: number, length = 2): string {
    return String(value).padStart(length, "0");
}

function toIsoString(year: number, month: number, day: number): IsoDate {
    return `${pad(year, 4)}-${pad(month)}-${pad(day)}` as IsoDate;
}

export function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
    const match = isoDatePattern.exec(value);
    if (!match) return null;
    const [year, month, day] = [match[1], match[2], match[3]].map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const valid = date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
    return valid ? { year, month, day } : null;
}

export function isIsoDate(value: string): value is IsoDate {
    return parseIsoDate(value) !== null;
}

function getDateParts(date: IsoDate): { year: number; month: number; day: number } {
    const parts = parseIsoDate(date);
    if (!parts) throw new RangeError(`Date invalide : ${date}`);
    return parts;
}

export function isTimeZone(value: string): boolean {
    try {
        getPartsFormatter(value);
        return true;
    } catch {
        return false;
    }
}

export function getTimeZoneOffset(instant: Date, timeZone: string): number {
    const { year, month, day, hour, minute, second } = getZonedParts(instant, timeZone);
    const zonedAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    return zonedAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

export function zonedTimeToInstant(date: IsoDate, hour: number, timeZone: string): Date {
    const { year, month, day } = getDateParts(date);
    const wallTime = Date.UTC(year, month - 1, day, hour);
    const firstGuess = wallTime - getTimeZoneOffset(new Date(wallTime), timeZone);
    return new Date(wallTime - getTimeZoneOffset(new Date(firstGuess), timeZone));
}

export function toIsoDate(instant: Date, timeZone: string): IsoDate {
    const { year, month, day } = getZonedParts(instant, timeZone);
    return toIsoString(year, month, day);
}

export function addDays(date: IsoDate, days: number): IsoDate {
    const { year, month, day } = getDateParts(date);
    const shifted = new Date(Date.UTC(year, month - 1, day) + days * dayInMs);
    return toIsoString(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

function roundToZonedHour(instant: Date, timeZone: string, round: (value: number) => number): Date {
    const offset = getTimeZoneOffset(instant, timeZone);
    return new Date(round((instant.getTime() + offset) / hourInMs) * hourInMs - offset);
}

export function floorToZonedHour(instant: Date, timeZone: string): Date {
    return roundToZonedHour(instant, timeZone, Math.floor);
}

export function ceilToZonedHour(instant: Date, timeZone: string): Date {
    return roundToZonedHour(instant, timeZone, Math.ceil);
}

export function toLocalCalendarDate(date: IsoDate): Date {
    const { year, month, day } = getDateParts(date);
    return new Date(year, month - 1, day);
}

export function fromLocalCalendarDate(date: Date): IsoDate {
    return toIsoString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
