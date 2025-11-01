"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { Bell, Search, User } from "lucide-react";
import Link from "next/link";

export default function Header() {
    const handleSignOut = async () => {
        await signOut();
        window.location.href = "/login";
    };

    const { data: session } = useSession();

    return (
        <header className='fixed top-4 right-4 z-40 flex items-center gap-3'>
            {/* Notification Icon */}
            <Link href='/notification'>
                <button className='p-2 rounded-full cursor-pointer bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
                    <Bell className='h-5 w-5 text-gray-600 dark:text-gray-300' />
                </button>
            </Link>

            {/* User Avatar */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className='rounded-full cursor-pointer bg-white dark:bg-zinc-900 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
                        <Avatar className='h-8 w-8'>
                            <AvatarImage src={session?.user?.image!} />
                            <AvatarFallback>ID</AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Link href='/profile'>Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
