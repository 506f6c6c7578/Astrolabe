import { Check } from "lucide-react";
import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loading } from "@/components/ui/loading";
import { type PlaceSearchStatus, usePlaceSearch } from "@/hooks/use-place-search";
import type { Place } from "@/lib/validation/place";
import { cn } from "cn";

interface PlaceResultsProps {
    value: Place | null;
    onSelect: (place: Place) => void;
}

const emptyMessages: Record<Exclude<PlaceSearchStatus, "loading">, string> = {
    idle: "Saisis au moins deux caractères.",
    success: "Aucun lieu trouvé. Essaie une autre orthographe ou une ville proche.",
    error: "La recherche de lieux est momentanément indisponible."
};

function getPlaceKey({ latitude, longitude }: Place): string {
    return `${latitude},${longitude}`;
}

export default function PlaceResults({ value, onSelect }: PlaceResultsProps) {
    const [query, setQuery] = useState("");
    const { places, status } = usePlaceSearch(query);
    const selectedKey = value ? getPlaceKey(value) : null;

    return (
        <Command shouldFilter={false} label="Rechercher un lieu">
            <CommandInput value={query} onValueChange={setQuery} placeholder="Rechercher un lieu..." maxLength={100}/>
            <CommandList>
                {status === "loading"
                    ? <Loading label="Recherche en cours..." className="justify-start px-3 py-2.5"/>
                    : <CommandEmpty>{emptyMessages[status]}</CommandEmpty>}
                {places.length > 0 && (
                    <CommandGroup heading="Lieux">
                        {places.map((place) => (
                            <CommandItem key={getPlaceKey(place)} value={getPlaceKey(place)} onSelect={() => onSelect(place)}>
                                <span className="grid min-w-0">
                                    <span className="truncate font-medium text-foreground">{place.name}</span>
                                    {place.region && <span className="truncate text-xs text-muted-foreground">{place.region}</span>}
                                </span>
                                <Check aria-hidden="true"
                                       className={cn("ml-auto", selectedKey === getPlaceKey(place) ? "opacity-100" : "opacity-0")}/>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </Command>
    );
}
