export const objectTypes = {
    galaxy: "Galaxie",
    "globular-cluster": "Amas globulaire",
    "open-cluster": "Amas ouvert",
    "diffuse-nebula": "Nébuleuse diffuse",
    "planetary-nebula": "Nébuleuse planétaire",
    "supernova-remnant": "Rémanent de supernova",
    "star-cloud": "Nuage stellaire",
    "double-star": "Étoile double",
    asterism: "Astérisme"
} as const;

export type ObjectType = keyof typeof objectTypes;
