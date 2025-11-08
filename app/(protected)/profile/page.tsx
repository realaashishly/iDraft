"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Github,
  Gitlab, // Was imported but not used, so I added it to the list
  Mail,
  Slack,
  Star,
  Trello,
  Zap, // Using Zap as a placeholder icon for Discord
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getAssets } from "@/action/assetAction";
import { useActivity } from "@/contexts/ActivityContext";
import { useSession } from "@/lib/auth-client";
import type { Asset, Todo } from "@/type/types";
import { FaSpotify } from "react-icons/fa";

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

// --- NEW: PLATFORM DEFINITIONS ---
// Moved outside component, added 'id' for provider matching
const PLATFORM_DEFINITIONS = [
  {
    id: "github",
    name: "GitHub",
    icon: <Github className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
  },
//   {
//     id: "gitlab",
//     name: "GitLab",
//     icon: <Gitlab className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
//   },
  {
    id: "slack",
    name: "Slack",
    icon: <Slack className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
  },
//   {
//     id: "trello",
//     name: "Trello",
//     icon: <Trello className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
//   },
//   {
//     id: "google", // Assuming 'Mail' corresponds to 'google' provider
//     name: "Google Mail",
//     icon: <Mail className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
//   },
  {
    id: "discord", // Added based on your previous logs
    name: "Discord",
    icon: <Zap className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />, // Using Zap icon
  },
  {
    id: 'spotify',
    name: "Spotify",
    icon: <FaSpotify className="h-5 w-5 text-zinc-500 dark:text-zinc-400"/>
  }
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

  // --- NEW: STATE FOR CONNECTIONS ---
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(true);

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

  // --- NEW: FETCH CONNECTIONS ---
  const fetchConnections = useCallback(async () => {
    if (!user) return; // Wait for session

    setIsConnectionsLoading(true);
    try {
      // NOTE: Adjust this API endpoint to your backend route
      const response = await fetch("/api/user/connections");
      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }
      const result = await response.json();

      if (result.success) {
        setConnections(result.data); // e.g., { discord: true, github: false }
      } else {
        console.error("Failed to get connections:", result.message);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      // Set all to false as a fallback
      const fallbackConnections: Record<string, boolean> = {};
      PLATFORM_DEFINITIONS.forEach((p) => {
        fallbackConnections[p.id] = false;
      });
      setConnections(fallbackConnections);
    } finally {
      setIsConnectionsLoading(false);
    }
  }, [user]); // Depend on the user object

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user, fetchConnections]); // Run when fetchConnections (and thus user) is ready
  // --- END FETCH CONNECTIONS ---

  // --- NEW: CONNECTION CLICK HANDLER ---
  const handleConnectionClick = async (
    platformId: string,
    isConnected: boolean
  ) => {
    if (isConnected) {
      // --- DISCONNECT LOGIC ---
      try {
        // NOTE: Adjust this API endpoint
        const response = await fetch("/api/user/connections", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId: platformId }),
        });

        if (response.ok) {
          // Update state locally to reflect change
          setConnections((prev) => ({ ...prev, [platformId]: false }));
        } else {
          console.error("Failed to disconnect");
          // You might want to show an error toast here
        }
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    } else {
      // --- CONNECT LOGIC ---
      // Redirect to your provider auth endpoint
      // NOTE: Adjust this URL structure if needed
      router.push(`/api/auth/connect/${platformId}`);
    }
  };
  // --- END CLICK HANDLER ---

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

  // --- THIS STATIC ARRAY IS NOW DELETED ---
  // const connectedPlatforms = [ ... ];

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
      <div className="flex min-h-screen items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
        Loading Profile...
      </div>
    );
  }

  // --- NEW: DYNAMIC PLATFORM LIST ---
  // This is generated on every render based on the latest state
  const connectedPlatforms = PLATFORM_DEFINITIONS.map((platform) => ({
    ...platform,
    connected: !!connections[platform.id], // Get status from state, '!!' ensures boolean
  }));

  const imageSrc = session?.user.image || user?.image;

  // =========================================================================
  // JSX RENDER
  // =========================================================================
  return (
    <div className="min-h-screen bg-white p-6 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      {/* Profile Header */}
      <div className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 relative h-24 w-24 rounded-lg border-4 border-zinc-50 bg-linear-to-br from-blue-600 to-blue-500 shadow-lg dark:border-zinc-900">
            {imageSrc ? (
              <Image
                alt="Avatar"
                className="h-full w-full rounded-md object-cover"
                height={96}
                src={imageSrc}
                width={96}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{user?.name}</h1>
            <p className="text-md text-zinc-500 dark:text-zinc-400">
              {/* @ts-expect-error */}
              Profession · {user?.profession}
            </p>
          </div>
          <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Details
            </h3>
            <div className="mt-4 flex flex-col space-y-3">
              <div className="flex items-center text-sm text-zinc-700 dark:text-zinc-300">
                <Mail className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center text-sm text-zinc-700 dark:text-zinc-300">
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

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Completed Tasks */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-md bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Completed Tasks
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                      {currentStats.completedTasks}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Current Streak */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-md bg-blue-100 p-3 dark:bg-blue-900">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Session Streak
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                      {currentStats.streak} min
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Productivity */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-md bg-yellow-100 p-3 dark:bg-yellow-900">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Productivity Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                      {currentStats.productivity}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Pending Todos */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-md bg-red-100 p-3 dark:bg-red-900">
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Pending Todos
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                      {currentStats.pendingTasks}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT YEAR DAY GRID */}
      <div className="mb-6 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-6 pt-5 pb-2 text-center">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Remainings</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your contributions in {currentYear}
          </p>
        </div>
        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <div className="flex flex-row justify-between space-x-4">
              {months.map((monthName, monthIndex) => {
                const daysInMonth = getDaysInMonth(currentYear, monthIndex);
                const firstDay = getFirstDayOfMonth(currentYear, monthIndex);

                // Create filler cells
                const fillerCells = Array.from(
                  { length: firstDay },
                  (_, i) => <div key={`filler-${monthIndex}-${i}`} />
                );

                // Create day cells
                const dayCells = Array.from(
                  { length: daysInMonth },
                  (_, day) => {
                    const dayNumber = day + 1;
                    const cellDate = new Date(
                      currentYear,
                      monthIndex,
                      dayNumber
                    );

                    // Compare dates only (ignore time)
                    const isToday =
                      cellDate.toDateString() === today.toDateString();
                    const isPast = cellDate < today;

                    let bgColor = "bg-zinc-100 dark:bg-zinc-800"; // Future/Inactive
                    if (isToday) {
                      bgColor = "bg-blue-500"; // Today (Blue)
                    } else if (isPast) {
                      bgColor = "bg-emerald-500 dark:bg-emerald-600"; // Past/Completed (Green)
                    }

                    return (
                      <div
                        className={`${bgColor} rounded-full`}
                        key={`day-${monthIndex}-${dayNumber}`}
                        style={{
                          width: `${GRID_CELL_SIZE_PX}px`,
                          height: `${GRID_CELL_SIZE_PX}px`,
                        }}
                        title={cellDate.toLocaleDateString()}
                      />
                    );
                  }
                );

                return (
                  <div
                    className="flex flex-col items-center"
                    key={monthName}
                  >
                    <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
          <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Remaining weeks:{" "}
            <span className="font-semibold">
              {Math.ceil(totalDaysRemaining / DAYS_IN_WEEK)}
            </span>{" "}
            | Total days left:{" "}
            <span className="font-semibold">{totalDaysRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}