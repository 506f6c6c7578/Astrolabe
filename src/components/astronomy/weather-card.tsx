import { CloudMoon } from "lucide-react";
import { DataList } from "@/components/ui/data-list";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import type { WeatherReport } from "@/domain/observation/report";
import { forecastRangeDays } from "@/domain/weather/forecast";
import { formatOptional, formatPercentValue, formatSpeed, formatTemperature } from "@/lib/format";

const unavailableMessages = {
    "out-of-range": `Les prévisions ne couvrent que les ${forecastRangeDays.future + 1} prochains jours et les ${forecastRangeDays.past} derniers jours. Le score ne tient compte que du ciel.`,
    error: "Les prévisions météo sont momentanément indisponibles. Réessaie dans quelques minutes."
} as const;

export function WeatherCard({ weather }: { weather: WeatherReport }) {
    const { summary } = weather;

    return (
        <Panel title="Météo" headingId="meteo-titre" icon={CloudMoon}>
            {summary ? (
                <DataList items={[
                    { label: "Nuages pendant la nuit", value: formatPercentValue(summary.cloudCover), highlight: true },
                    { label: "Humidité moyenne", value: formatOptional(summary.humidity, formatPercentValue) },
                    { label: "Vent moyen", value: formatOptional(summary.windSpeed, formatSpeed) },
                    { label: "Risque de précipitations", value: formatOptional(summary.precipitationProbability, formatPercentValue) },
                    { label: "Température minimale", value: formatOptional(summary.minimumTemperature, formatTemperature) },
                    { label: "Risque de rosée", value: summary.dewRisk ? "Élevé" : "Faible" }
                ]}/>
            ) : (
                <Notice>{weather.status === "error" ? unavailableMessages.error : unavailableMessages["out-of-range"]}</Notice>
            )}
        </Panel>
    );
}
