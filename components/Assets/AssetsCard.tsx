"use client";

import Image from "next/image";
import {
    File,
    Download,
    FileText, 
    Video,
    AudioWaveform, 
} from "lucide-react";
import { Button } from "../ui/button";
import { type Asset } from "@/lib/types";
import { useRef, useState } from "react";

// Function to get the correct icon based on fileType
function getIconForType(fileType: string | undefined) {
    if (fileType?.startsWith("application/pdf")) {
        return <FileText className='h-16 w-16 text-muted-foreground' />;
    }
    if (fileType?.startsWith("video")) {
        return <Video className='h-16 w-16 text-muted-foreground' />;
    }
    if (fileType?.startsWith("audio")) {
        return <AudioWaveform className='h-16 w-16 text-muted-foreground' />;
    }
    // Default fallback icon
    return <File className='h-16 w-16 text-muted-foreground' />;
}

// Function to display relative time
function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000; // years
    if (interval > 1)
        return `Uploaded ${Math.floor(interval)} year${
            Math.floor(interval) > 1 ? "s" : ""
        } ago`;
    interval = seconds / 2592000; // months
    if (interval > 1)
        return `Uploaded ${Math.floor(interval)} month${
            Math.floor(interval) > 1 ? "s" : ""
        } ago`;
    interval = seconds / 86400; // days
    if (interval > 1)
        return `Uploaded ${Math.floor(interval)} day${
            Math.floor(interval) > 1 ? "s" : ""
        } ago`;
    interval = seconds / 3600; // hours
    if (interval > 1)
        return `Uploaded ${Math.floor(interval)} hour${
            Math.floor(interval) > 1 ? "s" : ""
        } ago`;
    interval = seconds / 60; // minutes
    if (interval > 1)
        return `Uploaded ${Math.floor(interval)} minute${
            Math.floor(interval) > 1 ? "s" : ""
        } ago`;
    return `Uploaded ${Math.max(0, seconds)} second${
        seconds !== 1 ? "s" : ""
    } ago`; // Handle potential negative seconds briefly
}

// The main AssetCard component
export function AssetCard({
    asset,
    onClick,
}: {
    asset: Asset;
    onClick: () => void;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    // Mouse move handler for the 3D tilt effect
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxRotate = 10; // Max rotation degrees
        const newRotateY = ((x - centerX) / centerX) * maxRotate;
        const newRotateX = -((y - centerY) / centerY) * maxRotate;
        setRotateX(newRotateX);
        setRotateY(newRotateY);
    };

    // Reset rotation on mouse leave
    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    // Safely calculate the time ago string
    const uploadedTime = asset.createdAt
        ? timeAgo(new Date(asset.createdAt))
        : "Uploaded recently"; // Ensure createdAt is a Date object if needed

    return (
        <div
            ref={cardRef}
            className='asset-card relative overflow-hidden bg-card rounded-xl border border-transparent hover:border-primary/30 transition-all duration-300 cursor-pointer perspective-1000 group' // Added group for potential hover effects inside
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ willChange: "transform" }} // Optimization hint
        >
            {/* Inner div for the tilt effect */}
            <div
                className='relative aspect-[4/3] w-full bg-muted flex items-center justify-center overflow-hidden rounded-xl transform-style-preserve-3d transition-transform duration-300 ease-out' // Added ease-out
                style={{
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                }}
            >
                {/* Conditional rendering: Image or Icon */}
                {asset.fileType?.startsWith("image") && asset.fileUrl ? (
                    <Image
                        src={asset.fileUrl}
                        alt={asset.title}
                        fill
                        sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' // Example sizes, adjust as needed
                        className='object-cover transition-transform duration-300 group-hover:scale-105' // Added group-hover effect
                    />
                ) : (
                    getIconForType(asset.fileType)
                )}

                {/* Overlay with Title, Time Ago, and Download Button */}
                <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent'>
                    {" "}
                    {/* Added gradient */}
                    <div className='bg-black/30 backdrop-blur-sm p-3 rounded-lg flex items-center justify-between text-white'>
                        {" "}
                        {/* Adjusted background and text color */}
                        <div className='overflow-hidden mr-2'>
                            <h3 className='font-semibold truncate text-sm'>
                                {asset.title}
                            </h3>
                            <p className='text-xs text-gray-300 mt-1'>
                                {uploadedTime}
                            </p>{" "}
                            {/* Adjusted text color */}
                        </div>
                        <div className='flex items-center flex-shrink-0'>
                            {asset.fileUrl && ( // Only show download if URL exists
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='ml-1 text-white hover:text-primary transition-colors p-2 rounded-full hover:bg-black/50 h-auto w-auto'
                                    aria-label={`Download ${asset.title}`}
                                    onClick={async (e) => {
                                        // <-- Make the handler async
                                        e.stopPropagation(); // Prevent card click

                                        if (!asset.fileUrl) return;

                                        try {
                                            // 1. Fetch the file content as a Blob
                                            const response = await fetch(
                                                asset.fileUrl
                                            );
                                            if (!response.ok) {
                                                throw new Error(
                                                    `HTTP error! status: ${response.status}`
                                                );
                                            }
                                            const blob = await response.blob();

                                            // 2. Create a temporary URL for the Blob
                                            const blobUrl =
                                                window.URL.createObjectURL(
                                                    blob
                                                );

                                            // 3. Create a temporary link to trigger the download
                                            const link =
                                                document.createElement("a");
                                            link.href = blobUrl;
                                            link.download =
                                                asset.title || "download"; // Use asset title or default
                                            document.body.appendChild(link);
                                            link.click();

                                            // 4. Clean up the temporary link and Blob URL
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(blobUrl);
                                        } catch (error) {
                                            console.error(
                                                "Download failed:",
                                                error
                                            );
                                            // Optionally: show an error message to the user
                                            // Fallback: Try opening in a new tab if fetch fails (e.g., due to CORS)
                                            window.open(
                                                asset.fileUrl,
                                                "_blank"
                                            );
                                        }
                                    }}
                                >
                                    <Download className='h-4 w-4' />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Skeleton Loader Component (remains the same)
export function AssetCardSkeleton() {
    return (
        <div className='bg-card rounded-xl overflow-hidden animate-pulse border border-border/10'>
            {" "}
            {/* Added subtle border */}
            <div className='aspect-[4/3] bg-muted/40'></div>
            <div className='p-4 space-y-2'>
                {" "}
                {/* Added space-y */}
                <div className='h-5 w-3/4 bg-muted/40 rounded'></div>
                <div className='h-4 w-1/2 bg-muted/40 rounded'></div>
            </div>
        </div>
    );
}
