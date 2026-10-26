import { useCallback, useSyncExternalStore } from "react";
import type * as z from "zod/mini";
import {
    favoriteLimits,
    favoriteObjectsSchema,
    favoritePlacesSchema,
    favoriteStorageKeys,
    parseStoredList,
    recentPlacesSchema
} from "@/lib/validation/favorites";
import type { Place } from "@/lib/validation/place";

export interface FavoriteStore<Item> {
    identify: (item: Item) => string;
    getSnapshot: () => readonly Item[];
    getServerSnapshot: () => readonly Item[];
    subscribe: (listener: () => void) => () => void;
    add: (item: Item) => void;
    toggle: (item: Item) => void;
    remove: (item: Item) => void;
}

const changeEvent = "astrolabe:favorites";
const emptyList: readonly never[] = [];
const subscribeToNothing = () => () => {};

function readStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        return;
    }
}

function createFavoriteStore<Item>(
    key: string,
    schema: z.ZodMiniType<Item[]>,
    identify: (item: Item) => string,
    limit: number
): FavoriteStore<Item> {
    let cachedRaw: string | null | undefined;
    let cachedItems: readonly Item[] = emptyList;

    const getSnapshot = () => {
        const raw = readStorage(key);
        if (raw !== cachedRaw) {
            cachedRaw = raw;
            cachedItems = parseStoredList(raw, schema);
        }
        return cachedItems;
    };

    const save = (items: readonly Item[]) => {
        writeStorage(key, JSON.stringify(items.slice(0, limit)));
        window.dispatchEvent(new Event(changeEvent));
    };

    const withoutItem = (item: Item) => getSnapshot().filter((entry) => identify(entry) !== identify(item));
    const remove = (item: Item) => save(withoutItem(item));
    const add = (item: Item) => save([item, ...withoutItem(item)]);

    return {
        identify,
        getSnapshot,
        getServerSnapshot: () => emptyList,
        subscribe: (listener) => {
            const onStorage = (event: StorageEvent) => {
                if (event.key === key || event.key === null) listener();
            };
            window.addEventListener(changeEvent, listener);
            window.addEventListener("storage", onStorage);
            return () => {
                window.removeEventListener(changeEvent, listener);
                window.removeEventListener("storage", onStorage);
            };
        },
        add,
        remove,
        toggle: (item) => {
            if (getSnapshot().some((entry) => identify(entry) === identify(item))) remove(item);
            else add(item);
        }
    };
}

const identifyPlace = ({ latitude, longitude }: Place) => `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

export const favoritePlaces = createFavoriteStore<Place>(
    favoriteStorageKeys.places,
    favoritePlacesSchema,
    identifyPlace,
    favoriteLimits.places
);

export const recentPlaces = createFavoriteStore<Place>(
    favoriteStorageKeys.recentPlaces,
    recentPlacesSchema,
    identifyPlace,
    favoriteLimits.recentPlaces
);

export const favoriteObjects = createFavoriteStore<string>(
    favoriteStorageKeys.objects,
    favoriteObjectsSchema,
    (id) => id,
    favoriteLimits.objects
);

export function useFavorites<Item>(store: FavoriteStore<Item>) {
    const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
    const ready = useSyncExternalStore(subscribeToNothing, () => true, () => false);
    const has = useCallback(
        (item: Item) => items.some((entry) => store.identify(entry) === store.identify(item)),
        [items, store]
    );
    return { items, ready, has, toggle: store.toggle, remove: store.remove };
}
