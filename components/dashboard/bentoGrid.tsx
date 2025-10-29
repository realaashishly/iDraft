"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Footprints,
  ListTodo,
  Music,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Timer,
  TrendingUp,
} from "lucide-react";

/**
 * Main Bento Grid Dashboard Component
 * This grid is designed to fit its parent container.
 */
export default function DashboardBentoGrid() {
  return (
    // KEY: h-full and grid-rows-3 make the rows use fractional height (1fr each)
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-4 lg:grid-rows-3">
      {/* 1. Todos (Medium-Large) */}
      <Card className="flex flex-col h-full lg:col-span-1 lg:row-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo size={18} />
            To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <TodosWidget />
        </CardContent>
      </Card>

      {/* 2. Calendar (Medium-Large) */}
      <Card className="flex flex-col h-full lg:col-span-1 lg:row-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon size={18} />
            Calendar
          </CardTitle>
        </CardHeader>
        {/* Special content class to center the fixed-size calendar */}
        <CardContent className="flex flex-1 items-center justify-center overflow-hidden">
          <CalendarWidget />
        </CardContent>
      </Card>

      {/* 3. Meetings (Small) */}
      <Card className="flex flex-col h-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} />
            Meetings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <MeetingsWidget />
        </CardContent>
      </Card>

      {/* 4. Priority Task (Small) */}
      <Card className="flex flex-col h-full bg-yellow-50 dark:bg-yellow-900/20 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle size={18} />
            Priority Task
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <HighPriorityTaskWidget />
        </CardContent>
      </Card>

      {/* 5. Current Time (Small) */}
      <Card className="flex flex-col h-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer size={18} />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <CurrentTimeWidget />
        </CardContent>
      </Card>

      {/* 6. Step Counter (Small) */}
      <Card className="flex flex-col h-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints size={18} />
            Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <StepCounterWidget />
        </CardContent>
      </Card>

      {/* 7. Stopwatch (Medium) */}
      <Card className="flex flex-col h-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer size={18} />
            Stopwatch
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <StopwatchWidget />
        </CardContent>
      </Card>

      {/* 8. Music (Medium) */}
      <Card className="flex flex-col h-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music size={18} />
            Music
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <MusicWidget />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Individual Widget Components (No changes, included for completeness) ---

function CalendarWidget() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md"
    />
  );
}

function MeetingsWidget() {
  const meetings = [
    { time: "10:00 AM", title: "Daily Standup" },
    { time: "11:30 AM", title: "Design Review" },
  ];

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div key={meeting.time} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {meeting.time.split(" ")[0].split(":")[0]}
          </div>
          <div>
            <p className="font-medium">{meeting.title}</p>
            <p className="text-sm text-muted-foreground">{meeting.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HighPriorityTaskWidget() {
  return (
    <div className="space-y-2">
      <p className="font-semibold">Finalize Q4 marketing budget.</p>
      <p className="text-sm text-yellow-700 dark:text-yellow-500">
        Deadline: Tomorrow, 5:00 PM
      </p>
      <Button variant="default" size="sm" className="mt-1">
        View
      </Button>
    </div>
  );
}

function TodosWidget() {
  const todos = [
    { id: "1", label: "Draft email to stakeholders", done: true },
    { id: "2", label: "Prepare slides for sprint demo", done: false },
    { id: "3", label: "Review pull request #451", done: false },
    { id: "4B", label: "Book flight for conference", done: false },
    { id: "5", label: "Follow up with legal team", done: false },
  ];

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center space-x-2">
          <Checkbox id={todo.id} checked={todo.done} />
          <label
            htmlFor={todo.id}
            className={`text-sm ${
              todo.done
                ? "text-muted-foreground line-through"
                : "font-medium"
            }`}
          >
            {todo.label}
          </label>
        </div>
      ))}
    </div>
  );
}

function CurrentTimeWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div>
      <p className="text-2xl font-semibold leading-none tracking-tight">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-sm text-muted-foreground">
        {time.toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}

function StepCounterWidget() {
  return (
    <div>
      <p className="text-3xl font-bold">8,241</p>
      <div className="flex items-baseline gap-1 text-sm text-green-600">
        <TrendingUp size={16} />
        <span>+12%</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Goal: 10,000 steps</p>
    </div>
  );
}

function StopwatchWidget() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-3xl font-semibold tabular-nums">{formatTime(time)}</p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsRunning(false);
            setTime(0);
          }}
        >
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  );
}

function MusicWidget() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <p className="font-medium">After Hours</p>
      <p className="text-xs text-muted-foreground">The Weeknd</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon">
          <SkipBack size={16} />
        </Button>
        <Button variant="default" size="icon">
          <Pause size={16} />
        </Button>
        <Button variant="ghost" size="icon">
          <SkipForward size={16} />
        </Button>
      </div>
    </div>
  );
}