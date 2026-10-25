interface ColorClasses {
    fill: string;
    stroke: string;
}

const colorClasses: Record<string, ColorClasses> = {
    "#4338ca": { fill: "fill-brand", stroke: "stroke-brand" },
    "#3a3a3a": { fill: "fill-illustration-ink", stroke: "stroke-illustration-ink" },
    "#e6e6e6": { fill: "fill-illustration-muted", stroke: "stroke-illustration-muted" },
    "#ececec": { fill: "fill-illustration-soft", stroke: "stroke-illustration-soft" }
};

export function themeIllustration(svg: string): string {
    return svg
        .replace("<svg ", '<svg class="h-auto w-full" aria-hidden="true" focusable="false" ')
        .replace(/(fill|stroke)="(#[0-9a-f]{3,6})"/gi, (attribute, property: string, color: string) => {
            const classes = colorClasses[color.toLowerCase()];
            if (!classes) return attribute;
            return `class="${property === "fill" ? classes.fill : classes.stroke}"`;
        });
}
