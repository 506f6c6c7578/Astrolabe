import { type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ComposedChart,
    type Coordinate,
    Line,
    ReferenceArea,
    ReferenceDot,
    ReferenceLine,
    useChartWidth,
    usePlotArea,
    XAxis,
    YAxis
} from "recharts";
import type { NightTimelineData, TimelinePoint, TimeRange } from "@/components/astronomy/night-timeline-data";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { SkyPhase } from "@/domain/astronomy/sun";
import { formatTime } from "@/lib/date/format";
import { formatDegrees, formatOptional, formatPercent, formatPercentValue } from "@/lib/format";
import { clamp } from "@/lib/math";

type TimelineChart = "altitude" | "clouds";

type TooltipMode = "full" | "cursor" | "none";

interface Interaction {
    chart: TimelineChart;
    touch: boolean;
}

interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DirectLabel {
    label: string;
    time: number;
    altitude: number;
}

interface ChartProps {
    data: NightTimelineData;
    syncId: string;
    tooltip: TooltipMode;
    onActivate: (touch: boolean) => void;
}

export const skyPhaseClasses: Record<SkyPhase, { fill: string; swatch: string }> = {
    day: { fill: "fill-sky-day", swatch: "bg-sky-day" },
    civil: { fill: "fill-sky-civil", swatch: "bg-sky-civil" },
    nautical: { fill: "fill-sky-nautical", swatch: "bg-sky-nautical" },
    astronomical: { fill: "fill-sky-astronomical", swatch: "bg-sky-astronomical" },
    night: { fill: "fill-sky-night", swatch: "bg-sky-night" }
};

const chartConfig = {
    moon: { label: "Lune" },
    sun: { label: "Soleil" },
    clouds: { label: "Nuages" },
    quality: { label: "Qualité" }
} satisfies ChartConfig;

const altitudeScale = { lowest: -90, highest: 90, step: 30 };
const cloudAxis = { domain: [0, 100], ticks: [0, 100] };
const margin = { top: 24, right: 20, bottom: 0, left: 0 };
const cloudMargin = { ...margin, top: 8, bottom: 8 };
const axisWidth = 44;
const labelInset = 0.06;
const labelAltitudeSpan = 20;
const labelHalfWidth = 24;
const hourInMs = 3_600_000;
const hourTickSteps = [1, 2, 3, 4];
const maxHourTickStep = 6;
const minTickSpacing = 52;
const layers = { bands: -300, windows: -200 };
const brand = "var(--color-chart-brand)";
const muted = "var(--color-chart-muted)";
const tooltipOffset = 14;
const tooltipOrigin = { x: 0, y: 0 };
const cursor = { stroke: "var(--color-muted-foreground)", strokeWidth: 1 };
const activeDot = { r: 4, strokeWidth: 2, stroke: "var(--color-card)" };
const chartClass = "aspect-auto w-full rounded-md has-focus-visible:ring-3 has-focus-visible:ring-ring/50 [&_g]:outline-hidden";
const directLabelClass = "fill-foreground text-xs font-semibold";
const lineKeyClass = "inline-flex items-center gap-2 before:h-0.5 before:w-3 before:rounded-full";

const insetTime = (time: number, { start, end }: TimeRange) => {
    const inset = (end - start) * labelInset;
    return clamp(time, start + inset, end - inset);
};

const activeDotFor = (mode: TooltipMode, fill: string) => mode !== "none" && { ...activeDot, fill };

const moonAboveHorizon = ({ moon }: TimelinePoint) => Math.max(moon, 0);

function getDirectLabels({ points, moonPeak, range }: NightTimelineData, floor: number, labelSpan: number): DirectLabel[] {
    const firstPoint = points.at(0);
    const candidates = [
        moonPeak && {
            label: chartConfig.moon.label,
            time: moonPeak.time,
            altitude: moonPeak.altitude,
            crossing: ({ sun }: TimelinePoint) => sun
        },
        firstPoint && {
            label: chartConfig.sun.label,
            time: firstPoint.time,
            altitude: firstPoint.sun,
            crossing: ({ moon }: TimelinePoint) => moon
        }
    ];
    const isVisible = (altitude: number) => altitude > floor + 6 && altitude < altitudeScale.highest - 4;
    const isAboveWithinLabel = (other: number, altitude: number) => other >= altitude && other - altitude < labelAltitudeSpan;

    return candidates.reduce<DirectLabel[]>((labels, candidate) => {
        if (!candidate || !isVisible(candidate.altitude)) return labels;
        const { label, altitude, crossing } = candidate;
        const time = insetTime(candidate.time, range);
        const crossed = points.some((point) =>
            Math.abs(point.time - time) <= labelSpan && isAboveWithinLabel(crossing(point), altitude));
        const collides = labels.some((other) =>
            Math.abs(other.time - time) <= labelSpan * 2 && Math.abs(other.altitude - altitude) < labelAltitudeSpan);
        return crossed || collides ? labels : [...labels, { label, time, altitude }];
    }, []);
}

