// components/ui/DigitalClock.tsx
"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function DigitalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };
    const timerId = setInterval(updateTime, 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  // Removed year to save space, matching the image
  const formattedDate = new Intl.DateTimeFormat("en-US", dateOptions)
    .format(currentTime)
    .toUpperCase();

  const isEvenSecond = currentTime.getSeconds() % 2 === 0;

  const [time, ampm] = formattedTime.split(" ");
  const [hour, minute] = time.split(":");

  return (
    // Outer div: Use h-full and w-full, p-4 (base) and p-6 (lg)
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      {/* Removed the extra inner div to save padding */}
      <div className="relative z-10 w-full">
        {/* Time Display Section */}
        {/* Responsive text size: smaller on mobile (text-6xl), larger on lg (text-8xl) where it has 2 columns */}
        <div className="flex items-baseline justify-center font-mono text-zinc-900 dark:text-zinc-200">
          <span className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            {hour}
          </span>

          <span
            className={`mx-1 text-5xl font-light text-zinc-500 transition-opacity duration-500 dark:text-zinc-400 sm:mx-2 sm:text-6xl lg:text-7xl ${
              isEvenSecond ? "opacity-100" : "opacity-40"
            }`}
          >
            :
          </span>

          <span className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            {minute}
          </span>

          <span className="ml-2 self-end text-2xl font-light text-zinc-400 dark:text-zinc-500 sm:ml-3 sm:text-3xl lg:text-4xl">
            {ampm}
          </span>
        </div>

        {/* Separator Line */}
        <div className="my-4 h-px w-full bg-zinc-200 dark:bg-zinc-700/50" />

        {/* Date and Icon Section */}
        <div className="flex items-center justify-center text-center font-sans tracking-widest text-zinc-500 dark:text-zinc-400">
          <Clock className="mr-3 inline-block h-4 w-4" />
          <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs uppercase sm:text-sm lg:text-base">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}