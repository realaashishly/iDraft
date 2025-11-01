"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProfileCardProps = {
    name: string | null | undefined; 
    title: string;
    handle: string; 
    description: string;
    status: "Online" | "Offline";
    avatarUrl: string | null | undefined; 
    showUserInfo?: boolean;
    enableTilt?: boolean;
};

export default function ProfileCard({
    name,
    title,
    status,
    description,
    avatarUrl,
    showUserInfo = true,
    enableTilt = true,
}: ProfileCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const safeName = name || "User";
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      safeName
    )}&size=96&rounded=true&background=random&color=fff`;
    const avatarSrc = avatarUrl ? avatarUrl : fallbackAvatar;


    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enableTilt || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = x / rect.width - 0.5;
        const yPct = y / rect.height - 0.5;
        const maxRotate = 12;
        setRotate({
            x: yPct * -1 * maxRotate,
            y: xPct * maxRotate,
        });
    };

    const handleMouseLeave = () => {
        if (!enableTilt) return;
        setRotate({ x: 0, y: 0 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className='w-full h-full'
            style={{ perspective: "1000px" }}
        >
            <div
                className='flex h-full flex-col items-center rounded-xl border bg-card p-4 text-center text-card-foreground transition-transform duration-150 ease-out'
                style={{
                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                }}
            >
                {/* --- THIS IS THE FIX --- */}
                <div className='relative w-24 h-24 mb-4'> {/* 1. Make container square (w-24 h-24 = 96px) */}
                    <Image
                        src={avatarSrc} 
                        alt={`${safeName}'s avatar`}
                        layout="fill" // 2. Tell Image to fill the container
                        className='rounded-full object-cover' // 3. Remove w/h props and mb-4 from here
                        onError={(e) => {
                          console.error("Failed to load avatar:", avatarSrc);
                        }}
                    />
                    <span
                        className={cn(
                            // 4. Adjust status dot position for layout="fill"
                            "absolute bottom-1 right-1 block h-3.5 w-3.5 rounded-full border-2 border-card",
                            status === "Online" ? "bg-green-500" : "bg-gray-500"
                        )}
                    />
                </div>
                {/* --- END FIX --- */}

                {showUserInfo && (
                    <>
                        <h3 className='text-xl font-semibold truncate w-full' title={safeName}>
                            {safeName}
                        </h3>
                        <p className='text-primary truncate w-full' title={title}>
                            {title}
                        </p>
                    </>
                )}

                <p className='mt-2 text-sm text-muted-foreground line-clamp-2'>
                    {description}
                </p>
            </div>
        </div>
    );
}