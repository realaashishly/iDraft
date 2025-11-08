// app/notifications/page.tsx

"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client"; // Your custom client-side auth hook

export default function NotificationsPage() {
  // 1. Get session data and router
  const { data: session, isPending: status } = useSession();
  const router = useRouter();

  // 2. Handle Authentication
  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
    }
  }, [session, router]);

  // 3. Handle loading state
  if (status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <Bell className="mr-2 h-6 w-6 animate-spin text-zinc-500 dark:text-zinc-400" />
        <p>Loading Notifications...</p>
      </div>
    );
  }

  // 4. Return the main page content (only if authenticated)
  if (session?.user) {
    return (
      <div className="min-h-[88vh] bg-white p-8 text-zinc-900 dark:bg-zinc-950 dark:text-white">
        {/* Empty State / Content */}
        <div className="flex h-[70vh] flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
          <Bell className="mb-4 h-12 w-12 text-zinc-400 dark:text-zinc-600" />
          <p className="font-semibold text-xl text-zinc-900 dark:text-white">
            You're All Caught Up!
          </p>
          <p className="mt-2 text-sm">
            No new notifications to display right now.
          </p>
        </div>
      </div>
    );
  }

  // Fallback: If status is 'unauthenticated' but useEffect hasn't run yet,
  // or if the redirect failed for some reason, show an explicit message.
  return (
    <div className="flex min-h-[88vh] items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <p className="text-xl text-red-600 dark:text-red-400">
        Redirecting to login...
      </p>
    </div>
  );
}