import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { favoriteObjects, favoritePlaces, type FavoriteStore, useFavorites } from "@/hooks/use-favorites";
import type { Place } from "@/lib/validation/place";
import { cn } from "cn";

type FavoriteToggleProps = { place: Place } | { objectId: string };

export function getFavoriteActionLabel(active: boolean): string {
    return active ? "Retirer des favoris" : "Ajouter aux favoris";
}

function FavoriteButton<Item>({ store, item }: { store: FavoriteStore<Item>; item: Item }) {
    const { ready, has, toggle } = useFavorites(store);
    if (!ready) return <Skeleton className="h-9 w-44 rounded-lg"/>;

    const active = has(item);

    return (
        <Button variant="outline" size="lg" aria-pressed={active} onClick={() => toggle(item)}>
            <Star className={cn("transition-transform duration-300", active && "scale-110 fill-current text-brand")}
                  aria-hidden="true"/>
            {getFavoriteActionLabel(active)}
        </Button>
    );
}

export function FavoriteToggle(props: FavoriteToggleProps) {
    return "place" in props
        ? <FavoriteButton store={favoritePlaces} item={props.place}/>
        : <FavoriteButton store={favoriteObjects} item={props.objectId}/>;
}
