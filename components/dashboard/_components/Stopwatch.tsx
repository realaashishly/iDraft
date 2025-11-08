"use client";

import { Pause, Play, RefreshCw, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// --- Pomodoro Settings ---
const DURATIONS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};
const POMODOROS_UNTIL_LONG_BREAK = 4;

// --- Color mapping for each mode ---
// These colors are vibrant and work on both light/dark backgrounds
const MODE_COLORS = {
  work: {
    button: "bg-red-600",
    icon: "text-red-400",
  },
  shortBreak: {
    button: "bg-green-600",
    icon: "text-green-400",
  },
  longBreak: {
    button: "bg-blue-600",
    icon: "text-blue-400",
  },
};

// Helper function to format time (MM:SS)
const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

type Mode = "work" | "shortBreak" | "longBreak";

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Core Timer Logic ---

  // 1. Handles the countdown
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // 2. Handles what happens when the timer hits 0
  useEffect(() => {
    if (timeLeft > 0) {
      return;
    }

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Switch mode
    if (mode === "work") {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      if (newCount % POMODOROS_UNTIL_LONG_BREAK === 0) {
        setMode("longBreak");
      } else {
        setMode("shortBreak");
      }
    } else {
      setMode("work");
    }
  }, [timeLeft, mode, pomodoroCount]);

  // 3. Resets the timer when the mode changes
  useEffect(() => {
    setTimeLeft(DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  // --- Control Functions ---

  const togglePlayPause = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const selectMode = (newMode: Mode) => {
    setMode(newMode);
  };

  // --- Active Button Styling ---
  const getButtonClass = (buttonMode: Mode) =>
    mode === buttonMode
      ? `${MODE_COLORS[mode].button} text-white` // Active class (red, green, blue)
      : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"; // Inactive class

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      {/* Mode Selection Buttons */}
      <div className="mb-6 flex space-x-2">
        <button
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${getButtonClass(
            "work"
          )}`}
          onClick={() => selectMode("work")}
        >
          Work
        </button>
        <button
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${getButtonClass(
            "shortBreak"
          )}`}
          onClick={() => selectMode("shortBreak")}
        >
          Short Break
        </button>
        <button
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${getButtonClass(
            "longBreak"
          )}`}
          onClick={() => selectMode("longBreak")}
        >
          Long Break
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center">
        <Timer
          className={`mx-auto mb-2 h-6 w-6 ${MODE_COLORS[mode].icon} transition-colors`}
        />
        <div
          className="font-mono text-5xl font-bold text-zinc-900 dark:text-zinc-100"
          style={{ fontFeatureSettings: "'tnum' 1" }}
        >
          {formatTime(timeLeft)}
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Minutes:Seconds
        </p>
      </div>

      {/* Control Buttons (MODIFIED) */}
      <div className="mt-6 flex space-x-4">
        <button
          className={`rounded-full p-3 text-white transition-all ${
            isRunning
              ? "bg-yellow-500 hover:bg-yellow-600" // Pause button is yellow
              : `${MODE_COLORS[mode].button} hover:opacity-80` // Play button matches active mode
          }`}
          onClick={togglePlayPause}
        >
          {isRunning ? (
            <Pause className="h-6 w-6 fill-white" />
          ) : (
            <Play className="h-6 w-6 fill-white" />
          )}
        </button>

        <button
          className="rounded-full bg-zinc-200 p-3 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
          onClick={resetTimer}
          title="Reset"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}