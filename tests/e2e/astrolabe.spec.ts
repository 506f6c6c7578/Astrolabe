import { expect, type Page, test } from "@playwright/test";

const lyon = {
    name: "Lyon",
    region: "Auvergne-Rhône-Alpes, France",
    latitude: 45.7491,
    longitude: 4.8479,
    timeZone: "Europe/Paris"
};

const nightPath = "/nuit?lat=45.7491&lon=4.8479&tz=Europe%2FParis&nom=Lyon&region=France&date=2030-01-15";

function trackErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    return errors;
}

async function visit(page: Page, path: string) {
    const response = await page.goto(path);
    await expect(page.locator("astro-island[client='load'][ssr]")).toHaveCount(0);
    return response;
}

async function expectNoHorizontalOverflow(page: Page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("accueil", () => {
    test("présente le planificateur sans erreur ni débordement", async ({ page }) => {
        const errors = trackErrors(page);
        await visit(page, "/");
        await expect(page).toHaveTitle("Astrolabe — Planificateur d'observation astronomique");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Planifie tes observations, au bon endroit et au bon moment.");
        await expect(page.getByRole("button", { name: "Date de la soirée" })).toHaveText(/Ce soir/);
        await expectNoHorizontalOverflow(page);
        expect(errors).toEqual([]);
    });

    test("bascule entre les thèmes clair et sombre", async ({ page }) => {
        await visit(page, "/");
        const switcher = page.getByRole("switch", { name: "Thème sombre" });
        const wasDark = await switcher.getAttribute("aria-checked") === "true";
        await switcher.click();
        await expect(switcher).toHaveAttribute("aria-checked", String(!wasDark));
        await expect(page.locator("html")).toHaveClass(wasDark ? /^(?!.*dark)/ : /dark/);
    });

    test("affiche le thème sombre sans animer l'interrupteur au chargement", async ({ page }) => {
        await page.emulateMedia({ colorScheme: "dark" });
        await page.addInitScript(() => addEventListener("transitionrun", (event) => {
            if (event.target instanceof Element && event.target.closest("[data-theme-switcher]")) {
                sessionStorage.setItem("theme-switcher-transition", event.propertyName);
            }
        }, true));
        await visit(page, "/");
        await page.reload();
        await expect(page.getByRole("switch", { name: "Thème sombre" })).toHaveAttribute("aria-checked", "true");
        expect(await page.evaluate(() => sessionStorage.getItem("theme-switcher-transition"))).toBeNull();
    });

    test("recherche un lieu, choisit une date au calendrier puis ouvre la nuit", async ({ page }) => {
        await page.route("**/api/lieux?**", (route) => route.fulfill({ json: { places: [lyon] } }));
        await visit(page, "/");
        await page.getByRole("combobox", { name: "Lieu d'observation" }).click();
        await page.getByPlaceholder("Rechercher un lieu...").fill("Lyo");
        await expect(page.getByRole("option", { name: /Lyon/ })).toBeVisible();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("combobox", { name: "Lieu d'observation" })).toHaveText(/Lyon, Auvergne-Rhône-Alpes, France/);

        await page.getByRole("button", { name: "Date de la soirée" }).click();
        await page.getByRole("button", { name: "Choisir l'année" }).click();
        await expect(page.getByRole("menuitemradio", { name: String(new Date().getFullYear()) })).toBeFocused();
        await page.getByRole("menuitemradio", { name: "2030" }).click();
        await page.getByRole("button", { name: "Choisir le mois" }).click();
        await page.getByRole("menuitemradio", { name: "janv." }).click();
        await page.getByRole("button", { name: /15 janvier 2030/ }).click();
        await expect(page.getByRole("button", { name: "Date de la soirée" })).toHaveText(/mardi 15 janvier 2030/);

        await page.getByRole("button", { name: "Analyser la nuit" }).click();
        await expect(page).toHaveURL(/\/nuit\?lat=45\.7491&lon=4\.8479&tz=Europe%2FParis&nom=Lyon.*&date=2030-01-15$/);
        await expect(page.getByRole("heading", { level: 1, name: "Lyon" })).toBeVisible();
    });

    test("signale une recherche sans résultat et un lieu manquant", async ({ page }) => {
        await page.route("**/api/lieux?**", (route) => route.fulfill({ json: { places: [] } }));
        await visit(page, "/");
        await page.getByRole("button", { name: "Analyser la nuit" }).click();
        await expect(page.getByText("Choisis d'abord un lieu d'observation.")).toBeVisible();
        await page.getByRole("combobox", { name: "Lieu d'observation" }).click();
        await page.getByPlaceholder("Rechercher un lieu...").fill("Xyzzy");
        await expect(page.getByText(/Aucun lieu trouvé/)).toBeVisible();
    });

    test("ignore des favoris corrompus", async ({ page }) => {
        const errors = trackErrors(page);
        await page.addInitScript(() => localStorage.setItem("astrolabe:lieux-favoris", "{\"<script>\":1"));
        await visit(page, "/");
        await expect(page.getByRole("region", { name: "Tes lieux favoris" })).toHaveCount(0);
        expect(errors).toEqual([]);
    });
});

