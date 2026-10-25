import { ArrowUpRight, Search, Star, StarOff } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { CatalogItem } from "@/components/astronomy/catalog-items";
import { getFavoriteActionLabel } from "@/components/astronomy/favorite-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectMenu, type SelectMenuOption } from "@/components/ui/select-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { objectTypes, type ObjectType } from "@/data/catalog/object-types";
import { favoriteObjects, useFavorites } from "@/hooks/use-favorites";
import { formatCount } from "@/lib/format";
import { normalizeSearchText } from "@/lib/search";

interface ObjectCatalogProps {
    items: readonly CatalogItem[];
    preview?: number;
}

interface ObjectCardProps {
    item: CatalogItem;
    favorite: boolean;
    onToggleFavorite: () => void;
}

interface CatalogResultsProps {
    matches: readonly CatalogItem[];
    limit: number;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (id: string) => void;
    onExpand: () => void;
}

type TypeFilter = ObjectType | "";

const typeOrder = Object.keys(objectTypes);
const allTypes: SelectMenuOption<TypeFilter> = { value: "", label: "Tous les types" };
const gridClassName = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-4";
const maxPlaceholders = 12;

function ObjectCard({ item, favorite, onToggleFavorite }: ObjectCardProps) {
    const FavoriteIcon = favorite ? StarOff : Star;

    return (
        <li className="animate-rise">
            <ContextMenu modal={false}>
                <ContextMenuTrigger asChild>
                    <a href={item.href}
                       className="group grid h-full content-start justify-items-start gap-1 rounded-xl border bg-card p-5 transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-lg hover:shadow-black/5 data-[state=open]:border-foreground/25">
                        <span className="flex w-full items-center justify-between gap-2">
                            <span className="font-heading text-xl font-bold text-foreground">{item.designation}</span>
                            {favorite
                                ? <Badge variant="brand"><Star className="fill-current" aria-hidden="true"/>Favori</Badge>
                                : <ArrowUpRight aria-hidden="true"
                                                className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>}
                        </span>
                        <span className="font-semibold text-foreground">{item.title}</span>
                        <span className="text-sm">{item.details}</span>
                        {item.visibility && (
                            <span className="text-sm">
                                Au plus haut à <strong className="text-brand tabular-nums">{item.visibility.time}</strong>, {item.visibility.altitude}
                            </span>
                        )}
                        <Badge variant="outline" className="mt-2">{item.instrument}</Badge>
                    </a>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onSelect={onToggleFavorite}>
                        <FavoriteIcon aria-hidden="true"/>
                        {getFavoriteActionLabel(favorite)}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </li>
    );
}

function CatalogSkeleton({ count }: { count: number }) {
    return (
        <ul className={gridClassName} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <li key={index} className="grid content-start gap-2.5 rounded-xl border bg-card p-5">
                    <Skeleton className="h-6 w-12"/>
                    <Skeleton className="h-5 w-3/4"/>
                    <Skeleton className="h-4 w-full"/>
                    <Skeleton className="mt-1.5 h-5 w-20 rounded-full"/>
                </li>
            ))}
        </ul>
    );
}

function CatalogResults({ matches, limit, isFavorite, onToggleFavorite, onExpand }: CatalogResultsProps) {
    if (matches.length === 0) {
        return <p className="rounded-xl border border-dashed p-8 text-center">Aucun objet ne correspond à ces filtres.</p>;
    }

    return (
        <>
            <ul className={gridClassName}>
                {matches.slice(0, limit).map((item) => (
                    <ObjectCard key={item.id} item={item} favorite={isFavorite(item.id)} onToggleFavorite={() => onToggleFavorite(item.id)}/>
                ))}
            </ul>
            {limit < matches.length && (
                <Button variant="outline" size="lg" className="justify-self-center" onClick={onExpand}>
                    Afficher les {matches.length} objets
                </Button>
            )}
        </>
    );
}

export function ObjectCatalog({ items, preview }: ObjectCatalogProps) {
    const id = useId();
    const { ready, has, toggle } = useFavorites(favoriteObjects);
    const [query, setQuery] = useState("");
    const [type, setType] = useState<TypeFilter>("");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const typeOptions = useMemo(() => [allTypes, ...[...new Set(items.map((item) => item.type))]
        .sort((first, second) => typeOrder.indexOf(first) - typeOrder.indexOf(second))
        .map((option) => ({ value: option, label: objectTypes[option] }))], [items]);

    const normalizedQuery = normalizeSearchText(query);
    const filtering = normalizedQuery !== "" || type !== "" || favoritesOnly;
    const matches = items.filter((item) => item.search.includes(normalizedQuery) &&
        (type === "" || item.type === type) &&
        (!favoritesOnly || has(item.id)));
    const limit = preview && !expanded && !filtering ? preview : matches.length;

    return (
        <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-[2fr_1.5fr_auto] md:items-end">
                <div className="grid gap-2">
                    <Label htmlFor={`${id}-recherche`} className="font-semibold text-foreground">Rechercher</Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"/>
                        <Input id={`${id}-recherche`} type="search" maxLength={60} value={query}
                               onChange={(event) => setQuery(event.target.value)}
                               placeholder="M31, Andromède, NGC 224..." className="h-11 pl-9"/>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`${id}-type`} className="font-semibold text-foreground">Type d'objet</Label>
                    <SelectMenu id={`${id}-type`} size="field" value={type} options={typeOptions} onValueChange={setType}/>
                </div>
                <Toggle variant="outline" size="lg" pressed={favoritesOnly} onPressedChange={setFavoritesOnly}
                        className="h-11 px-4 font-semibold data-[state=on]:border-brand data-[state=on]:bg-brand-soft data-[state=on]:text-brand">
                    <Star className="group-data-[state=on]/toggle:fill-current" aria-hidden="true"/>
                    Mes favoris uniquement
                </Toggle>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">{formatCount(matches.length, "objet")}</p>
            {ready
                ? <CatalogResults matches={matches} limit={limit} isFavorite={has} onToggleFavorite={toggle}
                                  onExpand={() => setExpanded(true)}/>
                : <CatalogSkeleton count={Math.min(limit, maxPlaceholders)}/>}
        </div>
    );
}
