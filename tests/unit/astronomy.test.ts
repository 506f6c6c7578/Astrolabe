import { Body } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { messierObjects } from "@/data/catalog/messier";

const findObject = (id: string) => messierObjects.find((object) => object.id === id);
import {
    getBestObservationMonth,
    getObservableLatitudes,
    getVisibleDeepSkyObjects
} from "@/domain/astronomy/deep-sky";
import { getMoonEvents, getMoonPhase, getMoonState } from "@/domain/astronomy/moon";
import { getPlanetVisibility, planets } from "@/domain/astronomy/planets";
import { createObserver, getBodyAltitude, getRecommendedInstrument } from "@/domain/astronomy/sky";
import { getDarkness, getSkyPhase } from "@/domain/astronomy/sun";
import { getDarkHours, getNight } from "@/domain/observation/night";
import { getTimeZoneOffset } from "@/lib/date/zoned";

const paris = createObserver({ latitude: 48.8566, longitude: 2.3522 });
const tromso = createObserver({ latitude: 69.6496, longitude: 18.956 });

function toLocalMinutes(instant: Date | null, timeZone: string): number {
    if (!instant) throw new Error("Instant attendu");
    const local = new Date(instant.getTime() + getTimeZoneOffset(instant, timeZone));
    return local.getUTCHours() * 60 + local.getUTCMinutes();
}

describe("Soleil et crépuscules", () => {
    it("classe la hauteur du Soleil en phases du ciel", () => {
        expect(getSkyPhase(10)).toBe("day");
        expect(getSkyPhase(-3)).toBe("civil");
        expect(getSkyPhase(-9)).toBe("nautical");
        expect(getSkyPhase(-15)).toBe("astronomical");
        expect(getSkyPhase(-25)).toBe("night");
    });

    it("augmente l'obscurité linéairement entre -12° et -18°", () => {
        expect(getDarkness(-10)).toBe(0);
        expect(getDarkness(-15)).toBeCloseTo(0.5);
        expect(getDarkness(-30)).toBe(1);
    });

    it("trouve le coucher et la nuit astronomique d'une nuit d'hiver à Paris", () => {
        const night = getNight(paris, "2026-12-21", "Europe/Paris");
        expect(toLocalMinutes(night.sun.sunset, "Europe/Paris")).toBeGreaterThanOrEqual(16 * 60 + 50);
        expect(toLocalMinutes(night.sun.sunset, "Europe/Paris")).toBeLessThanOrEqual(17 * 60 + 5);
        expect(toLocalMinutes(night.sun.sunrise, "Europe/Paris")).toBeGreaterThanOrEqual(8 * 60 + 35);
        expect(toLocalMinutes(night.sun.sunrise, "Europe/Paris")).toBeLessThanOrEqual(8 * 60 + 50);
        const { astronomicalNight } = night;
        expect(astronomicalNight).not.toBeNull();
        const hours = astronomicalNight ? (astronomicalNight.end.getTime() - astronomicalNight.start.getTime()) / 3_600_000 : 0;
        expect(hours).toBeGreaterThan(11);
        expect(hours).toBeLessThan(13);
        expect(getDarkHours(night.samples)).toBeGreaterThan(11);
    });

    it("n'a pas de nuit astronomique à Paris au solstice d'été, mais un ciel en partie sombre", () => {
        const night = getNight(paris, "2026-06-21", "Europe/Paris");
        expect(night.astronomicalNight).toBeNull();
        expect(night.sun.dusk.astronomical).toBeNull();
        expect(getDarkHours(night.samples)).toBeGreaterThan(0.5);
        expect(getDarkHours(night.samples)).toBeLessThan(4);
    });

    it("gère le soleil de minuit et la nuit polaire", () => {
        const summer = getNight(tromso, "2026-06-21", "Europe/Oslo");
        expect(summer.sun.sunset).toBeNull();
        expect(summer.astronomicalNight).toBeNull();
        expect(getDarkHours(summer.samples)).toBe(0);

        const winter = getNight(tromso, "2026-12-21", "Europe/Oslo");
        expect(winter.sun.sunrise).toBeNull();
        expect(winter.astronomicalNight).not.toBeNull();
    });

    it("échantillonne la nuit à pas régulier entre le début et la fin", () => {
        const night = getNight(paris, "2026-10-24", "Europe/Paris");
        expect(night.samples[0]?.time).toEqual(night.start);
        expect(night.samples.at(-1)?.time.getTime()).toBeLessThanOrEqual(night.end.getTime());
        expect(night.start.getTime()).toBeLessThan(night.sun.sunset?.getTime() ?? 0);
        expect(night.end.getTime()).toBeGreaterThan(night.sun.sunrise?.getTime() ?? Infinity);
    });
});

