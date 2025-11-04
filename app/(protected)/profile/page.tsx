"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Github,
  Gitlab,
  Mail,
  Slack,
  Star,
  Trello,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react"

import { getAssets } from "@/action/assetAction";
import { useActivity } from "@/contexts/ActivityContext";
import { useSession } from "@/lib/auth-client";
import type { Asset, Todo } from "@/type/types";

// --- GLOBAL CONSTANTS ---

const JANUARY_MONTH_INDEX = 0;
const FIRST_DAY_OF_MONTH = 1;
const DAYS_IN_WEEK = 7;
const START_OF_DAY = 0;
// const DECEMBER_MONTH_INDEX = 11;
// const LAST_DAY_OF_DECEMBER = 31;
const PERCENT_MULTIPLIER = 100;
const PROGRESS_DECIMAL_PRECISION = 1;
const ONE_MINUTE_IN_MS = 60_000;
// const MS_IN_SECOND = 1000;
// const SECONDS_IN_MINUTE = 60;
// const MINUTES_IN_HOUR = 60;
// const HOURS_IN_DAY = 24;
// const MS_IN_DAY =
//     MS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY; // 86_400_000

// Constant for visual spacing (can be adjusted to match exactly)
const GRID_CELL_SIZE_PX = 10;
const GRID_GAP_PX = 3;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// --- HELPER FUNCTIONS ---

const calculateProductivity = (completed: number, pending: number) => {
  const total = completed + pending;
  if (total === 0) {
    return 0;
  }
  return Math.round((completed / total) * PERCENT_MULTIPLIER);
};

const calculateStreak = (timeSpent: number) => Math.floor(timeSpent / 60);

// The key used by the TodoList widget
const LOCAL_STORAGE_KEY = "dashboardUserTodos";

// --- MAIN PROFILE COMPONENT ---

