"use client";

import {
  AudioWaveform,
  Download,
  Edit,
  File,
  FileText,
  Loader2,
  Trash2,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Asset } from "@/type/types";
import { Button } from "../ui/button";

// --- Helper Functions ---
function getIconForType(fileType: string | undefined) {
  if (fileType?.startsWith("application/pdf")) {
    return <FileText className="h-16 w-16 text-muted-foreground" />;
  }
  if (fileType?.startsWith("video")) {
    return <Video className="h-16 w-16 text-muted-foreground" />;
  }
  if (fileType?.startsWith("audio")) {
    return <AudioWaveform className="h-16 w-16 text-muted-foreground" />;
  }
  return <File className="h-16 w-16 text-muted-foreground" />;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31_536_000;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} year${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  interval = seconds / 2_592_000;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} month${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  interval = seconds / 86_400;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} day${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  interval = seconds / 3600;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} hour${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  interval = seconds / 60;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} minute${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  return `Uploaded ${Math.max(0, Math.floor(seconds))} second${
    Math.floor(seconds) !== 1 ? "s" : ""
  } ago`;
}

// --- Main AssetCard Component ---
export function AssetCard({
  asset,
  onClick,
  isAdmin,
  onEdit,
  onDelete,
  isDeleting,
}: {
  asset: Asset;
  onClick: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxRotate = 10;
    const newRotateY = ((x - centerX) / centerX) * maxRotate;
    const newRotateX = -((y - centerY) / centerY) * maxRotate;
    setRotateX(newRotateX);
    setRotateY(newRotateY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const uploadedTime = asset.createdAt
    ? timeAgo(new Date(asset.createdAt))
    : "Uploaded recently";

  return (
    <div
      className="asset-card perspective-1000 group relative cursor-pointer overflow-hidden rounded-xl border border-transparent bg-card transition-all duration-300 hover:border-primary/30"
      onClick={onClick}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{ willChange: "transform" }}
    >
      {/* --- Admin Buttons --- */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            className="h-8 w-8 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's main onClick
              onEdit();
            }}
            size="icon"
            variant="secondary"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            className="h-8 w-8 cursor-pointer"
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's main onClick

              // --- UPDATE ---
              // Removed window.confirm. Parent component now handles confirmation.
              onDelete();
              // --- END UPDATE ---
            }}
            size="icon"
            variant="destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* --- Tilt Container --- */}
      <div
        className="transform-style-preserve-3d relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl bg-muted transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        {asset.fileType?.startsWith("image") && asset.fileUrl ? (
          <Image
            alt={asset.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={asset.fileUrl}
          />
        ) : (
          getIconForType(asset.fileType)
        )}

        {/* --- Overlay Info --- */}
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/60 via-black/30 to-transparent p-3">
          <div className="flex items-center justify-between rounded-lg bg-black/30 p-3 text-white backdrop-blur-sm">
            <div className="mr-2 overflow-hidden">
              <h3 className="truncate font-semibold text-sm">{asset.title}</h3>
              <p className="mt-1 text-gray-300 text-xs">{uploadedTime}</p>
            </div>

            <div className="flex shrink-0 items-center">
              {asset.fileUrl && (
                <Button
                  aria-label={`Download ${asset.title}`}
                  className="ml-1 h-auto w-auto cursor-pointer rounded-full p-2 text-white transition-colors hover:bg-black/50 hover:text-primary"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!asset.fileUrl) return;
                    try {
                      const response = await fetch(asset.fileUrl);
                      if (!response.ok) {
                        throw new Error(
                          `HTTP error! status: ${response.status}`
                        );
                      }
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = blobUrl;
                      link.download = asset.title || "download";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(blobUrl);
                    } catch (error) {
                      console.error("Download failed:", error);
                      window.open(asset.fileUrl, "_blank");
                    }
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Skeleton Loader ---
export function AssetCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border/10 bg-card">
      <div className="aspect-4/3 bg-muted/40" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-3/4 rounded bg-muted/40" />
        <div className="h-4 w-1/2 rounded bg-muted/40" />
      </div>
    </div>
  );
}
