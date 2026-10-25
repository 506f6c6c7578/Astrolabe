import { type DropdownProps, useDayPicker } from "react-day-picker";
import { fr } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { SelectMenu } from "@/components/ui/select-menu";

interface DateCalendarProps {
    selected: Date | undefined;
    onSelect: (date: Date | undefined) => void;
}

const supportedRange = {
    start: new Date(1900, 0, 1),
    end: new Date(2100, 11, 31)
};

function createCaptionDropdown(getMonth: (displayed: Date, value: number) => Date) {
    return function CaptionDropdown({ options = [], value, disabled, "aria-label": label }: DropdownProps) {
        const { months: [displayed], goToMonth } = useDayPicker();

        return (
            <SelectMenu variant="ghost" size="sm" className="relative px-2 font-medium" aria-label={label} disabled={disabled}
                        value={Number(value)} options={options.filter((option) => !option.disabled)}
                        onValueChange={(next) => goToMonth(getMonth(displayed.date, next))}/>
        );
    };
}

const captionComponents = {
    MonthsDropdown: createCaptionDropdown((displayed, month) => new Date(displayed.getFullYear(), month)),
    YearsDropdown: createCaptionDropdown((displayed, year) => new Date(year, displayed.getMonth()))
};

export default function DateCalendar({ selected, onSelect }: DateCalendarProps) {
    return (
        <Calendar
            mode="single"
            locale={fr}
            captionLayout="dropdown"
            startMonth={supportedRange.start}
            endMonth={supportedRange.end}
            selected={selected}
            defaultMonth={selected}
            onSelect={onSelect}
            components={captionComponents}
        />
    );
}
