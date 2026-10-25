import type { APIRoute } from "astro";
import { createLogoSvg, favicon } from "@/lib/brand";
import { renderIco } from "@/lib/png";

export const GET: APIRoute = () => renderIco(createLogoSvg({
    size: favicon.icoSize,
    radius: favicon.radius
}), favicon.icoSize);