function DirectLabels({ data, floor }: { data: NightTimelineData; floor: number }) {
    const plotWidth = usePlotArea()?.width ?? 0;
    const labelSpan = plotWidth > 0 ? (labelHalfWidth * (data.range.end - data.range.start)) / plotWidth : 0;

    return getDirectLabels(data, floor, labelSpan).map(({ label, time, altitude }) => (
        <ReferenceDot key={label} x={time} y={altitude} r={0}
                      label={{ value: label, position: "top", offset: 10, className: directLabelClass }}/>
    ));
}

function getAltitudeTicks(points: readonly TimelinePoint[]): number[] {
    const { lowest, highest, step } = altitudeScale;
    const lowestAltitude = points.reduce((lowestSoFar, { sun, moon }) => Math.min(lowestSoFar, sun, moon), 0);
    const floor = Math.max(lowest, Math.floor(lowestAltitude / step) * step);
    return Array.from({ length: (highest - floor) / step + 1 }, (_, index) => floor + index * step);
}

function BandShape({ className, x, y, width, height }: Bounds & { className: string }) {
    return <rect className={className} x={x} y={y} width={width} height={height}/>;
}

function WindowShape({ x, y, width, height }: Bounds) {
    return (
        <g className="fill-chart-brand">
            <rect className="opacity-15" x={x} y={y} width={width} height={height}/>
            <rect x={x} y={y} width={width} height={3}/>
        </g>
    );
}

function TooltipRow({ label, value, keyClass }: { label: string; value: string; keyClass?: string }) {
    return (
        <span className="flex items-center justify-between gap-4">
            <span className={keyClass}>{label}</span>
            <strong className="font-semibold text-foreground tabular-nums">{value}</strong>
        </span>
    );
}

function placeTooltip(pointerX: number, width: number, chartWidth: number): number {
    const right = pointerX + tooltipOffset;
    if (right + width <= chartWidth) return right;
    const left = pointerX - tooltipOffset - width;
    if (left >= 0) return left;
    return clamp(pointerX - width / 2, 0, Math.max(0, chartWidth - width));
}

function FloatingTooltip({ coordinate, children }: { coordinate: Coordinate; children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const chartWidth = useChartWidth() ?? 0;
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element || (element.offsetWidth === size.width && element.offsetHeight === size.height)) return;
        setSize({ width: element.offsetWidth, height: element.offsetHeight });
    });

    const left = placeTooltip(coordinate.x, size.width, chartWidth);
    const top = coordinate.y - tooltipOffset - size.height;
    return <div ref={ref} style={{ translate: `${left}px ${top}px` }}>{children}</div>;
}

function TimelineTooltip({ point, timeZone }: { point: TimelinePoint; timeZone: string }) {
    return (
        <div role="status" className="grid min-w-40 gap-1 rounded-lg border bg-popover px-3 py-2.5 text-xs text-muted-foreground shadow-lg sm:min-w-44 sm:text-[0.8125rem]">
            <span className="font-semibold text-foreground">{formatTime(new Date(point.time), timeZone)} · {point.phase}</span>
            <TooltipRow label={chartConfig.moon.label} value={formatDegrees(point.moon)} keyClass={`${lineKeyClass} before:bg-chart-brand`}/>
            <TooltipRow label={chartConfig.sun.label} value={formatDegrees(point.sun)} keyClass={`${lineKeyClass} before:bg-chart-muted`}/>
            <TooltipRow label={chartConfig.clouds.label} value={formatOptional(point.clouds, formatPercentValue)}/>
            <TooltipRow label={chartConfig.quality.label} value={formatPercent(point.quality)}/>
        </div>
    );
}

function PointTooltip({ mode, timeZone }: { mode: TooltipMode; timeZone: string }) {
    return (
        <ChartTooltip active={mode === "none" ? false : undefined} cursor={mode !== "none" && cursor} position={tooltipOrigin}
                      isAnimationActive={false}
                      content={({ active, payload, coordinate }) => mode === "full" && active && payload[0] && coordinate
                          ? (
                              <FloatingTooltip coordinate={coordinate}>
                                  <TimelineTooltip point={payload[0].payload} timeZone={timeZone}/>
                              </FloatingTooltip>
                          )
                          : null}/>
    );
}

function TimeAxis({ data, hide = false }: { data: NightTimelineData; hide?: boolean }) {
    const { range, hours, timeZone } = data;
    const plotWidth = usePlotArea()?.width ?? 0;
    const hourWidth = (plotWidth * hourInMs) / (range.end - range.start);
    const step = hourTickSteps.find((candidate) => candidate * hourWidth >= minTickSpacing) ?? maxHourTickStep;

    return (
        <XAxis dataKey="time" type="number" scale="time" domain={[range.start, range.end]}
               ticks={hours.filter((_, index) => index % step === 0)} interval={0}
               tickFormatter={(time: number) => formatTime(new Date(time), timeZone)}
               tickMargin={8} tickLine={false} axisLine={false} allowDataOverflow hide={hide}/>
    );
}

