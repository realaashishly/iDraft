"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';

// --- Pomodoro Settings ---
const DURATIONS = {
  work: 25 * 60,       // 25 minutes
  shortBreak: 5 * 60,  // 5 minutes
  longBreak: 15 * 60,  // 15 minutes
};
const POMODOROS_UNTIL_LONG_BREAK = 4;

// Helper function to format time (MM:SS)
const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

type Mode = 'work' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('work');
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
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Start a new interval
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
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

    // Timer hit zero
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Optional: Play a sound here
    // new Audio('/sounds/timer-complete.mp3').play();

    // Switch mode
    if (mode === 'work') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      if (newCount % POMODOROS_UNTIL_LONG_BREAK === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else { // Was on a shortBreak or longBreak
      setMode('work');
    }
  }, [timeLeft, mode, pomodoroCount]);

  // 3. Resets the timer when the mode changes
  useEffect(() => {
    setTimeLeft(DURATIONS[mode]);
    setIsRunning(false); // Stop the timer when switching modes
  }, [mode]);

  // --- Control Functions ---

  const togglePlayPause = () => {
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const selectMode = (newMode: Mode) => {
    setMode(newMode);
    // The useEffect for `mode` will handle resetting the time
  };
  
  // --- Active Button Styling ---
  const getButtonClass = (buttonMode: Mode) => {
    return mode === buttonMode
      ? 'bg-indigo-600 text-white'
      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* Mode Selection Buttons */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => selectMode('work')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${getButtonClass('work')}`}
        >
          Work
        </button>
        <button
          onClick={() => selectMode('shortBreak')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${getButtonClass('shortBreak')}`}
        >
          Short Break
        </button>
        <button
          onClick={() => selectMode('longBreak')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${getButtonClass('longBreak')}`}
        >
          Long Break
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center">
        <Timer className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
        <div 
          className="font-mono text-5xl font-bold text-zinc-100" 
          style={{ fontFeatureSettings: "'tnum' 1" }} 
        >
          {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-zinc-400 mt-1">Minutes:Seconds</p>
      </div>
      
      {/* Control Buttons */}
      <div className="flex space-x-4 mt-6">
        <button
          onClick={togglePlayPause}
          className={`p-3 rounded-full text-white transition-colors ${
            isRunning 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}
        </button>
        
        <button
          onClick={resetTimer}
          title="Reset"
          className="p-3 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}