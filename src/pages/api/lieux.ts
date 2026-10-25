import type { APIRoute } from "astro";
import { placeSearchSchema } from "@/lib/validation/place";
import { searchPlaces } from "@/services/geocoding/open-meteo";

export const prerender = false;

const cacheControl = "public, max-age=86400";

export const GET: APIRoute = async ({ url }) => {
    const query = placeSearchSchema.safeParse(url.searchParams.get("q") ?? "");
    if (!query.success) {
        return Response.json(
            { error: query.error.issues[0]?.message ?? "Recherche invalide." },
            { status: 400, headers: { "Cache-Control": "no-store" } }
        );
    }

    try {
        const places = await searchPlaces(query.data);
        return Response.json({ places }, { headers: { "Cache-Control": cacheControl } });
    } catch (error) {
        console.error("Recherche de lieux indisponible :", error);
        return Response.json(
            { error: "La recherche de lieux est momentanément indisponible." },
            { status: 502, headers: { "Cache-Control": "no-store" } }
        );
    }
};
