// components/dashboard/_components/CalendarWidget.tsx
"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarWidget() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const today = new Date();

    return (
        <div className='flex justify-center items-center w-full'>
            <Calendar
                mode='single'
                selected={date}
                onSelect={setDate}
                className='rounded-md'
                modifiers={{
                    today: today,
                }}
                modifiersClassNames={{
                    today: "border-2 border-indigo-500 rounded-md",
                }}
            />
        </div>
    );
}
