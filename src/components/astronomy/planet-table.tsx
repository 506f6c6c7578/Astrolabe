import { Orbit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getConstellationName } from "@/data/catalog/constellations";
import { planetMinimumAltitude, type PlanetVisibility } from "@/domain/astronomy/planets";
import { instrumentLabels } from "@/domain/astronomy/sky";
import { formatTime } from "@/lib/date/format";
import { formatCount, formatDegrees, formatMagnitude } from "@/lib/format";
import { cn } from "cn";

interface PlanetTableProps {
    planets: readonly PlanetVisibility[];
    timeZone: string;
}

const columns = ["Planète", "Visibilité", "Au plus haut", "Lever", "Coucher", "Magnitude", "Constellation", "Instrument"];

export function PlanetTable({ planets, timeZone }: PlanetTableProps) {
    const time = (instant: Date | null) => (instant ? formatTime(instant, timeZone) : "—");
    const visibleCount = planets.filter(({ visible }) => visible).length;

    return (
        <Panel title="Planètes" headingId="planetes-titre" icon={Orbit}>
            <p>
                {visibleCount === 0
                    ? "Aucune planète ne s'élève suffisamment cette nuit."
                    : `${formatCount(visibleCount, "planète")} au-dessus de ${planetMinimumAltitude}° après le crépuscule civil.`}
            </p>
            <Table className="min-w-176 tabular-nums">
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {planets.map(({ planet, visible, bestAltitude, bestTime, rise, set, magnitude, constellation, instrument }) => (
                        <TableRow key={planet.name} className={cn(!visible && "text-muted-foreground")}>
                            <TableHead scope="row" className="text-foreground">{planet.name}</TableHead>
                            <TableCell>
                                <Badge variant={visible ? "brand" : "outline"}>{visible ? "Visible" : "Non visible"}</Badge>
                            </TableCell>
                            <TableCell>
                                {visible && bestTime && bestAltitude !== null
                                    ? `${time(bestTime)} · ${formatDegrees(bestAltitude)}`
                                    : "—"}
                            </TableCell>
                            <TableCell>{time(rise)}</TableCell>
                            <TableCell>{time(set)}</TableCell>
                            <TableCell>{formatMagnitude(magnitude)}</TableCell>
                            <TableCell>{getConstellationName(constellation)}</TableCell>
                            <TableCell>{instrumentLabels[instrument]}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Panel>
    );
}
