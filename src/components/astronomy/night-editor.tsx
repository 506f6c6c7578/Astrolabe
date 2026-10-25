import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { PlannerForm } from "@/components/astronomy/planner-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { IsoDate } from "@/lib/date/zoned";
import type { Place } from "@/lib/validation/place";

export function NightEditor({ place, date }: { place: Place; date: IsoDate }) {
    return (
        <Collapsible className="group/editor">
            <CollapsibleTrigger asChild>
                <Button variant="outline" size="lg">
                    <SlidersHorizontal aria-hidden="true"/>
                    Changer de lieu ou de date
                    <ChevronDown aria-hidden="true" className="transition-transform duration-300 group-data-[state=open]/editor:rotate-180"/>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <Card className="mt-4 [--card-spacing:--spacing(6)]">
                    <CardContent>
                        <PlannerForm place={place} date={date}/>
                    </CardContent>
                </Card>
            </CollapsibleContent>
        </Collapsible>
    );
}
