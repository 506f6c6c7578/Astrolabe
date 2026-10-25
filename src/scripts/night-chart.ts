import * as z from "zod/mini";
import { parseJson } from "@/lib/validation/json";

const pointSchema = z.object({
    x: z.number(),
    time: z.string(),
    phase: z.string(),
    sun: z.string(),
    moon: z.string(),
    clouds: z.string(),
    quality: z.string()
});

type ChartPoint = z.infer<typeof pointSchema>;

const pointsSchema = z.array(pointSchema).check(z.maxLength(400));

const tooltipOffset = 12;

const keyClasses = {
    moon: "inline-flex items-center gap-1.5 before:h-0.5 before:w-3 before:rounded-full before:bg-chart-brand",
    sun: "inline-flex items-center gap-1.5 before:h-0.5 before:w-3 before:rounded-full before:bg-chart-muted"
} as const;

function createRow(label: string, value: string, key?: keyof typeof keyClasses): HTMLElement {
    const row = document.createElement("span");
    row.className = "flex items-center justify-between gap-4";
    const name = document.createElement("span");
    name.textContent = label;
    if (key) name.className = keyClasses[key];
    const strong = document.createElement("strong");
    strong.className = "text-foreground tabular-nums";
    strong.textContent = value;
    row.append(name, strong);
    return row;
}

function fillTooltip(tooltip: HTMLElement, point: ChartPoint): void {
    const title = document.createElement("span");
    title.className = "font-semibold text-foreground";
    title.textContent = `${point.time} · ${point.phase}`;
    tooltip.replaceChildren(
        title,
        createRow("Lune", point.moon, "moon"),
        createRow("Soleil", point.sun, "sun"),
        createRow("Nuages", point.clouds),
        createRow("Qualité", point.quality)
    );
}

function initChart(chart: HTMLElement): void {
    const svg = chart.querySelector<SVGSVGElement>("svg");
    const hit = chart.querySelector<SVGRectElement>("[data-chart-hit]");
    const crosshair = chart.querySelector<SVGLineElement>("[data-chart-crosshair]");
    const tooltip = chart.querySelector<HTMLElement>("[data-chart-tooltip]");
    const points = parseJson(chart.dataset.chartPoints, pointsSchema);
    const width = Number(chart.dataset.chartWidth);
    if (!svg || !hit || !crosshair || !tooltip || !points || points.length === 0 || !width) return;

    let current = -1;

    const show = (index: number) => {
        const point = points[index];
        if (!point) return;
        current = index;
        crosshair.setAttribute("x1", String(point.x));
        crosshair.setAttribute("x2", String(point.x));
        crosshair.setAttribute("visibility", "visible");
        fillTooltip(tooltip, point);
        tooltip.hidden = false;
        const scale = svg.getBoundingClientRect().width / width;
        const left = point.x * scale - (svg.parentElement?.scrollLeft ?? 0);
        const placeLeft = left + tooltipOffset + tooltip.offsetWidth > chart.clientWidth;
        tooltip.style.left = `${placeLeft ? left - tooltipOffset - tooltip.offsetWidth : left + tooltipOffset}px`;
    };

    const hide = () => {
        crosshair.setAttribute("visibility", "hidden");
        tooltip.hidden = true;
    };

    const nearestIndex = (clientX: number) => {
        const bounds = svg.getBoundingClientRect();
        const viewBoxX = ((clientX - bounds.left) / bounds.width) * width;
        return points.reduce((nearest, point, index) =>
            Math.abs(point.x - viewBoxX) < Math.abs((points[nearest]?.x ?? Infinity) - viewBoxX) ? index : nearest, 0);
    };

    hit.addEventListener("pointermove", (event) => show(nearestIndex(event.clientX)));
    hit.addEventListener("pointerleave", hide);

    chart.addEventListener("focus", () => show(current >= 0 ? current : 0));
    chart.addEventListener("blur", hide);
    chart.addEventListener("keydown", (event) => {
        const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, PageDown: 6, PageUp: -6 };
        if (event.key === "Escape") return hide();
        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            return show(event.key === "Home" ? 0 : points.length - 1);
        }
        const step = steps[event.key];
        if (step === undefined) return;
        event.preventDefault();
        show(Math.min(points.length - 1, Math.max(0, current + step)));
    });
}

export function initNightChart(): void {
    document.querySelectorAll<HTMLElement>("[data-night-chart]").forEach(initChart);
}
