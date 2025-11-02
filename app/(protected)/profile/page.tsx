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
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useActivity } from "@/contexts/ActivityContext";
import { getAssets } from "@/action/assetAction";
import { type Asset } from "@/lib/types";
import { useRouter } from "next/navigation";

/**
 * Calculates productivity based on completed and pending tasks.
 */
const calculateProductivity = (completed: number, pending: number) => {
    const total = completed + pending;
    // If there are no tasks, productivity is 0%
    if (total === 0) return 0;
    // Calculation: (Completed / Total) * 100
    return Math.round((completed / total) * 100);
};

/**
 * Calculates a "streak" based on minutes of session activity.
 */
const calculateStreak = (timeSpent: number) => {
    return Math.floor(timeSpent / 60); // Returns total minutes
};

// The key used by the TodoList widget
const LOCAL_STORAGE_KEY = "dashboardUserTodos";

export default function Profile() {
    const { data: session, isPending: status } = useSession();
    const { timeSpent } = useActivity(); // Get session activity time

    // --- STATE ---
    // Stats fetched from DB (or mocked)
    const [totalAssetsCount, setTotalAssetsCount] = useState(0);
    const [totalDownloadsCount] = useState(32); // Mocked value

    // Stats fetched from Local Storage
    const [completedTodosCount, setCompletedTodosCount] = useState(0);
    const [pendingTodosCount, setPendingTodosCount] = useState(0);

    const user = session?.user;

    const router = useRouter();


    // Effect 1: Fetch Total Asset Count (Server Action)
    const fetchAssetCount = useCallback(async () => {
        if (!user) {
            
            router.push("/login");
        
        };
        try {
            // Use getAssets to fetch the actual list
            const assets: Asset[] = await getAssets();
            setTotalAssetsCount(assets.length);
        } catch (error) {
            console.error("Failed to load assets count:", error);
            setTotalAssetsCount(0); // Default to 0 on error
        }
    }, [status]); // Depends on session status

    // Effect 2: Load Todo Stats (Local Storage)
    useEffect(() => {
        // This runs only on the client side
        if (typeof window !== "undefined") {
            const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedTodos) {
                try {
                    const todos = JSON.parse(storedTodos);
                    const completed = todos.filter(
                        (t: any) => t.isCompleted
                    ).length;
                    const pending = todos.filter(
                        (t: any) => !t.isCompleted
                    ).length;

                    setCompletedTodosCount(completed);
                    setPendingTodosCount(pending);
                } catch (e) {
                    console.error(
                        "Failed to parse todos from localStorage:",
                        e
                    );
                    // Leave counts as 0 if parsing fails
                    setCompletedTodosCount(0);
                    setPendingTodosCount(0);
                }
            }
        }
    }, []); // Runs once on mount

    // Effect 3: Trigger DB fetch when session is ready
    useEffect(() => {
        if (user) {
            fetchAssetCount();
        }
    }, [status, fetchAssetCount]);

    // --- DERIVED STATS FOR JSX ---
    const currentStats = {
        // Core Todo Stats (from Local Storage)
        completedTasks: completedTodosCount,
        pendingTasks: pendingTodosCount,

        // Calculated Stats (uses local storage counts for inputs)
        productivity: calculateProductivity(
            completedTodosCount,
            pendingTodosCount
        ),

        // Activity & Mock/DB Stats
        streak: calculateStreak(timeSpent),
        totalDownloads: totalDownloadsCount, // Mocked
        totalAssets: totalAssetsCount, // From DB
    };

    // =========================================================================
    // REMAINING LOGIC (Time Left, Contributions, etc. - Unchanged)
    // =========================================================================

    // Time Left state and calculation (unchanged)
    const [timeLeft, setTimeLeft] = useState({ year: 0, week: 0 });

    useEffect(() => {
        const updateTimeLeft = () => {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
            const yearProgress =
                ((now.getTime() - startOfYear.getTime()) /
                    (endOfYear.getTime() - startOfYear.getTime())) *
                100;

            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            const weekProgress =
                ((now.getTime() - startOfWeek.getTime()) /
                    (endOfWeek.getTime() - startOfWeek.getTime())) *
                100;

            setTimeLeft({
                year: parseFloat(yearProgress.toFixed(1)),
                week: parseFloat(weekProgress.toFixed(1)),
            });
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 60000);
        return () => clearInterval(interval);
    }, []);

    // Connected platforms (unchanged)
    const connectedPlatforms = [
        {
            name: "GitHub",
            icon: <Github className='h-5 w-5 text-zinc-400' />,
            connected: false,
        },
        {
            name: "GitLab",
            icon: <Gitlab className='h-5 w-5 text-zinc-400' />,
            connected: false,
        },
        {
            name: "Slack",
            icon: <Slack className='h-5 w-5 text-zinc-400' />,
            connected: false,
        },
        {
            name: "Trello",
            icon: <Trello className='h-5 w-5 text-zinc-400' />,
            connected: false,
        },
        {
            name: "Mail",
            icon: <Mail className='h-5 w-5 text-zinc-400' />,
            connected: false,
        },
    ];

    // Contributions logic (unchanged)
    type Contribution = { date: Date; count: number | null };
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [currentYear] = useState(2025);

    // Format date for tooltip
    const formatTooltipDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Generate contributions for 2025 up to today (unchanged, using currentYear)
    const generateContributions = () => {
        const newContributions = [];
        const today = new Date();
        const startDate = new Date(currentYear, 0, 1);

        for (
            let d = new Date(startDate);
            d <= today;
            d.setDate(d.getDate() + 1)
        ) {
            if (d.getFullYear() === currentYear) {
                newContributions.push({
                    date: new Date(d),
                    count: Math.floor(Math.random() * 10),
                });
            }
        }

        const endDate = new Date(currentYear, 11, 31);
        for (
            let d = new Date(today);
            d <= endDate;
            d.setDate(d.getDate() + 1)
        ) {
            if (d > today && d.getFullYear() === currentYear) {
                newContributions.push({
                    date: new Date(d),
                    count: null,
                });
            }
        }
        return newContributions;
    };

    useEffect(() => {
        setContributions(generateContributions());
    }, []);

    function calculateRemainingWeeks() {
        const start = new Date();
        const end = new Date(2025, 11, 31);
        if (start > end) return 0;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.ceil(diffDays / 7);
    }

    function calculateRemainingDays() {
        const start = new Date();
        const end = new Date(2025, 11, 31);
        if (start > end) return 0;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

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

    // 3. Handle Auth States
    if (status) {
        return (
            <div className='min-h-[88vh] bg-zinc-950 text-white flex items-center justify-center'>
                Loading Profile...
            </div>
        );
    }

    // =========================================================================
    // JSX RENDER (Now using 'currentStats' derived from local data)
    // =========================================================================
    return (
        <div className='min-h-screen bg-zinc-950 text-white'>
            {/* Profile Header */}
            <div className='mb-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg'>
                {/* Banner Area */}
                <div className='h-24 bg-zinc-800' />

                {/* Content Area */}
                <div className='relative px-6 pb-6'>
                    {/* Overlapping Avatar */}
                    <div className='relative -mt-12 h-24 w-24 rounded-lg border-4 border-zinc-900 bg-linear-to-br from-blue-600 to-blue-500 shadow-lg'>
                        {session?.user.image ? (
                            <Image
                                src={session?.user.image}
                                alt='Avatar'
                                width={96}
                                height={96}
                                className='h-full w-full rounded-md object-cover' // Use rounded-md to match inner radius
                            />
                        ) : user?.image ? (
                            <Image
                                src={user.image}
                                alt='Avatar'
                                width={96}
                                height={96}
                                className='h-full w-full rounded-md object-cover'
                            />
                        ) : (
                            <div className='flex h-full w-full items-center justify-center text-3xl font-semibold text-white'>
                                {user?.name?.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* User Name & Role */}
                    <div className='mt-4'>
                        <h1 className='text-2xl font-bold text-white'>
                            {user?.name}
                        </h1>
                        <p className='text-md text-zinc-400'>
                            Profession · {user?.profession}
                        </p>
                    </div>

                    {/* Details Section */}
                    <div className='mt-6 border-t border-zinc-800 pt-6'>
                        <h3 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
                            Details
                        </h3>
                        <div className='mt-4 flex flex-col space-y-3'>
                            <div className='flex items-center text-sm text-zinc-300'>
                                <Mail className='mr-2 h-4 w-4 shrink-0 text-zinc-500' />
                                <span>{user?.email}</span>
                            </div>
                            <div className='flex items-center text-sm text-zinc-300'>
                                <Calendar className='mr-2 h-4 w-4 shrink-0 text-zinc-500' />
                                <span>
                                    Joined{" "}
                                    {user?.createdAt
                                        ? new Date(
                                              user.createdAt
                                          ).toLocaleDateString("en-US", {
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
            {/* Stats Cards (UPDATED) */}
            <div className='mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                {/* 1. Completed Tasks (from Local Storage) */}
                <div className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='shrink-0 rounded-md bg-green-900 p-3'>
                                <CheckCircle className='h-6 w-6 text-green-400' />
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='truncate text-sm font-medium text-zinc-400'>
                                        Completed Tasks
                                    </dt>
                                    <dd className='flex items-baseline'>
                                        <div className='text-2xl font-semibold text-white'>
                                            {currentStats.completedTasks}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Current Streak (ActivityContext) */}
                <div className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='shrink-0 rounded-md bg-blue-900 p-3'>
                                <Zap className='h-6 w-6 text-blue-400' />
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='truncate text-sm font-medium text-zinc-400'>
                                        Session Streak
                                    </dt>
                                    <dd className='flex items-baseline'>
                                        <div className='text-2xl font-semibold text-white'>
                                            {currentStats.streak} min
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Productivity (Calculated from Local Storage) */}
                <div className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='shrink-0 rounded-md bg-yellow-900 p-3'>
                                <Star className='h-6 w-6 text-yellow-400' />
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='truncate text-sm font-medium text-zinc-400'>
                                        Productivity Rate
                                    </dt>
                                    <dd className='flex items-baseline'>
                                        <div className='text-2xl font-semibold text-white'>
                                            {currentStats.productivity}%
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Pending Todos (Local Storage) */}
                <div className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow'>
                    <div className='p-5'>
                        <div className='flex items-center'>
                            <div className='shrink-0 rounded-md bg-red-900 p-3'>
                                <Clock className='h-6 w-6 text-red-400' />
                            </div>
                            <div className='ml-5 w-0 flex-1'>
                                <dl>
                                    <dt className='truncate text-sm font-medium text-zinc-400'>
                                        Pending Todos
                                    </dt>
                                    <dd className='flex items-baseline'>
                                        <div className='text-2xl font-semibold text-white'>
                                            {currentStats.pendingTasks}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contribution Graph (unchanged) */}
            <div className='mb-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow'>
                <div className='px-6 py-5 text-center'>
                    <h2 className='text-lg font-medium text-white'>
                        Remainings
                    </h2>
                    <p className='mt-1 text-sm text-zinc-400'>
                        Your contributions in {currentYear}
                    </p>
                </div>
                <div className='border-t border-zinc-800 px-6 py-4'>
                    <div className='overflow-x-auto'>
                        <div className='flex items-center justify-center space-x-6 space-y-0'>
                            {months.map((month, monthIdx) => {
                                const formattedMonth =
                                    month.charAt(0).toUpperCase() +
                                    month.slice(1).toLowerCase();
                                const daysInMonth = new Date(
                                    currentYear,
                                    monthIdx + 1,
                                    0
                                ).getDate();
                                const monthContributions = contributions.filter(
                                    (c) => c.date.getMonth() === monthIdx
                                );
                                const originalPaddedContributions = Array.from(
                                    { length: daysInMonth },
                                    (_, dayIdx) => {
                                        const contribution =
                                            monthContributions.find(
                                                (c) =>
                                                    c.date.getDate() ===
                                                    dayIdx + 1
                                            );
                                        return (
                                            contribution ?? {
                                                date: new Date(
                                                    currentYear,
                                                    monthIdx,
                                                    dayIdx + 1
                                                ),
                                                count: null,
                                            }
                                        );
                                    }
                                );
                                const originalWeeksInMonth = Math.min(
                                    Math.ceil(daysInMonth / 7),
                                    5
                                );

                                return (
                                    <div
                                        key={formattedMonth}
                                        className='space-y-2 text-center'
                                    >
                                        <div className='text-center text-xs font-medium text-zinc-400'>
                                            {formattedMonth}
                                        </div>
                                        <div
                                            className={`mx-auto grid grid-flow-col grid-rows-7 justify-center gap-1`}
                                            style={{
                                                gridTemplateColumns: `repeat(${originalWeeksInMonth}, 12px)`,
                                            }}
                                        >
                                            {originalPaddedContributions.map(
                                                (contribution, idx) => {
                                                    const isPastDate =
                                                        contribution.date <=
                                                        new Date();
                                                    let bgColor = "bg-zinc-800";
                                                    if (
                                                        isPastDate &&
                                                        contribution.count !==
                                                            null
                                                    ) {
                                                        if (
                                                            contribution.count >
                                                            7
                                                        ) {
                                                            bgColor =
                                                                "bg-emerald-600";
                                                        } else if (
                                                            contribution.count >
                                                            4
                                                        ) {
                                                            bgColor =
                                                                "bg-emerald-700";
                                                        } else if (
                                                            contribution.count >
                                                            0
                                                        ) {
                                                            bgColor =
                                                                "bg-emerald-800";
                                                        } else {
                                                            bgColor =
                                                                "bg-zinc-700";
                                                        }
                                                    } else if (!isPastDate) {
                                                        bgColor =
                                                            "bg-zinc-900 border border-zinc-700";
                                                    } else if (
                                                        isPastDate &&
                                                        contribution.count ===
                                                            null
                                                    ) {
                                                        bgColor = "bg-zinc-800";
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`h-3 w-3 rounded-sm ${bgColor} hover:ring-2 ring-blue-500 cursor-pointer`}
                                                            title={
                                                                contribution.count !==
                                                                null
                                                                    ? `${
                                                                          contribution.count
                                                                      } contributions on ${formatTooltipDate(
                                                                          contribution.date
                                                                      )}`
                                                                    : isPastDate
                                                                    ? `No contributions on ${formatTooltipDate(
                                                                          contribution.date
                                                                      )}`
                                                                    : `Future date`
                                                            }
                                                            aria-label={
                                                                contribution.count !==
                                                                null
                                                                    ? `${
                                                                          contribution.count
                                                                      } contributions on ${formatTooltipDate(
                                                                          contribution.date
                                                                      )}`
                                                                    : "No contributions"
                                                            }
                                                        />
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Add remaining weeks and total dates */}
                        <div className='mt-4 text-center text-sm text-zinc-400'>
                            Remaining weeks: {calculateRemainingWeeks()} | Total
                            days left: {calculateRemainingDays()}
                        </div>
                    </div>
                </div>
            </div>
            {/* Connected Platforms (unchanged) */}
            <div className='overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow'>
                <div className='px-6 py-5'>
                    <h2 className='text-lg font-medium text-white'>
                        Connected Platforms
                    </h2>
                    <p className='mt-1 text-sm text-zinc-400'>
                        Applications integrated with your account
                    </p>
                </div>
                <div className='border-t border-zinc-800 px-6 py-4'>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        {connectedPlatforms.map((platform) => (
                            <div
                                key={platform.name}
                                className='flex items-center justify-between rounded-md border border-zinc-800 p-4 hover:bg-zinc-800'
                            >
                                <div className='flex items-center'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800'>
                                        {platform.icon}
                                    </div>
                                    <div className='ml-4'>
                                        <h3 className='text-sm font-medium text-white'>
                                            {platform.name}
                                        </h3>
                                        <p className='text-sm text-zinc-500'>
                                            {platform.connected
                                                ? "Connected"
                                                : "Not connected"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className={`rounded-md px-3 py-1 text-sm font-medium ${
                                        platform.connected
                                            ? "text-red-400 hover:bg-red-900"
                                            : "text-blue-400 hover:bg-blue-900"
                                    }`}
                                >
                                    {platform.connected
                                        ? "Disconnect"
                                        : "Connect"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}