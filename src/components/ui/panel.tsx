import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";

interface PanelProps {
    title: string;
    headingId: string;
    icon: LucideIcon;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}

export function Panel({ title, headingId, icon: Icon, action, className, children }: PanelProps) {
    return (
        <Card role="region" aria-labelledby={headingId}
              className={cn("reveal gap-6 [--card-spacing:--spacing(5)] md:[--card-spacing:--spacing(7)]", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
                        <Icon className="size-4.5" aria-hidden="true"/>
                    </span>
                    <h2 id={headingId} className="text-lg">{title}</h2>
                </CardTitle>
                {action && <CardAction>{action}</CardAction>}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 text-[0.9375rem]">{children}</CardContent>
        </Card>
    );
}
