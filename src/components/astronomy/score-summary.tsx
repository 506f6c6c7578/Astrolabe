import { Gauge } from "lucide-react";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { type NightScore, ratingLabels, ratingVerdicts } from "@/domain/observation/score";
import type { ObservationWindow } from "@/domain/observation/windows";
import { formatTime } from "@/lib/date/format";
import { formatPercent } from "@/lib/format";

interface ScoreSummaryProps {
    score: NightScore;
    bestWindow: ObservationWindow | undefined;
    timeZone: string;
}

function ScoreGauge({ value }: { value: number }) {
    return (
        <div className="relative grid size-36 shrink-0 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle className="fill-none stroke-brand-soft" cx="60" cy="60" r="52" strokeWidth="10"/>
                <circle className="animate-draw fill-none stroke-chart-brand" cx="60" cy="60" r="52" strokeWidth="10"
                        strokeLinecap="round" pathLength={1} strokeDasharray={`${value / 100} 1`}/>
            </svg>
            <p className="relative text-center leading-none">
                <span className="block text-4xl font-semibold text-brand">{value}</span>
                <span className="text-sm text-muted-foreground">sur 100</span>
            </p>
        </div>
    );
}

export function ScoreSummary({ score, bestWindow, timeZone }: ScoreSummaryProps) {
    return (
        <Panel title="Qualité de la nuit" headingId="score-titre" icon={Gauge}>
            <div className="flex flex-wrap items-center gap-6">
                <ScoreGauge value={score.value}/>
                <div className="grid gap-1">
                    <p className="font-heading text-2xl font-bold text-foreground">{ratingLabels[score.rating]}</p>
                    <p>{ratingVerdicts[score.rating]}</p>
                    {bestWindow && (
                        <p>
                            Meilleur créneau :{" "}
                            <strong className="text-brand tabular-nums">
                                {formatTime(bestWindow.start, timeZone)} – {formatTime(bestWindow.end, timeZone)}
                            </strong>
                        </p>
                    )}
                </div>
            </div>
            {!score.weatherIncluded && (
                <Notice>Score calculé sans météo : il ne reflète que l'obscurité et la gêne de la Lune.</Notice>
            )}
            <ul className="grid gap-x-8 gap-y-5 md:grid-cols-2" aria-label="Détail du score">
                {score.factors.map(({ key, label, value, detail }) => (
                    <li key={key} className="grid gap-2">
                        <div className="flex justify-between gap-4 font-semibold text-foreground">
                            <span>{label}</span>
                            <span className="tabular-nums">{value === null ? "Non évalué" : formatPercent(value)}</span>
                        </div>
                        <Meter value={value ?? 0}/>
                        <p className="text-sm">{detail}</p>
                    </li>
                ))}
            </ul>
        </Panel>
    );
}
