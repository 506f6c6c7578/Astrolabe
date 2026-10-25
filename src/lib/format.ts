const locale = "fr-FR";
const space = " ";

const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const coordinateFormatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export function formatPercent(ratio: number): string {
    return `${integerFormatter.format(ratio * 100)}${space}%`;
}

export function formatPercentValue(value: number): string {
    return formatPercent(value / 100);
}

export function formatOptional(value: number | null, format: (value: number) => string): string {
    return value === null ? "—" : format(value);
}

export function formatDegrees(value: number): string {
    return `${integerFormatter.format(value)}°`;
}

export function formatMagnitude(value: number): string {
    return decimalFormatter.format(value);
}

export function formatTemperature(value: number): string {
    return `${integerFormatter.format(value)}${space}°C`;
}

export function formatSpeed(value: number): string {
    return `${integerFormatter.format(value)}${space}km/h`;
}

export function formatHours(value: number): string {
    return `${decimalFormatter.format(value)}${space}h`;
}

function formatAngle(value: number, formatter: Intl.NumberFormat, positive: string, negative: string): string {
    if (value === 0) return "0°";
    return `${formatter.format(Math.abs(value))}°${space}${value > 0 ? positive : negative}`;
}

export function formatLatitude(latitude: number): string {
    return formatAngle(latitude, integerFormatter, "N", "S");
}

export function formatCoordinates(latitude: number, longitude: number): string {
    return `${formatAngle(latitude, coordinateFormatter, "N", "S")}, ${formatAngle(longitude, coordinateFormatter, "E", "O")}`;
}

export function formatRightAscension(hours: number): string {
    const totalMinutes = Math.round(hours * 600) / 10;
    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes - wholeHours * 60;
    return `${wholeHours}${space}h${space}${decimalFormatter.format(minutes)}${space}min`;
}

export function formatDeclination(degrees: number): string {
    const totalMinutes = Math.round(Math.abs(degrees) * 60);
    const sign = degrees < 0 ? "−" : "+";
    return `${sign}${Math.floor(totalMinutes / 60)}°${space}${String(totalMinutes % 60).padStart(2, "0")}′`;
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
    return `${integerFormatter.format(count)} ${count > 1 ? plural : singular}`;
}
