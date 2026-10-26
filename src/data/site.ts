export interface NavigationLink {
    label: string;
    href: string;
}

export const site = {
    url: "https://astro.paulviandier.com",
    lang: "fr",
    locale: "fr_FR",
    name: "Astrolabe",
    tagline: "Planifie tes observations, au bon endroit et au bon moment.",
    title: "Astrolabe — Planificateur d'observation astronomique",
    description:
        "Astrolabe t'indique si la nuit est favorable à l'observation : nuit astronomique, crépuscules, phase de la Lune, météo, planètes et objets Messier visibles, meilleurs créneaux et score de qualité.",
    author: {
        name: "Paul Viandier",
        url: "https://paulviandier.com",
        contactUrl: "https://paulviandier.com/contact"
    },
    repository: "https://github.com/506f6c6c7578/Astrolabe"
} as const;

export const pages = {
    home: "/",
    night: "/nuit",
    objects: "/objets",
    legalNotice: "/mentions-legales",
    privacy: "/confidentialite"
} as const;

export const endpoints = {
    places: "/api/lieux"
} as const;

export const navigation: readonly NavigationLink[] = [
    { label: "Planifier", href: pages.home },
    { label: "Objets Messier", href: pages.objects }
];

export const legalLinks = {
    notice: { label: "Mentions légales", href: pages.legalNotice },
    privacy: { label: "Politique de confidentialité", href: pages.privacy }
} as const satisfies Record<string, NavigationLink>;

export const credits: readonly NavigationLink[] = [
    { label: "Météo et géocodage : Open-Meteo (CC BY 4.0)", href: "https://open-meteo.com" },
    { label: "Calculs : Astronomy Engine", href: "https://github.com/cosinekitty/astronomy" },
    { label: "Code source sur GitHub", href: site.repository }
];