test.describe("rapport de nuit", () => {
    test("affiche toutes les sections, sans météo hors de portée", async ({ page }) => {
        const errors = trackErrors(page);
        const response = await visit(page, nightPath);
        expect(response?.status()).toBe(200);
        await expect(page.getByText("Nuit du mardi 15 janvier au mercredi 16 janvier 2030")).toBeVisible();
        for (const name of ["Qualité de la nuit", "Soleil et crépuscules", "Lune", "Météo", "Déroulé de la nuit", "Meilleurs créneaux", "Planètes", "Objets Messier visibles"]) {
            await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
        }
        await expect(page.getByText("Score calculé sans météo")).toBeVisible();
        await expect(page.getByRole("region", { name: "Planètes" }).locator("tbody tr")).toHaveCount(7);
        await page.getByRole("heading", { name: "Objets Messier visibles" }).scrollIntoViewIfNeeded();
        await expect(page.getByRole("link", { name: /M42/ })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(errors).toEqual([]);
    });

    test("permet d'explorer le graphique au clavier", async ({ page }) => {
        await visit(page, nightPath);
        const chart = page.getByRole("group", { name: /Graphique explorable/ });
        await chart.focus();
        const tooltip = page.locator("[data-chart-tooltip]");
        await expect(tooltip).toBeVisible();
        const first = await tooltip.textContent();
        await chart.press("ArrowRight");
        await expect(tooltip).not.toHaveText(first ?? "");
        await chart.press("Escape");
        await expect(tooltip).toBeHidden();
    });

    test("enregistre le lieu en favori et le propose sur l'accueil", async ({ page }) => {
        await visit(page, nightPath);
        await page.getByRole("button", { name: "Ajouter aux favoris" }).click();
        await expect(page.getByRole("button", { name: "Retirer des favoris" })).toHaveAttribute("aria-pressed", "true");
        await visit(page, "/");
        const favorites = page.getByRole("region", { name: "Tes lieux favoris" });
        await expect(favorites.getByRole("link", { name: /Lyon/ })).toBeVisible();
        await favorites.getByRole("button", { name: /Retirer Lyon/ }).click();
        await expect(favorites).toHaveCount(0);
    });

    test("ouvre le formulaire de modification prérempli", async ({ page }) => {
        await visit(page, nightPath);
        await expect(page.locator("main header astro-island[ssr]")).toHaveCount(0);
        await page.getByRole("button", { name: "Changer de lieu ou de date" }).click();
        await expect(page.getByRole("combobox", { name: "Lieu d'observation" })).toHaveText(/Lyon, France/);
        await expect(page.getByRole("button", { name: "Date de la soirée" })).toHaveText(/mardi 15 janvier 2030/);
    });

    test("refuse des paramètres invalides", async ({ page }) => {
        const response = await page.goto("/nuit?lat=120&lon=4&tz=Europe/Paris");
        expect(response?.status()).toBe(400);
        await expect(page.getByRole("heading", { level: 1, name: "Paramètres invalides" })).toBeVisible();
    });

    test("renvoie vers l'accueil sans paramètre", async ({ page }) => {
        await page.goto("/nuit");
        await expect(page).toHaveURL(/\/$/);
    });
});

test.describe("catalogue Messier", () => {
    test("filtre les objets et gère les favoris", async ({ page }) => {
        const errors = trackErrors(page);
        const count = page.getByText(/^\d+ objets?$/);
        await visit(page, "/objets");
        await expect(count).toHaveText("110 objets");
        await expect(page.locator("[data-slot='skeleton']")).toHaveCount(0);
        await page.getByLabel("Rechercher").fill("androme");
        await expect(count).toHaveText("3 objets");
        await page.getByLabel("Rechercher").fill("");
        await page.getByLabel("Type d'objet").click();
        await page.getByRole("menuitemradio", { name: "Nébuleuse planétaire" }).click();
        await expect(page.getByLabel("Type d'objet")).toHaveText("Nébuleuse planétaire");
        await expect(count).toHaveText("4 objets");

        await visit(page, "/objets/m57");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("M57 · Nébuleuse de la Lyre");
        await page.getByRole("button", { name: "Ajouter aux favoris" }).click();
        await visit(page, "/objets");
        await page.getByRole("button", { name: "Mes favoris uniquement" }).click();
        await expect(count).toHaveText("1 objet");
        await expect(page.getByRole("link", { name: /M57/ })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(errors).toEqual([]);
    });
});

test.describe("menu contextuel des objets", () => {
    test("ajoute puis retire un objet des favoris", async ({ page }) => {
        const errors = trackErrors(page);
        await visit(page, "/objets");
        const card = page.getByRole("link", { name: /^M57/ });
        await card.click({ button: "right" });
        await page.getByRole("menuitem", { name: "Ajouter aux favoris" }).click();
        await expect(card.getByText("Favori")).toBeVisible();
        await expect(page).toHaveURL(/\/objets$/);
        await card.click({ button: "right" });
        await page.getByRole("menuitem", { name: "Retirer des favoris" }).click();
        await expect(card.getByText("Favori")).toHaveCount(0);
        expect(errors).toEqual([]);
    });
});

test.describe("pages légales", () => {
    for (const title of ["Mentions légales", "Politique de confidentialité"]) {
        test(`ouvre ${title.toLowerCase()} depuis le pied de page`, async ({ page }) => {
            const errors = trackErrors(page);
            await visit(page, "/");
            await page.getByRole("navigation", { name: "Informations légales" }).getByRole("link", { name: title }).click();
            await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
            await expectNoHorizontalOverflow(page);
            expect(errors).toEqual([]);
        });
    }
});

test.describe("API", () => {
    test("valide la recherche de lieux", async ({ request }) => {
        const response = await request.get("/api/lieux?q=a");
        expect(response.status()).toBe(400);
        expect(await response.json()).toEqual({ error: "Saisis au moins deux caractères." });
    });
});
