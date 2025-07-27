"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date;
    onSelect?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
}

export function DatePicker({
    date,
    onSelect,
    placeholder = "Pick a date",
    className,
    disabled = false,
    captionLayout = "dropdown",
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                        onSelect?.(selectedDate);
                        setOpen(false);
                    }}
                    captionLayout={captionLayout}
                />
            </PopoverContent>
        </Popover>
    );
}

interface DateRangePickerProps {
    startDate?: Date;
    endDate?: Date;
    onStartDateSelect?: (date: Date | undefined) => void;
    onEndDateSelect?: (date: Date | undefined) => void;
    startPlaceholder?: string;
    endPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
}

export function DateRangePicker({
    startDate,
    endDate,
    onStartDateSelect,
    onEndDateSelect,
    startPlaceholder = "Start date",
    endPlaceholder = "End date",
    className,
    disabled = false,
    captionLayout = "dropdown",
}: DateRangePickerProps) {
    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
            <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                </label>
                <DatePicker
                    date={startDate}
                    onSelect={onStartDateSelect}
                    placeholder={startPlaceholder}
                    disabled={disabled}
                    captionLayout={captionLayout}
                />
            </div>
            <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                </label>
                <DatePicker
                    date={endDate}
                    onSelect={onEndDateSelect}
                    placeholder={endPlaceholder}
                    disabled={disabled}
                    captionLayout={captionLayout}
                />
            </div>
        </div>
    );
}
