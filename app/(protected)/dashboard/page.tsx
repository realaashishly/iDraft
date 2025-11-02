// app/(protected)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAssets } from "@/action/assetAction";
import { getAgentsAction } from "@/action/agentActions";
import { getAppsAction } from "@/action/appActions";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    ArrowUpRight,
    FileText,
    Users,
    AppWindow,
    Package,
    Video,
    AudioWaveform,
    Loader2,
} from "lucide-react";

// Import all components
import SpotifyConnectPlayer from "@/components/dashboard/_components/SpotifyConnectPlayer";
import TodoList from "@/components/dashboard/_components/TodoList";
import StockWidget from "@/components/dashboard/_components/stockCard";
import DigitalClock from "@/components/dashboard/_components/DigitalClock";
import Stopwatch from "@/components/dashboard/_components/Stopwatch";
import NotesWidget from "@/components/dashboard/_components/NotesWidget"; // ⬅️ 1. IMPORT NOTES WIDGET

import { type Asset } from "@/lib/types";
import { useSession } from "@/lib/auth-client";
import ActivityTracker from "@/components/dashboard/_components/ActivityTracker";
import { useRouter } from "next/navigation";

// --- (Helper Types and Functions... unchanged) ---
type Agent = { id: string };
type App = { id: string };
type ActionResponse<T> = { success: boolean; data: T[] };
const iconMap: { [key: string]: React.ElementType } = {
    default: FileText,
    image: Package,
    pdf: FileText,
    video: Video,
    audio: AudioWaveform,
};
function getFormattedDate(date: Date | string | undefined): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}
// --- (End of Helper functions) ---

