import { site } from "@/data/site";

export const brandColors = {
    primary: "#121212",
    body: "#f6f6f6",
    surface: "#ffffff",
    darkBody: "#1c1c1c",
    text: "#444444",
    textDark: "#040404",
    textLight: "#6b6b6b",
    accent: "#4338ca"
} as const;

export const iconSizes = [180, 192, 512] as const;

export const favicon = { radius: 16, icoSize: 48 } as const;

export const ogImage = {
    path: "/og.png",
    width: 1200,
    height: 630,
    alt: `${site.name}, ${site.tagline}`
} as const;

export function createLogoMark(color: string): string {
    return `<circle cx="32" cy="32" r="17" fill="none" stroke="${color}" stroke-width="4"/><path d="M20 44 44 20" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4.5" fill="${color}"/><circle cx="32" cy="11" r="3" fill="${color}"/>`;
}

const xmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
};

function escapeXml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => xmlEntities[character] ?? character);
}

export function createLogoSvg({ size, radius }: { size: number; radius: number }): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="${brandColors.primary}"/>${createLogoMark(brandColors.surface)}</svg>`;
}

export function createOgImageSvg(illustration: string): string {
    const { width, height } = ogImage;
    const fontFamily = "Signika, Heebo, Roboto, 'Segoe UI', Helvetica, Arial, sans-serif";
    const illustrationUri = `data:image/svg+xml;base64,${Buffer.from(illustration).toString("base64")}`;
    const taglineLines = site.tagline.split(/(?<=,) /);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${brandColors.surface}"/>
  <rect x="${width - 480}" width="480" height="${height}" fill="${brandColors.body}"/>
  <image x="${width - 460}" y="${(height - 330) / 2}" width="440" height="330" href="${illustrationUri}"/>
  <svg x="96" y="96" width="88" height="88" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brandColors.primary}"/>${createLogoMark(brandColors.surface)}</svg>
  <text x="96" y="330" font-family="${fontFamily}" font-size="92" font-weight="700" fill="${brandColors.textDark}">${escapeXml(site.name)}</text>
  ${taglineLines.map((line, index) => `<text x="96" y="${400 + index * 42}" font-family="${fontFamily}" font-size="30" font-weight="600" fill="${brandColors.text}">${escapeXml(line)}</text>`).join("")}
  <text x="96" y="540" font-family="${fontFamily}" font-size="28" fill="${brandColors.textLight}">${escapeXml(new URL(site.url).host)}</text>
  <rect y="${height - 10}" width="${width}" height="10" fill="${brandColors.accent}"/>
</svg>`;
}
