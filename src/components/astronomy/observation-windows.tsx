import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { ratingLabels } from "@/domain/observation/score";
import { getDuration, type ObservationWindow, windowCriteria } from "@/domain/observation/windows";
import { formatDuration, formatTime } from "@/lib/date/format";
import { formatPercent } from "@/lib/format";
import { cn } from "cn";

interface ObservationWindowsProps {
    windows: readonly ObservationWindow[];
    timeZone: string;
}

export function ObservationWindows({ windows, timeZone }: ObservationWindowsProps) {
    return (
        <Panel title="Meilleurs créneaux" headingId="creneaux-titre" icon={Clock}>
            {windows.length > 0 ? (
                <ol className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {windows.map((window, index) => (
                        <li key={window.start.getTime()}
                            className={cn("grid justify-items-start gap-1 rounded-xl border p-5 transition-colors",
                                index === 0 && "border-brand bg-brand-soft/40")}>
                            <p className="font-heading text-xl font-bold tabular-nums text-foreground">
                                {formatTime(window.start, timeZone)} – {formatTime(window.end, timeZone)}
                            </p>
                            <p className="mb-2 text-sm">
                                {formatDuration(getDuration(window))} · qualité {formatPercent(window.quality)}
                            </p>
                            <Badge variant={index === 0 ? "brand" : "outline"}>
                                {index === 0 ? "Meilleur créneau" : ratingLabels[window.rating]}
                            </Badge>
                        </li>
                    ))}
                </ol>
            ) : (
                <Notice>
                    Aucun créneau favorable cette nuit : le ciel reste trop clair, la Lune trop lumineuse ou les
                    nuages trop présents. Consulte le détail du score pour en savoir plus.
                </Notice>
            )}
            <p className="text-sm text-muted-foreground">
                Un créneau rassemble au moins {formatDuration(windowCriteria.minimumDurationMs)} consécutives proches de
                la meilleure qualité de la nuit, en combinant obscurité, Lune et nuages.
            </p>
        </Panel>
    );
}
