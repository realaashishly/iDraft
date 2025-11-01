// app/notifications/page.tsx

"use client";

import { useSession } from "@/lib/auth-client"; // Your custom client-side auth hook
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
    // 1. Get session data and router
    const { data: session, status } = useSession();
    const router = useRouter();

    // 2. Handle redirection based on auth status
    useEffect(() => {
        // If the session status is 'unauthenticated' and we're done loading, redirect.
        if (status === 'unauthenticated' && !session?.user) {
            // Use replace to prevent the user from hitting the notifications page via the back button
            router.replace("/login"); 
        }
    }, [status, session, router]);

    // 3. Handle loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Bell className="w-6 h-6 animate-spin text-zinc-400 mr-2" />
                <p>Loading Notifications...</p>
            </div>
        );
    }
    
    // 4. Return the main page content (only if authenticated)
    if (session?.user) {
        return (
            <div className="min-h-[88vh] bg-zinc-950 text-white p-8">
                

                {/* Empty State / Content */}
                <div className="flex flex-col items-center justify-center h-[70vh] text-zinc-400">
                    <Bell className="w-12 h-12 mb-4 text-zinc-600" />
                    <p className="text-xl font-semibold">You're All Caught Up!</p>
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
         <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
            <p className="text-xl text-red-400">Redirecting to login...</p>
        </div>
    );
}