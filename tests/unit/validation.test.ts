import { describe, expect, it } from "vitest";
import {
    favoriteObjectsSchema,
    favoritePlacesSchema,
    parseStoredList
} from "@/lib/validation/favorites";
import { createNightPath, parseNightQuery } from "@/lib/validation/night-query";
import { getPlaceLabel, placeSchema } from "@/lib/validation/place";

const lyon = { name: "Lyon", region: "Auvergne-Rhône-Alpes, France", latitude: 45.764, longitude: 4.8357, timeZone: "Europe/Paris" };

describe("paramètres de la nuit", () => {
    it("distingue une requête vide", () => {
        expect(parseNightQuery(new URLSearchParams())).toEqual({ kind: "empty" });
        expect(parseNightQuery(new URLSearchParams("lieu=&date="))).toEqual({ kind: "empty" });
    });

    it("lit un lieu par coordonnées et fait l'aller-retour avec l'URL générée", () => {
        const path = createNightPath(lyon, "2026-10-24");
        const query = parseNightQuery(new URL(path, "https://exemple.fr").searchParams);
        expect(query).toEqual({
            kind: "place",
            place: { ...lyon, latitude: 45.764, longitude: 4.8357 },
            date: "2026-10-24"
        });
    });

    it("donne un nom par défaut aux coordonnées anonymes", () => {
        const query = parseNightQuery(new URLSearchParams("lat=10&lon=-20&tz=UTC"));
        expect(query.kind === "place" && query.place.name).toBe("Position personnalisée");
    });

    it("lit une recherche textuelle", () => {
        expect(parseNightQuery(new URLSearchParams("lieu=  Lyon  &date=2026-10-24")))
            .toEqual({ kind: "search", search: "Lyon", date: "2026-10-24" });
    });

    it.each([
        "lat=91&lon=0&tz=UTC",
        "lat=45&lon=181&tz=UTC",
        "lat=45&lon=2&tz=Nowhere/City",
        "lat=1e2&lon=2&tz=UTC",
        "lat=45&lon=2&tz=UTC&date=2026-02-30",
        "lat=45&lon=2&tz=UTC&date=3000-01-01",
        "lat=45&tz=UTC",
        "lieu=a",
        "lieu=Lyon%00"
    ])("refuse %s", (search) => {
        expect(parseNightQuery(new URLSearchParams(search))).toEqual({ kind: "invalid" });
    });
});

describe("lieux", () => {
    it("construit un libellé lisible", () => {
        expect(getPlaceLabel(lyon)).toBe("Lyon, Auvergne-Rhône-Alpes, France");
        expect(getPlaceLabel({ ...lyon, region: undefined })).toBe("Lyon");
    });

    it("refuse les caractères de contrôle et les fuseaux inconnus", () => {
        expect(placeSchema.safeParse({ ...lyon, name: "Ly\u0000on" }).success).toBe(false);
        expect(placeSchema.safeParse({ ...lyon, name: " Lyon\n" })).toEqual({ success: true, data: lyon });
        expect(placeSchema.safeParse({ ...lyon, timeZone: "Europe/Atlantis" }).success).toBe(false);
    });
});

describe("favoris stockés", () => {
    it("lit une liste valide", () => {
        expect(parseStoredList(JSON.stringify([lyon]), favoritePlacesSchema)).toEqual([lyon]);
        expect(parseStoredList(JSON.stringify(["m31", "m110"]), favoriteObjectsSchema)).toEqual(["m31", "m110"]);
    });

    it.each([
        null,
        "",
        "{",
        JSON.stringify({ name: "Lyon" }),
        JSON.stringify([{ ...lyon, latitude: 200 }]),
        JSON.stringify(["m0"]),
        JSON.stringify(["m111"]),
        JSON.stringify(["<script>"])
    ])("ignore une donnée corrompue : %s", (raw) => {
        expect(parseStoredList(raw, favoritePlacesSchema)).toEqual([]);
        expect(parseStoredList(raw, favoriteObjectsSchema)).toEqual([]);
    });

    it("refuse une liste trop longue", () => {
        expect(parseStoredList(JSON.stringify(Array.from({ length: 21 }, () => lyon)), favoritePlacesSchema)).toEqual([]);
    });
});
