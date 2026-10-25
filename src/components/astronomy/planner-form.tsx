import { LocateFixed, Telescope } from "lucide-react";
import { type SubmitEvent, useId, useState } from "react";
import { DatePicker } from "@/components/astronomy/date-picker";
import { PlaceSearch } from "@/components/astronomy/place-search";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { IsoDate } from "@/lib/date/zoned";
import { createNightPath } from "@/lib/validation/night-query";
import { type Place, placeSchema } from "@/lib/validation/place";

interface PlannerFormProps {
    place?: Place;
    date?: IsoDate;
}

const coordinateDigits = 3;

const messages = {
    hint: "Recherche un lieu ou utilise ta position.",
    missingPlace: "Choisis d'abord un lieu d'observation.",
    locating: "Localisation en cours...",
    denied: "Impossible d'obtenir ta position. Vérifie l'autorisation de géolocalisation."
} as const;

function toCurrentPlace({ latitude, longitude }: GeolocationCoordinates) {
    return placeSchema.safeParse({
        name: "Ma position",
        region: `${latitude.toFixed(coordinateDigits)}, ${longitude.toFixed(coordinateDigits)}`,
        latitude: Number(latitude.toFixed(coordinateDigits)),
        longitude: Number(longitude.toFixed(coordinateDigits)),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
}

export function PlannerForm({ place, date }: PlannerFormProps) {
    const id = useId();
    const [selected, setSelected] = useState<Place | null>(place ?? null);
    const [day, setDay] = useState<IsoDate | undefined>(date);
    const [message, setMessage] = useState<string>(messages.hint);
    const [invalid, setInvalid] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const choose = (next: Place) => {
        setSelected(next);
        setInvalid(false);
        setMessage(messages.hint);
    };

    const locate = () => {
        if (!("geolocation" in navigator)) return setMessage(messages.denied);
        setMessage(messages.locating);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const current = toCurrentPlace(coords);
                if (current.success) choose(current.data);
                else setMessage(messages.denied);
            },
            () => setMessage(messages.denied),
            { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 }
        );
    };

    const submit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selected) {
            setInvalid(true);
            setMessage(messages.missingPlace);
            return;
        }
        setSubmitting(true);
        window.location.assign(createNightPath(selected, day));
    };

    return (
        <form className="grid gap-5 md:grid-cols-[2fr_1fr] md:items-start" onSubmit={submit} noValidate>
            <div className="grid gap-2">
                <Label htmlFor={`${id}-lieu`} className="text-sm font-semibold text-foreground">Lieu d'observation</Label>
                <PlaceSearch id={`${id}-lieu`} value={selected} invalid={invalid} onChange={choose}/>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground data-[invalid=true]:text-destructive" aria-live="polite"
                       data-invalid={invalid}>
                        {message}
                    </p>
                    <Button type="button" variant="ghost" size="sm" onClick={locate}>
                        <LocateFixed aria-hidden="true"/>
                        Utiliser ma position
                    </Button>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${id}-date`} className="text-sm font-semibold text-foreground">Date de la soirée</Label>
                <DatePicker id={`${id}-date`} value={day} onChange={setDay}/>
            </div>
            <Button type="submit" size="lg" disabled={submitting}
                    className="h-11 justify-self-start px-5 text-base md:col-span-2 md:text-sm">
                <Telescope aria-hidden="true"/>
                Analyser la nuit
            </Button>
        </form>
    );
}
