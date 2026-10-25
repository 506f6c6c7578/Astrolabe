export function normalizeSearchText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("fr")
        .replace(/\s+/g, " ")
        .trim();
}
