// components/dashboard/_components/ActivityTracker.tsx
"use client";

import { useState, useEffect } from 'react';
import { Clock, MousePointerClick, Keyboard } from 'lucide-react';

// Helper to format seconds into HH:MM:SS
const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
};

export default function ActivityTracker() {
    const [timeSpent, setTimeSpent] = useState(0);
    const [clickCount, setClickCount] = useState(0);
    const [keyPressCount, setKeyPressCount] = useState(0);

    // Effect for time spent timer
    useEffect(() => {
        const timer = setInterval(() => {
            // Increment time every second
            setTimeSpent(prevTime => prevTime + 1);
        }, 1000);

        // Cleanup: clear interval when component unmounts
        return () => {
            clearInterval(timer);
        };
    }, []); // Runs once on mount

    // Effect for event listeners (clicks and keys)
    useEffect(() => {
        const handleClick = () => {
            setClickCount(prev => prev + 1);
        };
        
        const handleKeyPress = () => {
            setKeyPressCount(prev => prev + 1);
        };

        // Add event listeners to the window
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyPress);

        // Cleanup: remove listeners when component unmounts
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []); // Runs once on mount

    return (
        <div className="flex flex-col space-y-4">
            {/* Time Spent */}
            <div className="flex items-center">
                <Clock className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                <div>
                    <div 
                        className="font-mono text-xl font-bold text-zinc-100"
                        // Use tabular-nums to prevent numbers from "jittering"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                    >
                        {formatTime(timeSpent)}
                    </div>
                    <p className="text-xs text-zinc-400">Time on Page</p>
                </div>
            </div>

            {/* Click Count */}
            <div className="flex items-center">
                <MousePointerClick className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                <div>
                    <div className="font-mono text-xl font-bold text-zinc-100">
                        {clickCount}
                    </div>
                    <p className="text-xs text-zinc-400">Total Clicks</p>
                </div>
            </div>

            {/* Key Press Count */}
            <div className="flex items-center">
                <Keyboard className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                <div>
                    <div className="font-mono text-xl font-bold text-zinc-100">
                        {keyPressCount}
                    </div>
                    <p className="text-xs text-zinc-400">Keystrokes</p>
                </div>
            </div>
        </div>
    );
}