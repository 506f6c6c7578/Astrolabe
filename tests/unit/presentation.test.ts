import { describe, expect, it } from "vitest";
import { toCatalogItem } from "@/components/astronomy/catalog-items";
import { messierObjects } from "@/data/catalog/messier";
import { fromLocalCalendarDate, toLocalCalendarDate } from "@/lib/date/zoned";
import {
    formatCoordinates,
    formatCount,
    formatDeclination,
    formatLatitude,
    formatOptional,
    formatPercentValue,
    formatRightAscension
} from "@/lib/format";
import { themeIllustration } from "@/lib/illustration";
import { normalizeSearchText } from "@/lib/search";
import { resolveNightQuery } from "@/services/astronomy/observation";

const space = " ";

describe("formatage", () => {
    it("formate les coordonnées et les angles", () => {
        expect(formatCoordinates(45.7491, -4.8479)).toBe(`45,749°${space}N, 4,848°${space}O`);
        expect(formatLatitude(-65)).toBe(`65°${space}S`);
        expect(formatLatitude(0)).toBe("0°");
        expect(formatRightAscension(0.7116667)).toBe(`0${space}h${space}42,7${space}min`);
        expect(formatDeclination(-5.45)).toBe(`−5°${space}27′`);
    });

    it("formate les pourcentages, les valeurs absentes et les quantités", () => {
        expect(formatPercentValue(77)).toBe(`77${space}%`);
        expect(formatOptional(null, formatPercentValue)).toBe("—");
        expect(formatCount(1, "objet")).toBe("1 objet");
        expect(formatCount(3, "lieu trouvé", "lieux trouvés")).toBe("3 lieux trouvés");
    });

    it("convertit une date de calendrier sans décalage de fuseau", () => {
        const date = toLocalCalendarDate("2030-01-15");
        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2030, 0, 15]);
        expect(fromLocalCalendarDate(date)).toBe("2030-01-15");
    });

    it("normalise la recherche sans accents ni casse", () => {
        expect(normalizeSearchText("  Galaxie   d'ANDROMÈDE ")).toBe("galaxie d'andromede");
    });
});

describe("présentation du catalogue", () => {
    const andromeda = messierObjects.find(({ id }) => id === "m31");

    it("prépare un objet pour le catalogue interactif", () => {
        if (!andromeda) throw new Error("M31 attendu");
        const item = toCatalogItem(andromeda, {
            bestAltitude: 72.4,
            bestTime: new Date("2026-10-24T21:40:00Z"),
            timeZone: "Europe/Paris"
        });
        expect(item).toMatchObject({
            id: "m31",
            href: "/objets/m31",
            designation: "M31",
            title: "Galaxie d'Andromède",
            details: "Galaxie · Andromède · mag. 3,4",
            instrument: "Œil nu",
            visibility: { time: "23:40", altitude: "72°" }
        });
        expect(item.search).toContain("ngc 224");
        expect(item.search).toContain("andromede");
    });

    it("applique les couleurs du thème à l'illustration sans toucher aux autres attributs", () => {
        const svg = themeIllustration('<svg viewBox="0 0 1 1"><circle fill="#4338CA"/><path stroke="#3a3a3a" fill="none"/><rect fill="#123456"/></svg>');
        expect(svg).toContain('<svg class="h-auto w-full" aria-hidden="true" focusable="false" viewBox');
        expect(svg).toContain('<circle class="fill-brand"/>');
        expect(svg).toContain('<path class="stroke-illustration-ink" fill="none"/>');
        expect(svg).toContain('<rect fill="#123456"/>');
    });
});

describe("résolution de la page de nuit", () => {
    it("redirige vers l'accueil sans paramètre et refuse les paramètres invalides", async () => {
        expect(await resolveNightQuery({ kind: "empty" })).toEqual({ kind: "home" });
        const invalid = await resolveNightQuery({ kind: "invalid" });
        expect(invalid.kind === "failure" && invalid.failure.status).toBe(400);
    });

    it("calcule un rapport sans appel météo hors de portée", async () => {
        const resolution = await resolveNightQuery({
            kind: "place",
            place: { name: "Paris", latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
            date: "1999-08-11"
        });
        expect(resolution.kind).toBe("report");
        if (resolution.kind === "report") {
            expect(resolution.report.date).toBe("1999-08-11");
            expect(resolution.report.weather.status).toBe("out-of-range");
        }
    });
});