export default function Profile() {
  const { data: session, isPending: status } = useSession();
  const { timeSpent } = useActivity();

  const MOCKED_TOTAL_DOWNLOADS_COUNT = 32;

  const [totalAssetsCount, setTotalAssetsCount] = useState(0);
  const [totalDownloadsCount] = useState(MOCKED_TOTAL_DOWNLOADS_COUNT);
  const [completedTodosCount, setCompletedTodosCount] = useState(0);
  const [pendingTodosCount, setPendingTodosCount] = useState(0);

  const user = session?.user;
  const router = useRouter();

  // We get the *actual* current date to ensure accuracy
  // Using a fixed date for consistent visualization to match your image: Nov 4, 2025
  const today = new Date();
  const currentYear = today.getFullYear();

  // --- LOGIC AND EFFECTS (UNCHANGED) ---

  const fetchAssetCount = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const assets: Asset[] = await getAssets();
      setTotalAssetsCount(assets.length);
    } catch {
      setTotalAssetsCount(0);
    }
  }, [user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTodos) {
        try {
          const todos: Todo[] = JSON.parse(storedTodos);
          const completed = todos.filter((t) => t.isCompleted).length;
          const pending = todos.filter((t) => !t.isCompleted).length;

          setCompletedTodosCount(completed);
          setPendingTodosCount(pending);
        } catch {
          setCompletedTodosCount(0);
          setPendingTodosCount(0);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAssetCount();
    }
  }, [user, fetchAssetCount]);

  const currentStats = {
    completedTasks: completedTodosCount,
    pendingTasks: pendingTodosCount,
    productivity: calculateProductivity(completedTodosCount, pendingTodosCount),
    streak: calculateStreak(timeSpent),
    totalDownloads: totalDownloadsCount,
    totalAssets: totalAssetsCount,
  };

  const [_timeLeft, setTimeLeft] = useState({ year: 0, week: 0 });

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const startOfYear = new Date(
        now.getFullYear(),
        JANUARY_MONTH_INDEX,
        FIRST_DAY_OF_MONTH
      );
      const endOfYear = new Date(
        now.getFullYear() + 1,
        JANUARY_MONTH_INDEX,
        FIRST_DAY_OF_MONTH
      );
      const yearProgress =
        ((now.getTime() - startOfYear.getTime()) /
          (endOfYear.getTime() - startOfYear.getTime())) *
        PERCENT_MULTIPLIER;

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(
        START_OF_DAY,
        START_OF_DAY,
        START_OF_DAY,
        START_OF_DAY
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + DAYS_IN_WEEK);
      const weekProgress =
        ((now.getTime() - startOfWeek.getTime()) /
          (endOfWeek.getTime() - startOfWeek.getTime())) *
        PERCENT_MULTIPLIER;

      setTimeLeft({
        year: Number.parseFloat(
          yearProgress.toFixed(PROGRESS_DECIMAL_PRECISION)
        ),
        week: Number.parseFloat(
          weekProgress.toFixed(PROGRESS_DECIMAL_PRECISION)
        ),
      });
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, ONE_MINUTE_IN_MS);
    return () => clearInterval(interval);
  }, []);

  const connectedPlatforms = [
    {
      name: "GitHub",
      icon: <Github className="h-5 w-5 text-zinc-400" />,
      connected: false,
    },
    {
      name: "GitLab",
      icon: <Gitlab className="h-5 w-5 text-zinc-400" />,
      connected: false,
    },
    {
      name: "Slack",
      icon: <Slack className="h-5 w-5 text-zinc-400" />,
      connected: false,
    },
    {
      name: "Trello",
      icon: <Trello className="h-5 w-5 text-zinc-400" />,
      connected: false,
    },
    {
      name: "Mail",
      icon: <Mail className="h-5 w-5 text-zinc-400" />,
      connected: false,
    },
  ];

  // --- TIME REMAINING CALCULATIONS ---

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
  };

  // Calculate total remaining days/weeks for the footer
  let totalDaysRemaining = 0;
  const todayDayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const totalDaysInYear =
    currentYear % 4 === 0 &&
    (currentYear % 100 !== 0 || currentYear % 400 === 0)
      ? 366
      : 365;
  totalDaysRemaining = totalDaysInYear - todayDayOfYear;

  // --- END TIME REMAINING CALCULATIONS ---

  if (status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Loading Profile...
      </div>
    );
  }

  const imageSrc = session?.user.image || user?.image;

  // =========================================================================
  // JSX RENDER
  // =========================================================================
  return (
        <div className="min-h-screen bg-zinc-950 p-6 text-white">
            
            {/* Profile Header (UNCHANGED) */}
            <div className="mb-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
                <div className="h-24 bg-zinc-800" />
                <div className="relative px-6 pb-6">
                    <div className="-mt-12 relative h-24 w-24 rounded-lg border-4 border-zinc-900 bg-linear-to-br from-blue-600 to-blue-500 shadow-lg">
                        {imageSrc ? (
                            <Image
                                alt="Avatar"
                                className="h-full w-full rounded-md object-cover"
                                height={96}
                                src={imageSrc}
                                width={96}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center font-semibold text-3xl text-white">
                                {user?.name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="mt-4">
                        <h1 className="font-bold text-2xl text-white">{user?.name}</h1>
                        <p className="text-md text-zinc-400">
                            {/* @ts-expect-error */}
                            Profession · {user?.profession}
                        </p>
                    </div>
                    <div className="mt-6 border-zinc-800 border-t pt-6">
                        <h3 className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">
                            Details
                        </h3>
                        <div className="mt-4 flex flex-col space-y-3">
                            <div className="flex items-center text-sm text-zinc-300">
                                <Mail className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-zinc-300">
                                <Calendar className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
                                <span>
                                    Joined{" "}
                                    {user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric",
                                        })
                                        : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards (UNCHANGED) */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Completed Tasks */}
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="shrink-0 rounded-md bg-green-900 p-3">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate font-medium text-sm text-zinc-400">Completed Tasks</dt>
                                    <dd className="flex items-baseline">
                                        <div className="font-semibold text-2xl text-white">{currentStats.completedTasks}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Current Streak */}
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="shrink-0 rounded-md bg-blue-900 p-3">
                                <Zap className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate font-medium text-sm text-zinc-400">Session Streak</dt>
                                    <dd className="flex items-baseline">
                                        <div className="font-semibold text-2xl text-white">{currentStats.streak} min</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Productivity */}
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="shrink-0 rounded-md bg-yellow-900 p-3">
                                <Star className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate font-medium text-sm text-zinc-400">Productivity Rate</dt>
                                    <dd className="flex items-baseline">
                                        <div className="font-semibold text-2xl text-white">{currentStats.productivity}%</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Pending Todos */}
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="shrink-0 rounded-md bg-red-900 p-3">
                                <Clock className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate font-medium text-sm text-zinc-400">Pending Todos</dt>
                                    <dd className="flex items-baseline">
                                        <div className="font-semibold text-2xl text-white">{currentStats.pendingTasks}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CURRENT YEAR DAY GRID (NEW IMPLEMENTATION) */}
            <div className="mb-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow">
                <div className="px-6 pt-5 pb-2 text-center">
                    <h2 className="font-medium text-lg text-white">Remainings</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Your contributions in {currentYear}
                    </p>
                </div>
                <div className="border-zinc-800 border-t px-6 py-4">
                    <div className="overflow-x-auto">
                        <div className="flex flex-row justify-between space-x-4">
                            {months.map((monthName, monthIndex) => {
                                const daysInMonth = getDaysInMonth(currentYear, monthIndex);
                                const firstDay = getFirstDayOfMonth(currentYear, monthIndex);
                                
                                // Create filler cells
                                const fillerCells = Array.from({ length: firstDay }, (_, i) => (
                                    <div key={`filler-${monthIndex}-${i}`} />
                                ));
                                
                                // Create day cells
                                const dayCells = Array.from({ length: daysInMonth }, (_, day) => {
                                    const dayNumber = day + 1;
                                    const cellDate = new Date(currentYear, monthIndex, dayNumber);
                                    
                                    // Compare dates only (ignore time)
                                    const isToday = cellDate.toDateString() === today.toDateString();
                                    const isPast = cellDate < today;

                                    let bgColor = "bg-zinc-800"; // Future/Inactive
                                    if (isToday) {
                                        bgColor = "bg-blue-500"; // Today (Blue)
                                    } else if (isPast) {
                                        bgColor = "bg-emerald-600"; // Past/Completed (Green)
                                    }
                                    
                                    return (
                                        <div 
                                            className={`${bgColor} rounded-full`} 
                                            key={`day-${monthIndex}-${dayNumber}`} 
                                            style={{ width: `${GRID_CELL_SIZE_PX}px`, height: `${GRID_CELL_SIZE_PX}px` }}
                                            title={cellDate.toLocaleDateString()}
                                        />
                                    );
                                });

                                return (
                                    <div className="flex flex-col items-center" key={monthName}>
                                        <div className="mb-2 font-medium text-xs text-zinc-400">
                                            {monthName}
                                        </div>
                                        <div
                                            className="grid grid-flow-col grid-rows-7"
                                            style={{
                                                gap: `${GRID_GAP_PX}px`,
                                                // 7 rows (days) high, auto columns (weeks)
                                                gridTemplateColumns: `repeat(5, ${GRID_CELL_SIZE_PX}px)`, // Max 5 weeks
                                            }}
                                        >
                                            {[...fillerCells, ...dayCells]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Remaining weeks/days summary */}
                    <div className="mt-4 text-center text-sm text-zinc-400">
                        Remaining weeks: <span className="font-semibold">{Math.ceil(totalDaysRemaining / DAYS_IN_WEEK)}</span> | Total days left:{" "}
                        <span className="font-semibold">{totalDaysRemaining}</span>
                    </div>
                </div>
            </div>

            {/* Connected Platforms (UNCHANGED) */}
            <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow">
                <div className="px-6 py-5">
                    <h2 className="font-medium text-lg text-white">
                        Connected Platforms
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Applications integrated with your account
                    </p>
                </div>
                <div className="border-zinc-800 border-t px-6 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {connectedPlatforms.map((platform) => (
                            <div
                                className="flex items-center justify-between rounded-md border border-zinc-800 p-4 hover:bg-zinc-800"
                                key={platform.name}
                            >
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800">
                                        {platform.icon}
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="font-medium text-sm text-white">
                                            {platform.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500">
                                            {platform.connected ? "Connected" : "Not connected"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className={`rounded-md px-3 py-1 font-medium text-sm ${
                                        platform.connected
                                            ? "text-red-400 hover:bg-red-900"
                                            : "text-blue-400 hover:bg-blue-900"
                                    }`}
                                    type="button"
                                >
                                    {platform.connected ? "Disconnect" : "Connect"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
