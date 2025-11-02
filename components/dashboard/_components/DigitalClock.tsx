// components/ui/DigitalClock.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

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
        <div className='flex flex-col items-center justify-center w-full h-full p-4'>
            {/* Removed the extra inner div to save padding */}
            <div className='relative z-10 w-full'>
                {/* Time Display Section */}
                {/* Responsive text size: smaller on mobile (text-6xl), larger on lg (text-8xl) where it has 2 columns */}
                <div className='flex items-baseline justify-center font-mono text-zinc-200 '>
                    <span className='text-6xl sm:text-7xl **lg:text-8xl** font-extrabold tracking-tight'>
                        {hour}
                    </span>

                    <span
                        className={`text-5xl sm:text-6xl **lg:text-7xl** font-light mx-1 sm:mx-2 text-zinc-400 transition-opacity duration-500 ${
                            isEvenSecond ? "opacity-100" : "opacity-40"
                        }`}
                    >
                        :
                    </span>

                    <span className='text-6xl sm:text-7xl **lg:text-8xl** font-extrabold tracking-tight'>
                        {minute}
                    </span>

                    <span className='text-2xl sm:text-3xl **lg:text-4xl** font-light text-zinc-500 ml-2 sm:ml-3 self-end'>
                        {ampm}
                    </span>
                </div>

                {/* Separator Line */}
                <div className='w-full h-px bg-zinc-700/50 my-4'></div>

                {/* Date and Icon Section */}
                <div className='flex justify-center items-center text-zinc-400 font-sans tracking-widest text-center'>
                    <Clock className='h-4 w-4 mr-3 inline-block' />
                    <span className='text-xs sm:text-sm lg:text-base uppercase max-w-full overflow-hidden text-ellipsis whitespace-nowrap'>
                        {formattedDate}
                    </span>
                </div>
            </div>
        </div>
    );
}
