"use client";

import Image from "next/image";
import { useRef, useState } from "react";
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
    if (!(enableTilt && cardRef.current)) return;
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
      className="h-full w-full"
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{ perspective: "1000px" }}
    >
      <div
        className="flex h-full flex-col items-center rounded-xl border bg-card p-4 text-center text-card-foreground transition-transform duration-150 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* --- THIS IS THE FIX --- */}
        <div className="relative mb-4 h-24 w-24">
          {" "}
          {/* 1. Make container square (w-24 h-24 = 96px) */}
          <Image
            alt={`${safeName}'s avatar`}
            className="rounded-full object-cover"
            layout="fill" // 2. Tell Image to fill the container
            onError={(e) => {
              console.error("Failed to load avatar:", avatarSrc);
            }} // 3. Remove w/h props and mb-4 from here
            src={avatarSrc}
          />
          <span
            className={cn(
              // 4. Adjust status dot position for layout="fill"
              "absolute right-1 bottom-1 block h-3.5 w-3.5 rounded-full border-2 border-card",
              status === "Online" ? "bg-green-500" : "bg-gray-500"
            )}
          />
        </div>
        {/* --- END FIX --- */}

        {showUserInfo && (
          <>
            <h3
              className="w-full truncate font-semibold text-xl"
              title={safeName}
            >
              {safeName}
            </h3>
            <p className="w-full truncate text-primary" title={title}>
              {title}
            </p>
          </>
        )}

        <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
