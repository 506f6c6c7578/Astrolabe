import { Constellation } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { constellations, getConstellationName } from "@/data/catalog/constellations";
import { messierObjects } from "@/data/catalog/messier";

const findObject = (id: string) => messierObjects.find((object) => object.id === id);

describe("catalogue Messier", () => {
    it("contient les 110 objets dans l'ordre", () => {
        expect(messierObjects.map(({ number }) => number))
            .toEqual(Array.from({ length: 110 }, (_, index) => index + 1));
    });

    it.each(messierObjects)("$designation est dans la constellation déclarée", (object) => {
        expect(Constellation(object.rightAscension, object.declination).symbol).toBe(object.constellation);
    });

    it("convertit les coordonnées sexagésimales, y compris les déclinaisons négatives proches de zéro", () => {
        expect(findObject("m2")?.declination).toBeCloseTo(-49 / 60, 6);
        expect(findObject("m31")?.rightAscension).toBeCloseTo(0 + 42.7 / 60, 6);
        expect(findObject("m42")?.declination).toBeCloseTo(-(5 + 27 / 60), 6);
    });

    it("retourne undefined pour un identifiant inconnu", () => {
        expect(findObject("m111")).toBeUndefined();
    });
});

describe("constellations", () => {
    it("couvre les 88 constellations de l'UAI", () => {
        expect(Object.keys(constellations)).toHaveLength(88);
    });

    it("traduit une abréviation et conserve une valeur inconnue", () => {
        expect(getConstellationName("UMa")).toBe("Grande Ourse");
        expect(getConstellationName("Xyz")).toBe("Xyz");
    });
});