function AltitudeChart({ data, syncId, tooltip, onActivate }: ChartProps) {
    const gradientId = useId();
    const { points, bands, windows, timeZone } = data;
    const ticks = getAltitudeTicks(points);
    const floor = ticks[0] ?? 0;

    return (
        <ChartContainer config={chartConfig} className={`${chartClass} h-64 sm:h-80`}
                        onPointerEnter={({ pointerType }) => onActivate(pointerType === "touch")} onFocus={() => onActivate(false)}>
            <ComposedChart data={points} syncId={syncId} margin={margin} title="Hauteur du Soleil et de la Lune"
                           desc="Hauteur du Soleil et de la Lune par rapport à l'horizon, phases du ciel et meilleurs créneaux. Utilise les flèches gauche et droite pour parcourir la nuit.">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={brand} stopOpacity={0.35}/>
                        <stop offset="100%" stopColor={brand} stopOpacity={0.02}/>
                    </linearGradient>
                </defs>
                {bands.map(({ phase, start, end }) => (
                    <ReferenceArea key={start} x1={start} x2={end} zIndex={layers.bands}
                                   shape={(bounds: Bounds) => <BandShape className={skyPhaseClasses[phase].fill} {...bounds}/>}/>
                ))}
                {windows.map(({ start, end }) => (
                    <ReferenceArea key={start} x1={start} x2={end} zIndex={layers.windows} shape={WindowShape}/>
                ))}
                <CartesianGrid vertical={false}/>
                <TimeAxis data={data}/>
                <YAxis domain={[floor, altitudeScale.highest]} ticks={ticks} tickFormatter={formatDegrees} interval={0}
                       width={axisWidth} tickLine={false} axisLine={false}/>
                <ReferenceLine y={0} stroke={muted}/>
                <PointTooltip mode={tooltip} timeZone={timeZone}/>
                <Area dataKey={moonAboveHorizon} type="monotone" baseValue={0} stroke="none" fill={`url(#${gradientId})`}
                      activeDot={false} tooltipType="none"/>
                <Line dataKey="sun" type="monotone" stroke={muted} strokeWidth={2} dot={false} activeDot={activeDotFor(tooltip, muted)}/>
                <Line dataKey="moon" type="monotone" stroke={brand} strokeWidth={2} dot={false} activeDot={activeDotFor(tooltip, brand)}/>
                <DirectLabels data={data} floor={floor}/>
            </ComposedChart>
        </ChartContainer>
    );
}

function CloudChart({ data, syncId, tooltip, onActivate }: ChartProps) {
    return (
        <ChartContainer config={chartConfig} className={`${chartClass} h-24`}
                        onPointerEnter={({ pointerType }) => onActivate(pointerType === "touch")}>
            <AreaChart data={data.points} syncId={syncId} margin={cloudMargin} accessibilityLayer={false}>
                <CartesianGrid vertical={false}/>
                <TimeAxis data={data} hide/>
                <YAxis domain={cloudAxis.domain} ticks={cloudAxis.ticks} tickFormatter={formatPercentValue} interval={0}
                       width={axisWidth} tickLine={false} axisLine={false}/>
                <PointTooltip mode={tooltip} timeZone={data.timeZone}/>
                <Area dataKey="clouds" type="monotone" stroke={muted} strokeWidth={2} fill={muted} fillOpacity={0.2}
                      activeDot={activeDotFor(tooltip, muted)}/>
            </AreaChart>
        </ChartContainer>
    );
}

export function NightTimeline({ data }: { data: NightTimelineData }) {
    const syncId = useId();
    const [interaction, setInteraction] = useState<Interaction>({ chart: "altitude", touch: false });
    const hasClouds = data.points.some(({ clouds }) => clouds !== null);
    const tooltipMode = (chart: TimelineChart): TooltipMode => {
        if (interaction.chart === chart) return "full";
        return interaction.touch ? "none" : "cursor";
    };
    const activate = (chart: TimelineChart) => (touch: boolean) => setInteraction({ chart, touch });

    return (
        <div className="grid gap-4">
            <AltitudeChart data={data} syncId={syncId} tooltip={tooltipMode("altitude")} onActivate={activate("altitude")}/>
            <div className="grid gap-2">
                <p className="text-sm font-semibold text-foreground">Couverture nuageuse</p>
                {hasClouds
                    ? <CloudChart data={data} syncId={syncId} tooltip={tooltipMode("clouds")} onActivate={activate("clouds")}/>
                    : <p className="grid h-24 place-items-center rounded-md bg-muted/50 px-4 text-center text-sm">
                        Prévisions nuageuses indisponibles pour cette date
                    </p>}
            </div>
        </div>
    );
}
