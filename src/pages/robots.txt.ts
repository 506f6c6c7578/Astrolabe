import type { APIRoute } from "astro";
import { pages, site } from "@/data/site";

export const GET: APIRoute = () =>
    new Response([
        "User-agent: *",
        "Allow: /",
        `Disallow: ${pages.night}`,
        "Disallow: /api/",
        "",
        `Sitemap: ${new URL("/sitemap-index.xml", site.url).href}`,
        ""
    ].join("\n"), {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
