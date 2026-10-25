import { LoaderCircle } from "lucide-react";
import { cn } from "cn";

export function Loading({ label, className }: { label: string; className?: string }) {
    return (
        <div className={cn("flex items-center justify-center gap-2 text-sm text-muted-foreground", className)} role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true"/>
            {label}
        </div>
    );
}