describe("Lune", () => {
    it("nomme les phases à partir de l'angle", () => {
        expect(getMoonPhase(0)).toBe("new");
        expect(getMoonPhase(90)).toBe("first-quarter");
        expect(getMoonPhase(180)).toBe("full");
        expect(getMoonPhase(350)).toBe("new");
    });

    it("trouve une pleine lune presque totalement éclairée", () => {
        const { nextFullMoon, nextNewMoon } = getMoonEvents(paris, new Date("2026-10-01T00:00:00Z"), new Date("2026-10-02T00:00:00Z"));
        expect(nextFullMoon).not.toBeNull();
        expect(nextNewMoon).not.toBeNull();
        if (nextFullMoon) expect(getMoonState(nextFullMoon).illumination).toBeGreaterThan(0.99);
        if (nextNewMoon) expect(getMoonState(nextNewMoon).illumination).toBeLessThan(0.01);
    });
});

describe("planètes et ciel profond", () => {
    it("décrit chaque planète avec une magnitude et une constellation", () => {
        const night = getNight(paris, "2026-10-24", "Europe/Paris");
        const visibilities = planets.map((planet) => getPlanetVisibility(planet, paris, night.samples, night));
        expect(visibilities).toHaveLength(7);
        for (const visibility of visibilities) {
            expect(Number.isFinite(visibility.magnitude)).toBe(true);
            expect(visibility.constellation).toMatch(/^[A-Z][A-Za-z]{2}$/);
            if (visibility.visible) expect(visibility.bestAltitude).toBeGreaterThanOrEqual(10);
        }
    });

    it("liste M31 en automne et pas en été à Paris, triés par magnitude", () => {
        const autumn = getVisibleDeepSkyObjects(messierObjects, paris, getNight(paris, "2026-10-24", "Europe/Paris").samples);
        expect(autumn.some(({ object }) => object.id === "m31")).toBe(true);
        const magnitudes = autumn.map(({ object }) => object.magnitude);
        expect(magnitudes).toEqual([...magnitudes].sort((first, second) => first - second));

        const southernSky = getVisibleDeepSkyObjects(messierObjects, tromso, getNight(tromso, "2026-06-21", "Europe/Oslo").samples);
        expect(southernSky).toEqual([]);
    });

    it("calcule une hauteur cohérente pour le Soleil à midi", () => {
        expect(getBodyAltitude(Body.Sun, new Date("2026-06-21T11:50:00Z"), paris)).toBeGreaterThan(60);
    });

    it("donne le mois d'opposition et les latitudes d'observation", () => {
        const andromeda = findObject("m31");
        const orion = findObject("m42");
        expect(andromeda && getBestObservationMonth(andromeda.rightAscension)).toBe(9);
        expect(orion && getBestObservationMonth(orion.rightAscension)).toBe(11);
        expect(getObservableLatitudes(-60)).toEqual({ min: -90, max: 5 });
    });

    it("recommande un instrument selon la magnitude", () => {
        expect(getRecommendedInstrument(3.4)).toBe("naked-eye");
        expect(getRecommendedInstrument(7)).toBe("binoculars");
        expect(getRecommendedInstrument(10)).toBe("telescope");
    });
});
