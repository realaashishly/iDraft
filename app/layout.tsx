"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Header from "@/components/header";
import { ActivityProvider } from "@/contexts/ActivityContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const noSidebarRoutes = ["/login", "/signup", "/admin"];
  const shouldShowSidebar = !noSidebarRoutes.includes(pathname);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <div className="flex">
            {shouldShowSidebar && <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />}
            {shouldShowSidebar && <Header />}
            <main
              className={`flex-1 pr-4 pt-20 transition-all duration-300 ease-in-out ${
                shouldShowSidebar
                  ? isSidebarCollapsed
                    ? "pl-24"
                    : "pl-72"
                  : ""
              }`}
            >
              <ActivityProvider>
              {children}
              </ActivityProvider>
                
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}