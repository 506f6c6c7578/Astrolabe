import type { APIRoute } from "astro";
import illustration from "@/assets/illustrations/observation.svg?raw";
import { createOgImageSvg } from "@/lib/brand";
import { renderPng } from "@/lib/png";

export const GET: APIRoute = () => renderPng(createOgImageSvg(illustration));
