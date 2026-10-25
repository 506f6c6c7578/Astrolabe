import type { APIRoute } from "astro";
import { createLogoSvg, favicon } from "@/lib/brand";

export const GET: APIRoute = () =>
    new Response(createLogoSvg({ size: 64, radius: favicon.radius }),
        { headers: { "Content-Type": "image/svg+xml" } });
