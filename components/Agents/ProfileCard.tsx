"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProfileCardProps = {
    name: string;
    title: string;
    handle: string;
    description: string;
    status: "Online" | "Offline";
    avatarUrl: string;
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
            className='w-full'
            style={{ perspective: "1000px" }}
        >
            <div
                className='flex h-full flex-col items-center rounded-xl border bg-card p-4 text-center text-card-foreground transition-transform duration-150 ease-out'
                style={{
                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                }}
            >
                <div className='relative'>
                    <Image
                        src={avatarUrl}
                        alt={`${name}'s avatar`}
                        width={96}
                        height={96}
                        className='mb-4 rounded-full'
                    />
                    <span
                        className={cn(
                            "absolute bottom-4 right-0 block h-3.5 w-3.5 rounded-full border-2 border-card",
                            status === "Online" ? "bg-green-500" : "bg-gray-500"
                        )}
                    />
                </div>

                {showUserInfo && (
                    <>
                        <h3 className='text-xl font-semibold'>{name}</h3>
                        <p className='text-primary'>{title}</p>
                        
                    </>
                )}

                <p className='mt-2 text-sm text-muted-foreground line-clamp-2'>
                    {description}
                </p>
            </div>
        </div>
    );
}
