// components/dashboard/_components/Stopwatch.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';

// Helper function to format time (MM:SS.ms)
const formatTime = (time: number) => {
    const milliseconds = `0${Math.floor((time % 1000) / 10)}`.slice(-2);
    const seconds = `0${Math.floor((time / 1000) % 60)}`.slice(-2);
    const minutes = `0${Math.floor((time / 60000) % 60)}`.slice(-2);
    return `${minutes}:${seconds}.${milliseconds}`;
};

export default function Stopwatch() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);

    const start = () => {
        if (isRunning) return;
        setIsRunning(true);
        startTimeRef.current = Date.now() - time;
        intervalRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
        }, 10); // Update every 10ms for smooth milliseconds
    };

    const stop = () => {
        if (!isRunning) return;
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const reset = () => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setTime(0);
    };

    // Cleanup interval on component unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center">
                <Timer className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                <div 
                    className="font-mono text-4xl font-bold text-zinc-100" 
                    // Use tabular-nums to prevent numbers from "jittering" as they change
                    style={{ fontFeatureSettings: "'tnum' 1" }} 
                >
                    {formatTime(time)}
                </div>
                <p className="text-xs text-zinc-400 mt-1">Minutes:Seconds.ms</p>
            </div>
            
            <div className="flex space-x-4 mt-6">
                {/* Start/Pause Button */}
                <button
                    onClick={isRunning ? stop : start}
                    className={`p-3 rounded-full text-white transition-colors ${
                        isRunning 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isRunning ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
                </button>
                
                {/* Reset Button */}
                <button
                    onClick={reset}
                    title="Reset"
                    className="p-3 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}