import { Check, History, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loading } from "@/components/ui/loading";
import { recentPlaces, useFavorites } from "@/hooks/use-favorites";
import { type PlaceSearchStatus, usePlaceSearch } from "@/hooks/use-place-search";
import { getPlaceLabel, type Place } from "@/lib/validation/place";
import { cn } from "cn";

interface PlaceResultsProps {
    value: Place | null;
    onSelect: (place: Place) => void;
}

interface RecentPlacesProps {
    places: readonly Place[];
    onSelect: (place: Place) => void;
    onRemove: (place: Place) => void;
}

const emptyMessages: Record<Exclude<PlaceSearchStatus, "loading">, string> = {
    idle: "Saisis au moins deux caractères.",
    success: "Aucun lieu trouvé. Essaie une autre orthographe ou une ville proche.",
    error: "La recherche de lieux est momentanément indisponible."
};

function getPlaceKey({ latitude, longitude }: Place): string {
    return `${latitude},${longitude}`;
}

function PlaceName({ place }: { place: Place }) {
    return (
        <span className="grid min-w-0">
            <span className="truncate font-medium text-foreground">{place.name}</span>
            {place.region && <span className="truncate text-xs text-muted-foreground">{place.region}</span>}
        </span>
    );
}

function RecentPlaces({ places, onSelect, onRemove }: RecentPlacesProps) {
    const headingId = useId();

    return (
        <div role="group" aria-labelledby={headingId} className="p-1" onKeyDown={(event) => event.stopPropagation()}>
            <p id={headingId} className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Recherches récentes</p>
            <ul className="grid">
                {places.map((place) => (
                    <li key={recentPlaces.identify(place)} className="flex items-center gap-1 rounded-sm pr-1 transition-colors hover:bg-muted">
                        <button type="button" onClick={() => onSelect(place)}
                                className="flex min-w-0 grow cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                            <History className="size-4 shrink-0 text-muted-foreground" aria-hidden="true"/>
                            <PlaceName place={place}/>
                        </button>
                        <Button variant="ghost" size="icon-xs" aria-label={`Retirer ${getPlaceLabel(place)} des recherches récentes`}
                                onClick={() => onRemove(place)}>
                            <X aria-hidden="true"/>
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function PlaceResults({ value, onSelect }: PlaceResultsProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const { places, status } = usePlaceSearch(query);
    const { items: recents } = useFavorites(recentPlaces);
    const selectedKey = value ? getPlaceKey(value) : null;
    const showRecents = status === "idle" && recents.length > 0;

    const choose = (place: Place) => {
        recentPlaces.add(place);
        onSelect(place);
    };

    const forget = (place: Place) => {
        recentPlaces.remove(place);
        inputRef.current?.focus();
    };

    return (
        <Command shouldFilter={false} label="Rechercher un lieu">
            <CommandInput ref={inputRef} autoFocus value={query} onValueChange={setQuery} placeholder="Rechercher un lieu..." maxLength={100}/>
            {showRecents && <RecentPlaces places={recents} onSelect={choose} onRemove={forget}/>}
            <CommandList>
                {status === "loading"
                    ? <Loading label="Recherche en cours..." className="justify-start px-3 py-2.5"/>
                    : !showRecents && <CommandEmpty>{emptyMessages[status]}</CommandEmpty>}
                {places.length > 0 && (
                    <CommandGroup heading="Lieux">
                        {places.map((place) => (
                            <CommandItem key={getPlaceKey(place)} value={getPlaceKey(place)} onSelect={() => choose(place)}>
                                <PlaceName place={place}/>
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
