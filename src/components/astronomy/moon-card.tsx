import { MoonStar } from "lucide-react";
import { MoonPhaseIcon } from "@/components/astronomy/moon-phase-icon";
import { DataList } from "@/components/ui/data-list";
import { Panel } from "@/components/ui/panel";
import { moonPhaseLabels } from "@/domain/astronomy/moon";
import type { MoonReport } from "@/domain/observation/report";
import { getMoonImpactLevel, moonImpactLabels } from "@/domain/observation/score";
import { formatDateTime, formatTime } from "@/lib/date/format";
import { formatPercent } from "@/lib/format";

interface MoonCardProps {
    moon: MoonReport;
    timeZone: string;
    southern: boolean;
}

export function MoonCard({ moon, timeZone, southern }: MoonCardProps) {
    const time = (instant: Date | null) => (instant ? formatTime(instant, timeZone) : "Pas cette nuit");
    const dateTime = (instant: Date | null) => (instant ? formatDateTime(instant, timeZone) : "Inconnue");

    return (
        <Panel title="Lune" headingId="lune-titre" icon={MoonStar}>
            <div className="flex items-center gap-5">
                <MoonPhaseIcon phaseAngle={moon.phaseAngle} southern={southern}/>
                <div>
                    <p className="font-heading text-xl font-bold text-foreground">{moonPhaseLabels[moon.phase]}</p>
                    <p>Illuminée à <strong className="text-brand">{formatPercent(moon.illumination)}</strong></p>
                </div>
            </div>
            <DataList items={[
                { label: "Lever", value: time(moon.rise) },
                { label: "Coucher", value: time(moon.set) },
                { label: "Présence pendant la nuit noire", value: formatPercent(moon.presence) },
                { label: "Gêne lumineuse", value: moonImpactLabels[getMoonImpactLevel(moon.impact)], highlight: true },
                { label: "Prochaine pleine lune", value: dateTime(moon.nextFullMoon) },
                { label: "Prochaine nouvelle lune", value: dateTime(moon.nextNewMoon) }
            ]}/>
        </Panel>
    );
}
