"use client";

import React from "react"; // Removed useState and useEffect
import {
    Menu,
    X,
    Home,
    Users,
    Package,
    AppWindow,
    Settings,
    // MessageSquare, // Removed chat icon
    // Loader2, // Removed loader icon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed import for getChatHistoryAction, getChatsListAction, and ChatListItem type

// Define component props
interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname();

    // Main navigation items
    const navItems = [
        { name: "Dashboard", icon: Home, href: "/dashboard" },
        { name: "Prompts", icon: Users, href: "/prompts" },
        { name: "Assets", icon: Package, href: "/assets" },
        { name: "Apps", icon: AppWindow, href: "/apps" },
    ];

    // --- REMOVED CHAT HISTORY STATE, EFFECT, AND PROCESSING ---
    // const [chatHistory, setChatHistory] = useState<ChatListItem[]>([]);
    // const [isLoadingChats, setIsLoadingChats] = useState(true);

    // useEffect(() => {
    //     const fetchChats = async () => {
    //         setIsLoadingChats(true);
    //         const chats = await getChatsListAction();
    //         setChatHistory(chats);
    //         setIsLoadingChats(false);
    //     };
    //     fetchChats();
    // }, []);

    // const chatHistoryItems = chatHistory.map((chat) => ({
    //     name: chat.title,
    //     icon: MessageSquare,
    //     href: `/agents/${chat.agentid}`,
    // }));
    
    // const chatItemsWithNew = [
    //     ...chatHistoryItems,
    // ];
    // -----------------------------------------------------------


    return (
        <aside
            className={`fixed left-0 top-0 z-50 h-screen border-r border-gray-200 bg-white
            transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900
            ${isCollapsed ? "w-20" : "w-64"}
            `}
        >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-zinc-800">
                {/* Logo and Title - Hidden when collapsed */}
                <div
                    className={`flex items-center space-x-2 overflow-hidden transition-all duration-300 ease-in-out ${
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black">
                        <span className="text-xs font-bold text-white">i</span>
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        iDraft
                    </h1>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="cursor-pointer rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    {isCollapsed ? <Menu size={22} /> : <X size={22} />}
                </button>
            </div>

            {/* Navigation Sections */}
            <nav className="space-y-6 p-4 overflow-y-auto h-[calc(100vh-140px)]">
                {/* Main Navigation */}
                <SidebarSection
                    title="Main"
                    items={navItems}
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                />

                {/* Separator - Removed the separator that was before Chat History */}
                {/* <div className="w-full border-t border-gray-200 dark:border-zinc-700" /> */}

                {/* --- REMOVED CHAT HISTORY SECTION RENDERING --- */}
                {/* <h2
                    className={`mb-3 text-xs font-semibold uppercase text-gray-500 transition-opacity duration-300 ease-in-out dark:text-zinc-400 ${
                        isCollapsed ? "opacity-0" : "opacity-100"
                    }`}
                >
                    Chat History
                </h2>
                
                {isLoadingChats ? (
                    <div className="flex h-10 items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <SidebarSection
                        title="" 
                        items={chatItemsWithNew}
                        isCollapsed={isCollapsed}
                        pathname={pathname}
                    />
                )} 
                */}
                {/* ----------------------------------------------- */}
            </nav>

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 w-full border-t border-gray-200 p-4 dark:border-zinc-800">
                <Link
                    href="/settings"
                    className={`flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-300 ease-in-out ${
                        isCollapsed ? "" : "gap-3"
                    } ${
                        pathname === "/settings"
                            ? "bg-black text-white" // Active state style
                            : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800" // Default state style
                    }`}
                >
                    <Settings size={20} />
                    {/* Settings Label - Hidden when collapsed */}
                    <span
                        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
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

// Helper component for rendering sidebar sections (no changes needed here)
interface SidebarSectionProps {
    title: string;
    items: { name: string; icon: React.ElementType; href: string }[];
    isCollapsed: boolean;
    pathname: string | null;
}

function SidebarSection({ title, items, isCollapsed, pathname }: SidebarSectionProps) {
    // Determine the base path for chat history highlighting (e.g., /agents/...)
    const chatBasePath = '/agents/'; 

    return (
        <div>
            {/* Section Title - Only render if title is provided */}
            {title && (
                <h2
                    className={`mb-3 text-xs font-semibold uppercase text-gray-500 transition-opacity duration-300 ease-in-out dark:text-zinc-400 ${
                        isCollapsed ? "opacity-0" : "opacity-100"
                    }`}
                >
                    {title}
                </h2>
            )}
            <ul className="space-y-1">
                {items.map((item) => {
                    // Determine if the current item is active
                    // Check if the current pathname is an exact match OR if both paths start with the chat base
                    const isActive = pathname === item.href || 
                                     (item.href.startsWith(chatBasePath) && pathname === item.href); 
                    
                    return (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                className={`flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-300 ease-in-out
                                ${isActive
                                    ? "bg-black text-white" // Active state style
                                    : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"} // Default state style
                                ${isCollapsed ? "justify-center" : "gap-3"}`} // Center icon when collapsed
                            >
                                {/* Icon */}
                                <item.icon size={20} className="flex-shrink-0" />

                                {/* Item Name - Hidden when collapsed */}
                                <span
                                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                                    }`}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}