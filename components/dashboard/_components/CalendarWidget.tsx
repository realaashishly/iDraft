// components/dashboard/_components/CalendarWidget.tsx
"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarWidget() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const today = new Date();

  return (
    <div className="flex w-full items-center justify-center">
      <Calendar
        className="rounded-md"
        mode="single"
        modifiers={{
          today,
        }}
        modifiersClassNames={{
          today: "border-2 border-indigo-500 rounded-md",
        }}
        onSelect={setDate}
        selected={date}
      />
    </div>
  );
}
