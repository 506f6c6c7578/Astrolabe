import { ChevronRight, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { favoritePlaces, useFavorites } from "@/hooks/use-favorites";
import { createNightPath } from "@/lib/validation/night-query";
import { getPlaceLabel } from "@/lib/validation/place";

export function FavoritePlaces() {
    const { items, remove } = useFavorites(favoritePlaces);
    if (items.length === 0) return null;

    return (
        <Card role="region" aria-labelledby="lieux-favoris-titre" className="animate-rise [--card-spacing:--spacing(6)]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="size-4 fill-current text-brand" aria-hidden="true"/>
                    <h2 id="lieux-favoris-titre" className="text-base">Tes lieux favoris</h2>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="stagger grid gap-2 sm:grid-cols-2">
                    {items.map((place) => (
                        <li key={favoritePlaces.identify(place)}
                            className="group flex items-center gap-1 rounded-lg bg-muted pr-1 transition-colors hover:bg-accent">
                            <a href={createNightPath(place)} className="flex min-w-0 grow items-center gap-3 px-3 py-2.5">
                                <span className="grid min-w-0">
                                    <span className="truncate font-semibold text-foreground">{place.name}</span>
                                    {place.region && <span className="truncate text-xs text-muted-foreground">{place.region}</span>}
                                </span>
                                <ChevronRight aria-hidden="true"
                                              className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"/>
                            </a>
                            <Button variant="ghost" size="icon-sm" aria-label={`Retirer ${getPlaceLabel(place)} des favoris`}
                                    onClick={() => remove(place)}>
                                <X aria-hidden="true"/>
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
