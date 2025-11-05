"use client";

import {
    Home,
    Menu,
    Package,
    Settings,
    Users,
    X,
    Music, // Spotify
    Mail, // Google Mail
    Slack,
    Github,
    Plug, // Connect Icon
    CheckCircle, // Connected Icon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FaDiscord } from "react-icons/fa";

// 1. Import Auth Hooks and Connection Functions
import { connectGithub, useSession } from "@/lib/auth-client";
import {
    connectDiscord,
    connectSlack,
    connectSpotify,
    requestGoogleMailAccess,
} from "@/lib/auth-client";
import { checkProviderConnection } from "@/action/providerCheckAction";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

interface AppItem {
    name: string;
    icon: React.ElementType;
    key: string;
    href?: string;
}

interface NavItem {
    name: string;
    icon: React.ElementType;
    href: string;
}

interface SidebarSectionProps {
    title: string;
    items: (NavItem | AppItem)[];
    isCollapsed: boolean;
    pathname: string | null;
    appConnections?: Record<string, boolean>;
    handleConnect?: (key: string) => void;
}

// =========================================================================
// SIDEBAR (MAIN COMPONENT)
// =========================================================================

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [appConnections, setAppConnections] = useState<
        Record<string, boolean>
    >({
        spotify: false,
        google: false,
        slack: false,
        github: false,
        discord: false,
    });

    useEffect(() => {
        async function fetchConnections() {
            try {
                const { success, data } = await checkProviderConnection();
                
                if (success) {
                    setAppConnections(data);
                } else {
                    console.error("Failed to fetch provider connections.");
                }
            } catch (e) {
                console.error("Error fetching connections:", e);
            }
        }

        fetchConnections();


    }, [session]);

    // 2. CONNECTION HANDLER
    const handleConnect = async (key: string) => {
        try {
            let socialConnect;
            if (key === "google") {
                socialConnect = await requestGoogleMailAccess();
            } else if (key === "discord") {
                socialConnect = await connectDiscord();
            } else if (key === "spotify") {
                socialConnect = await connectSpotify();
            } else if (key === "slack") {
                socialConnect = await connectSlack();
            } else if (key === "github") {
                socialConnect = await connectGithub();
            }
        } catch (e) {
            console.error(`Failed to start connection flow for ${key}`, e);
        }
    };

    // 3. Disconnect Handler (REMOVED)

    // 4. Navigation items
    const navItems: NavItem[] = [
        { name: "Dashboard", icon: Home, href: "/dashboard" },
        { name: "Prompts", icon: Users, href: "/prompts" },
        { name: "Assets", icon: Package, href: "/assets" },
    ];

    // App items
    const appItems: AppItem[] = [
        { name: "Spotify", icon: Music, key: "spotify" },
        // { name: "Google Mail", icon: Mail, key: "google" },
        { name: "Slack", icon: Slack, key: "slack" },
        { name: "Github", icon: Github, key: "github" },
        { name: "Discord", icon: FaDiscord, key: "discord" },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-screen border-r bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 ${
                isCollapsed ? "w-20" : "w-64"
            }`}
        >
            {/* --- Header --- */}
            <div className='flex items-center justify-between border-b p-4 dark:border-zinc-800'>
                <div
                    className={`flex items-center space-x-2 overflow-hidden transition-all ${
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                >
                    <div className='flex h-8 w-8 items-center justify-center rounded-sm bg-black'>
                        <span className='font-bold text-white text-xs'>i</span>
                    </div>
                    <h1 className='font-bold text-lg dark:text-white'>
                        iDraft
                    </h1>
                </div>
                <button
                    aria-label={
                        isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    className='rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    onClick={toggleSidebar}
                >
                    {isCollapsed ? <Menu size={22} /> : <X size={22} />}
                </button>
            </div>

            {/* --- Navigation --- */}
            <nav className='h-[calc(100vh-140px)] space-y-6 overflow-y-auto p-4'>
                <SidebarSection
                    isCollapsed={isCollapsed}
                    items={navItems as any}
                    pathname={pathname}
                    title='Main'
                />
                <SidebarSection
                    isCollapsed={isCollapsed}
                    items={appItems}
                    pathname={pathname}
                    title='Apps'
                    appConnections={appConnections}
                    handleConnect={handleConnect}
                    // handleDisconnect prop removed
                />
            </nav>

            {/* --- Footer --- */}
            <div className='absolute bottom-0 w-full border-t p-4 dark:border-zinc-800'>
                <Link
                    className={`flex items-center rounded-lg p-3 font-medium text-sm transition-all ${
                        isCollapsed ? "justify-center" : "gap-3"
                    } ${
                        pathname === "/settings"
                            ? "bg-black text-white"
                            : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                    href='/settings'
                >
                    <Settings size={20} />
                    <span
                        className={`overflow-hidden whitespace-nowrap transition-all ${
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}
                    >
                        Settings
                    </span>
                </Link>
            </div>
        </aside>
    );
}

// =========================================================================
// SIDEBAR SECTION (HELPER COMPONENT) - FIXED
// =========================================================================

function SidebarSection({
    title,
    items,
    isCollapsed,
    pathname,
    appConnections,
    handleConnect,
}: // handleDisconnect removed from props
SidebarSectionProps) {
    return (
        <div>
            {/* Section Title */}
            {title && (
                <h2
                    className={`mb-3 font-semibold uppercase text-gray-500 text-xs transition-opacity dark:text-zinc-400 ${
                        isCollapsed ? "opacity-0" : "opacity-100"
                    }`}
                >
                    {title}
                </h2>
            )}
            <ul className='space-y-1'>
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const isAppItem = "key" in item;
                    const itemKey = isAppItem ? (item as AppItem).key : "";
                    const isConnected =
                        isAppItem && appConnections
                            ? appConnections[itemKey]
                            : false;

                    const isInteractiveLink = !isAppItem || isCollapsed;

                    return (
                        <li key={item.name}>
                            {isInteractiveLink ? (
                                // Use Link for standard or collapsed items
                                <Link
                                    href={item.href || ""}
                                    className={`flex items-center rounded-lg p-3 font-medium text-sm transition-colors ${
                                        isActive
                                            ? "bg-black text-white"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    } ${
                                        isCollapsed ? "justify-center" : "gap-3"
                                    }`}
                                >
                                    <Icon className='shrink-0' size={20} />
                                    <div
                                        className={`flex w-full items-center justify-between overflow-hidden transition-all ${
                                            isCollapsed
                                                ? "w-0 opacity-0"
                                                : "w-auto opacity-100"
                                        }`}
                                    >
                                        <span className='whitespace-nowrap'>
                                            {item.name}
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                // Use a DIV for the expanded app row
                                <div
                                    className={`flex items-center rounded-lg p-3 font-medium text-sm transition-colors justify-between text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <Icon className='shrink-0' size={20} />
                                        <span className='whitespace-nowrap'>
                                            {item.name}
                                        </span>
                                    </div>

                                    {/* Connection Button (Logic Updated) */}
                                    {isAppItem && (
                                        <button
                                            // ================== FIX IS HERE ==================
                                            // This onClick will *only* fire if the app is NOT connected.
                                            // If it is already connected, clicking the button does nothing.
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (
                                                    !isConnected &&
                                                    handleConnect
                                                ) {
                                                    handleConnect(itemKey);
                                                }
                                            }}
                                            // The className is also fixed.
                                            // "Connected" state is green but has no hover or cursor pointer.
                                            // "Connect" state is blue and has hover/cursor.
                                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white transition-colors ${
                                                isConnected
                                                    ? "bg-green-600" // "Connected" state (visual badge only)
                                                    : "bg-blue-500 hover:bg-blue-600 cursor-pointer" // "Connect" state
                                            }`}
                                            // =================================================
                                        >
                                            {isConnected ? (
                                                <span className='flex items-center gap-1'>
                                                    Connected
                                                </span>
                                            ) : (
                                                <span className='flex items-center gap-1'>
                                                    Connect
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}