import { ChevronsUpDown, MapPin } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPlaceLabel, type Place } from "@/lib/validation/place";
import { cn } from "cn";

interface PlaceSearchProps {
    id: string;
    value: Place | null;
    invalid: boolean;
    onChange: (place: Place) => void;
}

const loadResults = () => import("@/components/astronomy/place-results");
const PlaceResults = lazy(loadResults);

export function PlaceSearch({ id, value, invalid, onChange }: PlaceSearchProps) {
    const [open, setOpen] = useState(false);

    const select = (place: Place) => {
        onChange(place);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button id={id} variant="outline" size="field" role="combobox" aria-expanded={open} aria-invalid={invalid || undefined}
                        onPointerEnter={loadResults} onFocus={loadResults}>
                    <span className={cn("flex min-w-0 items-center gap-2", !value && "text-muted-foreground")}>
                        <MapPin className="text-muted-foreground" aria-hidden="true"/>
                        <span className="truncate">{value ? getPlaceLabel(value) : "Ville, village ou site d'observation"}</span>
                    </span>
                    <ChevronsUpDown className="text-muted-foreground" aria-hidden="true"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
                <Suspense fallback={<Loading label="Chargement..." className="h-24"/>}>
                    <PlaceResults value={value} onSelect={select}/>
                </Suspense>
            </PopoverContent>
        </Popover>
    );
}
