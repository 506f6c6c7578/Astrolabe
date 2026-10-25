import { Sunset } from "lucide-react";
import { DataList } from "@/components/ui/data-list";
import { Panel } from "@/components/ui/panel";
import type { Night } from "@/domain/observation/night";
import { getDuration } from "@/domain/observation/windows";
import { formatDuration, formatTime } from "@/lib/date/format";

export function SunCard({ night }: { night: Night }) {
    const { sun, astronomicalNight, timeZone } = night;
    const time = (instant: Date | null) => (instant ? formatTime(instant, timeZone) : "N'a pas lieu");

    return (
        <Panel title="Soleil et crépuscules" headingId="soleil-titre" icon={Sunset}>
            <DataList items={[
                { label: "Coucher du Soleil", value: time(sun.sunset) },
                { label: "Fin du crépuscule civil", value: time(sun.dusk.civil) },
                { label: "Fin du crépuscule nautique", value: time(sun.dusk.nautical) },
                { label: "Début de la nuit astronomique", value: time(sun.dusk.astronomical), highlight: true },
                { label: "Fin de la nuit astronomique", value: time(sun.dawn.astronomical), highlight: true },
                { label: "Début de l'aube nautique", value: time(sun.dawn.nautical) },
                { label: "Début de l'aube civile", value: time(sun.dawn.civil) },
                { label: "Lever du Soleil", value: time(sun.sunrise) },
                {
                    label: "Durée de la nuit astronomique",
                    value: astronomicalNight ? formatDuration(getDuration(astronomicalNight)) : "Aucune",
                    highlight: true
                }
            ]}/>
            {!astronomicalNight && (
                <p className="text-sm">
                    Le Soleil ne descend pas à 18° sous l'horizon : le ciel ne devient jamais pleinement noir.
                </p>
            )}
        </Panel>
    );
}
