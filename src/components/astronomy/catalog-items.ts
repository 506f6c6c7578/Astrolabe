import { getConstellationName } from "@/data/catalog/constellations";
import type { MessierObject } from "@/data/catalog/messier";
import { objectTypes, type ObjectType } from "@/data/catalog/object-types";
import { pages } from "@/data/site";
import { getRecommendedInstrument, instrumentLabels } from "@/domain/astronomy/sky";
import { formatTime } from "@/lib/date/format";
import { formatDegrees, formatMagnitude } from "@/lib/format";
import { normalizeSearchText } from "@/lib/search";

export interface CatalogItem {
    id: string;
    href: string;
    designation: string;
    title: string;
    details: string;
    type: ObjectType;
    instrument: string;
    search: string;
    visibility?: { time: string; altitude: string };
}

export interface CatalogVisibility {
    bestTime: Date;
    bestAltitude: number;
    timeZone: string;
}

export function toCatalogItem(object: MessierObject, visibility?: CatalogVisibility): CatalogItem {
    const typeLabel = objectTypes[object.type];
    const constellation = getConstellationName(object.constellation);

    return {
        id: object.id,
        href: `${pages.objects}/${object.id}`,
        designation: object.designation,
        title: object.name ?? object.ngc ?? typeLabel,
        details: `${typeLabel} · ${constellation} · mag. ${formatMagnitude(object.magnitude)}`,
        type: object.type,
        instrument: instrumentLabels[getRecommendedInstrument(object.magnitude)],
        search: normalizeSearchText([object.designation, object.ngc, object.name, typeLabel, constellation]
            .filter(Boolean)
            .join(" ")),
        visibility: visibility && {
            time: formatTime(visibility.bestTime, visibility.timeZone),
            altitude: formatDegrees(visibility.bestAltitude)
        }
    };
}
