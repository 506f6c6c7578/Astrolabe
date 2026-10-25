import { CalendarDays, ChevronDown } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatLongDate } from "@/lib/date/format";
import { fromLocalCalendarDate, type IsoDate, toLocalCalendarDate } from "@/lib/date/zoned";

interface DatePickerProps {
    id: string;
    value: IsoDate | undefined;
    onChange: (date: IsoDate | undefined) => void;
}

const loadCalendar = () => import("@/components/astronomy/date-calendar");
const DateCalendar = lazy(loadCalendar);

export function DatePicker({ id, value, onChange }: DatePickerProps) {
    const [open, setOpen] = useState(false);

    const choose = (date: IsoDate | undefined) => {
        onChange(date);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button id={id} variant="outline" size="field" onPointerEnter={loadCalendar} onFocus={loadCalendar}>
                    <span className="flex min-w-0 items-center gap-2">
                        <CalendarDays className="text-muted-foreground" aria-hidden="true"/>
                        <span className="truncate">{value ? formatLongDate(value) : "Ce soir"}</span>
                    </span>
                    <ChevronDown className="text-muted-foreground" aria-hidden="true"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Suspense fallback={<Loading label="Chargement du calendrier..." className="h-72 w-64"/>}>
                    <DateCalendar selected={value ? toLocalCalendarDate(value) : undefined}
                                  onSelect={(date) => choose(date ? fromLocalCalendarDate(date) : undefined)}/>
                </Suspense>
                {value && (
                    <div className="border-t p-2">
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => choose(undefined)}>
                            Revenir à ce soir
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
