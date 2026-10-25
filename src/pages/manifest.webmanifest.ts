import type { APIRoute } from "astro";
import { site } from "@/data/site";
import { brandColors, iconSizes } from "@/lib/brand";

export const GET: APIRoute = () =>
    Response.json({
        name: site.title,
        short_name: site.name,
        description: site.description,
        lang: site.lang,
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: brandColors.body,
        theme_color: brandColors.body,
        icons: iconSizes.flatMap((size) =>
            ["any", "maskable"].map((purpose) => ({
                src: `/icons/${size}.png`,
                sizes: `${size}x${size}`,
                type: "image/png",
                purpose
            }))
        )
    });
