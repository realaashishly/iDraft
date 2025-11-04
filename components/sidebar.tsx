"use client";

import {
  AppWindow,
  Home,
  Menu,
  Package,
  Settings,
  Users,
  X,
  // === ADDED ICONS ===
  Music, // For Spotify
  Mail, // For Google Mail
  Slack,
  Github,
  // Discord,
  // ===================
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { FaDiscord } from "react-icons/fa";

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
    { name: "Apps", icon: AppWindow, href: "/apps" }, // === REMOVED ===
  ];

  // === ADDED ===
  // App navigation items
  const appItems = [
    { name: "Spotify", icon: Music, href: "/apps/spotify" },
    { name: "Google Mail", icon: Mail, href: "/apps/gmail" },
    { name: "Slack", icon: Slack, href: "/apps/slack" },
    { name: "Github", icon: Github, href: "/apps/github" },
    { name: "Discord", icon: FaDiscord, href: "/apps/discord" },
  ];
  // =============

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-gray-200 border-r bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${
        isCollapsed ? "w-20" : "w-64"
      }
            `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-gray-200 border-b p-4 dark:border-zinc-800">
        {/* Logo and Title - Hidden when collapsed */}
        <div
          className={`flex items-center space-x-2 overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black">
            <span className="font-bold text-white text-xs">i</span>
          </div>
          <h1 className="font-bold text-gray-900 text-lg dark:text-white">
            iDraft
          </h1>
        </div>

        {/* Toggle Button */}
        <button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="cursor-pointer rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <Menu size={22} /> : <X size={22} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="h-[calc(100vh-140px)] space-y-6 overflow-y-auto p-4">
        {/* Main Navigation */}
        <SidebarSection
          isCollapsed={isCollapsed}
          items={navItems}
          pathname={pathname}
          title="Main"
        />

        {/* === ADDED === */}
        {/* Apps Navigation */}
        <SidebarSection
          isCollapsed={isCollapsed}
          items={appItems}
          pathname={pathname}
          title="Apps"
        />
        {/* ============= */}
      </nav>

      {/* Sidebar Footer */}
      <div className="absolute bottom-0 w-full border-gray-200 border-t p-4 dark:border-zinc-800">
        <Link
          className={`flex items-center rounded-lg p-3 font-medium text-sm transition-all duration-300 ease-in-out ${
            isCollapsed ? "" : "gap-3"
          } ${
            pathname === "/settings"
              ? "bg-black text-white" // Active state style
              : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800" // Default state style
          }`}
          href="/settings"
        >
          <Settings size={20} />
          {/* Settings Label - Hidden when collapsed */}
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
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

function SidebarSection({
  title,
  items,
  isCollapsed,
  pathname,
}: SidebarSectionProps) {
  // Determine the base path for chat history highlighting (e.g., /agents/...)
  const chatBasePath = "/agents/";

  return (
    <div>
      {/* Section Title - Only render if title is provided */}
      {title && (
        <h2
          className={`mb-3 font-semibold text-gray-500 text-xs uppercase transition-opacity duration-300 ease-in-out dark:text-zinc-400 ${
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
          const isActive =
            pathname === item.href ||
            (item.href.startsWith(chatBasePath) && pathname === item.href);

          return (
            <li key={item.name}>
              <Link
                className={`flex items-center rounded-lg p-3 font-medium text-sm transition-all duration-300 ease-in-out ${
                  isActive
                    ? "bg-black text-white" // Active state style
                    : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                } // Default state style ${
                  isCollapsed ? "justify-center" : "gap-3"
                }`}
                href={item.href} // Center icon when collapsed
              >
                {/* Icon */}
                <item.icon className="shrink-0" size={20} />

                {/* Item Name - Hidden when collapsed */}
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
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