import { cn } from "cn";

export interface DataListItem {
    label: string;
    value: string;
    highlight?: boolean;
}

export function DataList({ items }: { items: readonly DataListItem[] }) {
    return (
        <dl className="grid divide-y divide-border">
            {items.map(({ label, value, highlight }) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <dt>{label}</dt>
                    <dd className={cn("text-right font-semibold tabular-nums text-foreground", highlight && "text-brand")}>
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
