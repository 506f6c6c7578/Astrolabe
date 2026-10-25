import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
    return (
        <p className="flex gap-2.5 rounded-lg bg-muted px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true"/>
            <span>{children}</span>
        </p>
    );
}
