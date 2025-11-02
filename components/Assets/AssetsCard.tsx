"use client";

import Image from "next/image";
import {
  File,
  Download,
  FileText,
  Video,
  AudioWaveform,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { type Asset } from "@/lib/types";
import { useRef, useState } from "react";

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
  let interval = seconds / 31536000;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} year${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  interval = seconds / 2592000;
  if (interval > 1)
    return `Uploaded ${Math.floor(interval)} month${
      Math.floor(interval) > 1 ? "s" : ""
    } ago`;
  interval = seconds / 86400;
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
      ref={cardRef}
      className="asset-card relative overflow-hidden bg-card rounded-xl border border-transparent hover:border-primary/30 transition-all duration-300 cursor-pointer perspective-1000 group"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "transform" }}
    >
      {/* --- Admin Buttons --- */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's main onClick
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's main onClick
              
              // --- UPDATE ---
              // Removed window.confirm. Parent component now handles confirmation.
              onDelete();
              // --- END UPDATE ---
            }}
            disabled={isDeleting}
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
        className="relative aspect-4/3 w-full bg-muted flex items-center justify-center overflow-hidden rounded-xl transform-style-preserve-3d transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        {asset.fileType?.startsWith("image") && asset.fileUrl ? (
          <Image
            src={asset.fileUrl}
            alt={asset.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          getIconForType(asset.fileType)
        )}

        {/* --- Overlay Info --- */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/60 via-black/30 to-transparent">
          <div className="bg-black/30 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between text-white">
            <div className="overflow-hidden mr-2">
              <h3 className="font-semibold truncate text-sm">{asset.title}</h3>
              <p className="text-xs text-gray-300 mt-1">{uploadedTime}</p>
            </div>

            <div className="flex items-center shrink-0">
              {asset.fileUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 text-white hover:text-primary transition-colors p-2 rounded-full hover:bg-black/50 h-auto w-auto cursor-pointer"
                  aria-label={`Download ${asset.title}`}
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
    <div className="bg-card rounded-xl overflow-hidden animate-pulse border border-border/10">
      <div className="aspect-4/3 bg-muted/40"></div>
      <div className="p-4 space-y-2">
        <div className="h-5 w-3/4 bg-muted/40 rounded"></div>
        <div className="h-4 w-1/2 bg-muted/40 rounded"></div>
      </div>
    </div>
  );
}