// app/(protected)/dashboard/page.tsx
"use client";

import {
  AppWindow,
  ArrowUpRight,
  FileText,
  Loader2,
  Package,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAgentsAction } from "@/action/agentActions";
import { getAppsAction } from "@/action/appActions";
import { getAssets } from "@/action/assetAction";
import ActivityTracker from "@/components/dashboard/_components/ActivityTracker";
import DigitalClock from "@/components/dashboard/_components/DigitalClock";
import NotesWidget from "@/components/dashboard/_components/NotesWidget";
import SpotifyConnectPlayer from "@/components/dashboard/_components/SpotifyConnectPlayer";
import Stopwatch from "@/components/dashboard/_components/Stopwatch";
import StockWidget from "@/components/dashboard/_components/stockCard";
import TodoList from "@/components/dashboard/_components/TodoList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client"; // Assuming this is correct
import type { Asset, SessionWithToken } from "@/type/types";

// --- (Helper Types and Functions) ---
type Agent = { id: string };
type App = { id: string };
type ActionResponse<T> = { success: boolean; data: T[] };

function getFormattedDate(date: Date | string | undefined): string {
  if (!date) {
    return "";
  }
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
// --- (End of Helper functions) ---

export default function DashboardPage() {
  // 1. Session and State Management
  const { data: session, isPending: status } = useSession(); // 'isPending' renamed to 'status'
  const spotifyAccessToken: string | null =
    (session as SessionWithToken)?.accessToken || null;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_isError, setIsError] = useState(false);

  const router = useRouter();

  // 2. Auth/Session Effect (FIXED)
  useEffect(() => {

    if (!session?.user) {
      // Now we know it's not loading, and there's no user
      router.push("/login");
    }
  }, [session, router]); // Dependency on status is crucial

  // 3. Data Fetching Effect (FIXED)
  useEffect(() => {
    const fetchData = async () => {
      // Wait for session to be loaded AND authenticated
      if (status || !session?.user) {
        return;
      }

      // If we are here, we are authenticated, but data might still be loading
      // We set isLoading to true only if it's not already true
      // Note: We'll use the session to fetch, so we're good

      try {
        const [assetsResult, agentsResult, appsResult] = await Promise.all([
          getAssets(),
          getAgentsAction(),
          getAppsAction(),
        ]);

        const fetchedAssets: Asset[] = (assetsResult as Asset[]) || [];
        const fetchedAgents = (agentsResult as ActionResponse<Agent>).success
          ? (agentsResult as ActionResponse<Agent>).data
          : [];
        const fetchedApps = (appsResult as ActionResponse<App>).success
          ? (appsResult as ActionResponse<App>).data
          : [];

        setAssets(fetchedAssets);
        setAgents(fetchedAgents);
        setApps(fetchedApps);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [status, session]); // Also depend on the session object

  // 4. Derived Data
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || "User";
  const RECENT_ASSETS_COUNT = 4;
  const recentAssets = assets.slice(0, RECENT_ASSETS_COUNT);

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

  const TOP_STATS_COUNT = 2;
  const topStats = stats.slice(0, TOP_STATS_COUNT);
  const remainingStat = stats.at(TOP_STATS_COUNT);

  // 5. Loading/Error UI
  // The 'isLoading' state is now managed by both session status and data fetching
  if (status || isLoading) {
    return (
      <div className="flex min-h-[88vh] flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="mt-4 text-zinc-400">
          Loading your personalized dashboard...
        </p>
      </div>
    );
  }
  // ... (Error UI omitted for brevity) ...

  // 6. Render Page with Data (FIXED LAYOUT)
  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-6">
      <h1 className="mb-6 font-bold text-3xl text-white">
        Welcome back, {firstName}!
      </h1>

      {/* --- Bento Grid Layout (4-column) --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/*
         ******************************************************
         * ROW 1: Clock (2/4) | Stat 1 (1/4) | Stat 2 (1/4)
         ******************************************************
         */}

        {/* 1. DIGITAL CLOCK (Row 1, Columns 1-2) */}
        <Card className="h-full border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-2">
          <CardContent className="flex h-full items-center justify-center p-0">
            <DigitalClock />
          </CardContent>
        </Card>

        {/* 2. Stat Cards (Row 1, Columns 3-4) */}
        {topStats.map((stat) => (
          <Card
            className="h-full border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-1"
            key={stat.title}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm text-zinc-400">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-3xl">{stat.value}</div>
              <Link
                className="mt-1 flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                href={stat.href}
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}

        {/*
         ******************************************************
         * ROW 2: Recent Assets (2/4) | Stat 3 (1/4) | Stock (1/4)
         ******************************************************
         */}

        {/* 3. Recent Assets (Row 2, Columns 1-2) */}
        <Card className="border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Assets</CardTitle>
            <CardDescription className="text-zinc-400">
              Latest uploads, ready to be used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAssets.length > 0 ? (
              <div className="space-y-4">
                {recentAssets.map((asset) => (
                  <Link
                    className="-m-2 flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-zinc-800"
                    href="/assets"
                    key={asset.id}
                  >
                    <div className="relative h-10 w-10 shrink-0">
                      {asset.fileType?.split("/")[0] === "image" &&
                      asset.fileUrl ? (
                        <Image
                          alt={asset.title}
                          className="rounded object-cover"
                          fill
                          src={asset.fileUrl}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded border border-zinc-700 bg-zinc-800">
                          <FileText className="h-5 w-5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm text-zinc-100">
                        {asset.title}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {asset.description ||
                          `Uploaded ${getFormattedDate(asset.createdAt)}`}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Package className="mx-auto h-10 w-10 text-zinc-600" />
                <p className="mt-2 text-sm text-zinc-500">
                  No assets uploaded yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Remaining Stat Card (Row 2, Column 3) */}
        {remainingStat && (
          <Card
            className="h-full border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-1"
            key={remainingStat.title}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm text-zinc-400">
                {remainingStat.title}
              </CardTitle>
              <remainingStat.icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-3xl">{remainingStat.value}</div>
              <Link
                className="mt-1 flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                href={remainingStat.href}
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 5. Stock Widget (Row 2, Column 4) */}
        <Card className="h-full border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Market Snapshot</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Live market data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockWidget />
          </CardContent>
        </Card>

        {/*
         ******************************************************
         * ROW 3: Spotify (2/4) | Todo List (2/4)
         ******************************************************
         */}

        {/* 6. SPOTIFY PLAYER (Row 3, Columns 1-2) */}
        <Card className="border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spotify Connect</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Web Playback Device
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <SpotifyConnectPlayer accessToken={spotifyAccessToken} />
          </CardContent>
        </Card>

        {/* 7. TO-DO LIST (Row 3, Columns 3-4) */}
        <Card className="border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-2">
          <CardContent className="h-full pt-2">
            <TodoList />
          </CardContent>
        </Card>

        {/*
         ******************************************************
         * ROW 4: Stopwatch (1/4) | Notes (2/4) | Activity (1/4)
         ******************************************************
         */}

        {/* 8. STOPWATCH (Row 4, Column 1) */}
        <Card className="h-full border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-1">
          <CardContent>
            <Stopwatch />
          </CardContent>
        </Card>

        {/* 9. NOTES WIDGET (Row 4, Columns 2-3) */}
        <Card className="flex h-full flex-col border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick Notes</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Your notes are saved locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <NotesWidget />
          </CardContent>
        </Card>

        {/* 10. ACTIVITY TRACKER (Row 4, Column 4) */}
        <Card className="h-full border-zinc-800 bg-zinc-900 text-white shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Activity Tracker</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
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
