import { describe, expect, it } from "vitest";
import { formatDuration, formatLongDate, formatTime } from "@/lib/date/format";
import {
    addDays,
    ceilToZonedHour,
    floorToZonedHour,
    getTimeZoneOffset,
    isIsoDate,
    isTimeZone,
    toIsoDate,
    zonedTimeToInstant
} from "@/lib/date/zoned";

describe("dates ISO", () => {
    it("refuse les dates inexistantes", () => {
        expect(isIsoDate("2026-02-29")).toBe(false);
        expect(isIsoDate("2028-02-29")).toBe(true);
        expect(isIsoDate("2026-13-01")).toBe(false);
        expect(isIsoDate("26-10-24")).toBe(false);
    });

    it("ajoute des jours en franchissant les mois et les années", () => {
        expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
        expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    });
});

describe("fuseaux horaires", () => {
    it("reconnaît les fuseaux IANA valides", () => {
        expect(isTimeZone("Europe/Paris")).toBe(true);
        expect(isTimeZone("Mars/Olympus_Mons")).toBe(false);
    });

    it("calcule le décalage été comme hiver", () => {
        expect(getTimeZoneOffset(new Date("2026-07-01T12:00:00Z"), "Europe/Paris")).toBe(2 * 3_600_000);
        expect(getTimeZoneOffset(new Date("2026-01-01T12:00:00Z"), "Europe/Paris")).toBe(3_600_000);
    });

    it("convertit une heure locale en instant UTC", () => {
        expect(zonedTimeToInstant("2026-07-01", 12, "Europe/Paris").toISOString()).toBe("2026-07-01T10:00:00.000Z");
        expect(zonedTimeToInstant("2026-01-01", 12, "America/New_York").toISOString()).toBe("2026-01-01T17:00:00.000Z");
        expect(zonedTimeToInstant("2026-03-29", 12, "Europe/Paris").toISOString()).toBe("2026-03-29T10:00:00.000Z");
    });

    it("donne la date locale d'un instant", () => {
        expect(toIsoDate(new Date("2026-10-24T23:30:00Z"), "Europe/Paris")).toBe("2026-10-25");
        expect(toIsoDate(new Date("2026-10-24T23:30:00Z"), "UTC")).toBe("2026-10-24");
    });

    it("arrondit à l'heure locale, y compris pour un décalage non entier", () => {
        const instant = new Date("2026-10-24T18:20:00Z");
        expect(floorToZonedHour(instant, "Asia/Kolkata").toISOString()).toBe("2026-10-24T17:30:00.000Z");
        expect(ceilToZonedHour(instant, "Europe/Paris").toISOString()).toBe("2026-10-24T19:00:00.000Z");
    });
});

describe("formatage", () => {
    it("formate les dates et heures en français", () => {
        expect(formatLongDate("2026-10-24")).toBe("samedi 24 octobre 2026");
        expect(formatTime(new Date("2026-10-24T19:05:00Z"), "Europe/Paris")).toBe("21:05");
    });

    it("formate les durées", () => {
        expect(formatDuration(45 * 60_000)).toBe("45 min");
        expect(formatDuration(3 * 3_600_000)).toBe("3 h");
        expect(formatDuration(5 * 3_600_000 + 5 * 60_000)).toBe("5 h 05");
    });
});