export default function DashboardPage() {
    // 1. Session and State Management (Unchanged)
    const { data: session, isPending: status } = useSession();
    const spotifyAccessToken: string | null =
        (session as any)?.accessToken || null;

    const [assets, setAssets] = useState<Asset[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [apps, setApps] = useState<App[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [_isError, setIsError] = useState(false);
    
        const router = useRouter();
    
        useEffect(() => {
            if (!session?.user) {
                router.push("/login");
            }
        }, [session, router]);

    // 2. Data Fetching Effect (Unchanged)
    useEffect(() => {
        const fetchData = async () => {
            if (!status) return;
            
            try {
                const [assetsResult, agentsResult, appsResult] =
                    await Promise.all([
                        getAssets(),
                        getAgentsAction(),
                        getAppsAction(),
                    ]);
                const fetchedAssets: Asset[] = (assetsResult as Asset[]) || [];
                const fetchedAgents = (agentsResult as ActionResponse<Agent>)
                    .success
                    ? (agentsResult as ActionResponse<Agent>).data
                    : [];
                const fetchedApps = (appsResult as ActionResponse<App>).success
                    ? (appsResult as ActionResponse<App>).data
                    : [];
                setAssets(fetchedAssets);
                setAgents(fetchedAgents);
                setApps(fetchedApps);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [status]);

    // 3. Derived Data (Unchanged)
    const user = session?.user;
    const firstName = user?.name?.split(" ")[0] || "User";
    const recentAssets = assets.slice(0, 4);

    const stats = [
        {
            title: "Total Prompts",
            value: agents.length,
            icon: Users,
            href: "/prompts",
        },
        {
            title: "Total Assets",
            value: assets.length,
            icon: Package,
            href: "/assets",
        },
        {
            title: "Total Apps",
            value: apps.length,
            icon: AppWindow,
            href: "/apps",
        },
    ];
    const topStats = stats.slice(0, 2);
    const remainingStat = stats.slice(2, 3)[0];

    // 4. Loading/Error UI (Unchanged)
    if (isLoading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[88vh] bg-zinc-950 text-zinc-100 p-6'>
                <Loader2 className='h-10 w-10 animate-spin text-zinc-400' />
                <p className='mt-4 text-zinc-400'>
                    Loading your personalized dashboard...
                </p>
            </div>
        );
    }
    // ... (Error UI omitted for brevity) ...

    // 5. Render Page with Data
    return (
        <div className='p-4 md:p-6 min-h-screen bg-zinc-950 text-zinc-100'>
            <h1 className='text-3xl font-bold text-white mb-6'>
                Welcome back, {firstName}!
            </h1>

            {/* --- Bento Grid Layout (4-column) --- 
                Row 1: | Clock (2/4) | Stat 1 (1/4) | Stat 2 (1/4) |
                Row 2: | Recent Assets (2/4) | Stat 3 (1/4) | Stock Widget (1/4) |
                Row 3: | Spotify (2/4) | Todo List (2/4) |
                Row 4: | Stopwatch (1/4) | Calendar (3/4) |
                Row 5: | Notes (2/4) | ... (2/4 empty) ... |
            */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                

                {/* 1. DIGITAL CLOCK (Row 1, Columns 1-2) */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-2 h-full'>
                    <CardContent className='p-0 flex items-center justify-center h-full'>
                        <DigitalClock />
                    </CardContent>
                </Card>

                {/* 2. Stat Cards (Row 1, Columns 3-4) */}
                {topStats.map((stat) => (
                    <Card
                        key={stat.title}
                        className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-1 h-full'
                    >
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium text-zinc-400'>
                                {stat.title}
                            </CardTitle>
                            <stat.icon className='h-4 w-4 text-zinc-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-3xl font-bold'>
                                {stat.value}
                            </div>
                            <Link
                                href={stat.href}
                                className='text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1 flex items-center gap-1'
                            >
                                View all <ArrowUpRight className='h-3 w-3' />
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {/* 3. Recent Assets (Row 2, Columns 1-2) */}
                <Card className='lg:col-span-2 bg-zinc-900 border-zinc-800 text-white shadow-lg'>
                    <CardHeader>
                        <CardTitle>Recent Assets</CardTitle>
                        <CardDescription className='text-zinc-400'>
                            Latest uploads, ready to be used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentAssets.length > 0 ? (
                            <div className='space-y-4'>
                                {recentAssets.map((asset) => (
                                    <Link
                                        href='/assets'
                                        key={asset.id}
                                        className='flex items-center gap-4 p-2 -m-2 rounded-lg hover:bg-zinc-800 transition-colors'
                                    >
                                        <div className='relative h-10 w-10 shrink-0'>
                                            {asset.fileType?.split("/")[0] ===
                                                "image" && asset.fileUrl ? (
                                                <Image
                                                    src={asset.fileUrl}
                                                    alt={asset.title}
                                                    fill
                                                    className='rounded object-cover'
                                                />
                                            ) : (
                                                <div className='h-10 w-10 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700'>
                                                    <FileText className='h-5 w-5 text-zinc-400' />
                                                </div>
                                            )}
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-medium truncate text-zinc-100'>
                                                {asset.title}
                                            </p>
                                            <p className='text-xs text-zinc-400 truncate'>
                                                {asset.description ||
                                                    `Uploaded ${getFormattedDate(
                                                        asset.createdAt
                                                    )}`}
                                            </p>
                                        </div>
                                        <ArrowUpRight className='h-4 w-4 text-zinc-500 shrink-0' />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-6'>
                                <Package className='h-10 w-10 mx-auto text-zinc-600' />
                                <p className='text-sm text-zinc-500 mt-2'>
                                    No assets uploaded yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Remaining Stat Card (Row 2, Column 3) */}
                {remainingStat && (
                    <Card
                        key={remainingStat.title}
                        className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-1 h-full'
                    >
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium text-zinc-400'>
                                {remainingStat.title}
                            </CardTitle>
                            <remainingStat.icon className='h-4 w-4 text-zinc-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-3xl font-bold'>
                                {remainingStat.value}
                            </div>
                            <Link
                                href={remainingStat.href}
                                className='text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1 flex items-center gap-1'
                            >
                                View all <ArrowUpRight className='h-3 w-3' />
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* 5. Stock Widget (Row 2, Column 4) */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-1 h-full'>
                    <CardHeader>
                        <CardTitle className='text-base'>
                            Market Snapshot
                        </CardTitle>
                        <CardDescription className='text-zinc-400 text-xs'>
                            Live market data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StockWidget />
                    </CardContent>
                </Card>

                {/* 7. TO-DO LIST (Row 3, Columns 3-4) */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-2'>
                    {/* <CardHeader>
                        <CardTitle className='text-base'>
                            
                        </CardTitle>
                        <CardDescription className='text-zinc-400 text-xs'>
                            
                        </CardDescription>
                    </CardHeader> */}
                    <CardContent className='h-full pt-2'>
                        <TodoList />
                    </CardContent>
                </Card>

                {/* 10. ⬅️ NOTES WIDGET ADDED (Row 5, Columns 1-2) */}

                {/* FIX 1: Add h-full to make the card match the row height, and flex flex-col to allow content to grow */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-2 **h-full flex flex-col**'>
                    <CardHeader>
                        <CardTitle className='text-base'>Quick Notes</CardTitle>
                        <CardDescription className='text-zinc-400 text-xs'>
                            Your notes are saved locally in your browser.
                        </CardDescription>
                    </CardHeader>

                    {/* FIX 2: Add flex-1 to make the content area fill all remaining space in the card */}
                    <CardContent className='flex-1'>
                        <NotesWidget />
                    </CardContent>
                </Card>

                {/* 8. STOPWATCH (Row 4, Column 1) */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-1 h-full'>
                    
                    <CardContent>
                        <Stopwatch />
                    </CardContent>
                </Card>

                

                {/* 6. SPOTIFY PLAYER (Row 3, Columns 1-2) */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-2 '>
                    <CardHeader>
                        <CardTitle className='text-base'>
                            Spotify Connect
                        </CardTitle>
                        <CardDescription className='text-zinc-400 text-xs'>
                            Web Playback Device
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='p-4'>
                        <SpotifyConnectPlayer
                            accessToken={spotifyAccessToken}
                        />
                    </CardContent>
                </Card>

                

                {/* 11. ⬅️ ACTIVITY TRACKER ADDED (Row 5, Column 3) */}
                <Card className='bg-zinc-900 border-zinc-800 text-white shadow-lg lg:col-span-1 h-full'>
                    <CardHeader>
                        <CardTitle className='text-base'>
                            Activity Tracker
                        </CardTitle>
                        <CardDescription className='text-zinc-400 text-xs'>
                            Your usage this session
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActivityTracker />
                    </CardContent>
                </Card>
            </div>
            {/* --- Bento Grid End --- */}
        </div>
    );
}
