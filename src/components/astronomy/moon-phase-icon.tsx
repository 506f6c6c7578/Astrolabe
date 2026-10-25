interface MoonPhaseIconProps {
    phaseAngle: number;
    southern: boolean;
}

const radius = 30;
const center = 32;

function getLitPath(phaseAngle: number): string {
    const cosine = Math.cos((phaseAngle * Math.PI) / 180);
    const waxing = phaseAngle < 180;
    const crescent = cosine > 0;
    const terminatorRadius = Math.abs(radius * cosine);
    const top = `${center} ${center - radius}`;
    const bottom = `${center} ${center + radius}`;
    return `M${top}A${radius} ${radius} 0 0 ${waxing ? 1 : 0} ${bottom}A${terminatorRadius} ${radius} 0 0 ${waxing === crescent ? 0 : 1} ${top}Z`;
}

export function MoonPhaseIcon({ phaseAngle, southern }: MoonPhaseIconProps) {
    return (
        <svg className="size-18 shrink-0 animate-fade" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <g transform={southern ? "matrix(-1 0 0 1 64 0)" : undefined}>
                <circle className="fill-muted stroke-border" cx={center} cy={center} r={radius}/>
                <path className="fill-chart-brand" d={getLitPath(phaseAngle)}/>
            </g>
        </svg>
    );
}
