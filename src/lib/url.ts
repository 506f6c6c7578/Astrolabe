import { site } from "@/data/site";

export function getPagePath(url: URL): string {
    return url.pathname.replace(/(?:\/index)?\.html$/, "") || "/";
}

export function getPageUrl(url: URL): string {
    return new URL(getPagePath(url), site.url).href;
}
