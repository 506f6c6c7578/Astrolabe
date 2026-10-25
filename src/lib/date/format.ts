import { type IsoDate, parseIsoDate } from "@/lib/date/zoned";

const locale = "fr-FR";
const minuteInMs = 60_000;

const longDateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric"
});

const shortDateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long"
});

const monthFormatter = new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "long" });

function toUtcDate(date: IsoDate): Date {
    const parts = parseIsoDate(date);
    return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)) : new Date(Number.NaN);
}

export function formatLongDate(date: IsoDate): string {
    return longDateFormatter.format(toUtcDate(date));
}

export function formatDate(date: IsoDate): string {
    return dateFormatter.format(toUtcDate(date));
}

export function formatShortDate(date: IsoDate): string {
    return shortDateFormatter.format(toUtcDate(date));
}

export function formatMonth(monthIndex: number): string {
    return monthFormatter.format(new Date(Date.UTC(2000, monthIndex, 1)));
}

export function formatTime(instant: Date, timeZone: string): string {
    return instant.toLocaleTimeString(locale, { timeZone, hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(instant: Date, timeZone: string): string {
    return instant.toLocaleString(locale, {
        timeZone,
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function formatDuration(milliseconds: number): string {
    const totalMinutes = Math.round(milliseconds / minuteInMs);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, "0")}`;
}
