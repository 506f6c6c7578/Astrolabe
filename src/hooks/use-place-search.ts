import { useEffect, useState } from "react";
import { endpoints } from "@/data/site";
import { type Place, placesResponseSchema, placeSearchSchema } from "@/lib/validation/place";

export type PlaceSearchStatus = "idle" | "loading" | "success" | "error";

const searchDelay = 250;

export function usePlaceSearch(query: string) {
    const [places, setPlaces] = useState<readonly Place[]>([]);
    const [status, setStatus] = useState<PlaceSearchStatus>("idle");

    useEffect(() => {
        const search = placeSearchSchema.safeParse(query);
        if (!search.success) {
            setPlaces([]);
            setStatus("idle");
            return;
        }

        const controller = new AbortController();
        setStatus("loading");
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`${endpoints.places}?${new URLSearchParams({ q: search.data })}`, {
                    signal: controller.signal,
                    headers: { Accept: "application/json" }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data: unknown = await response.json();
                setPlaces(placesResponseSchema.parse(data).places);
                setStatus("success");
            } catch {
                if (controller.signal.aborted) return;
                setPlaces([]);
                setStatus("error");
            }
        }, searchDelay);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return { places, status };
}
