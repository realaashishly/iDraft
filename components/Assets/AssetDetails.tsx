"use client";

import Image from "next/image";
import { type Asset } from "@/lib/types";
import {
    X,
    Download,
    File as FileIcon, // Renamed to avoid conflict with File type
    Scaling,
    FileText,
} from "lucide-react";
import { Button } from "../ui/button"; // Assuming path is correct

export function AssetDetailModal({
    asset,
    onClose,
}: {
    asset: Asset;
    onClose: () => void;
}) {
    if (!asset) return null;

    const uploadedDate = new Date(asset.createdAt ?? Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // --- Function to render the correct preview ---
    const renderPreview = () => {
        if (!asset.fileUrl) {
            return (
                <div className="w-full h-full flex items-center justify-center min-h-[250px] md:min-h-full">
                    <FileIcon className="h-32 w-32 text-muted-foreground" />
                    <span className="sr-only">No preview available</span>
                </div>
            );
        }

        if (asset.fileType?.startsWith("image")) {
            return (
                <Image
                    alt={asset.title}
                    className="w-full h-full object-contain" // Use object-contain for better visibility
                    src={asset.fileUrl}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw" // Adjust sizes prop
                />
            );
        }

        if (asset.fileType?.startsWith("video")) {
            return (
                <video
                    src={asset.fileUrl}
                    controls // Add browser default controls
                    className="w-full h-full object-contain bg-black" // Contain video within bounds
                    aria-label={`Video player for ${asset.title}`}
                >
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (asset.fileType?.startsWith("audio")) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted">
                    <FileIcon className="h-32 w-32 text-muted-foreground mb-4" /> {/* Optional icon */}
                     <audio
                        src={asset.fileUrl}
                        controls // Add browser default controls
                        className="w-full max-w-sm" // Limit width of controls
                        aria-label={`Audio player for ${asset.title}`}
                     >
                        Your browser does not support the audio element.
                     </audio>
                </div>
            );
        }

        // Fallback for other file types
        return (
            <div className="w-full h-full flex items-center justify-center min-h-[250px] md:min-h-full">
                <FileIcon className="h-32 w-32 text-muted-foreground" />
                 <span className="sr-only">File preview</span>
            </div>
        );
    };
    // --- End of renderPreview function ---


    // --- Function to handle download ---
     const handleDownload = async (e: React.MouseEvent) => {
         e.stopPropagation(); // Prevent modal close

         if (!asset.fileUrl) return;

         try {
             // Fetch the file content as a Blob
             const response = await fetch(asset.fileUrl);
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             const blob = await response.blob();

             // Create a temporary URL for the Blob
             const blobUrl = window.URL.createObjectURL(blob);

             // Create a temporary link to trigger the download
             const link = document.createElement('a');
             link.href = blobUrl;
             link.download = asset.title || 'download'; // Use asset title or default
             document.body.appendChild(link);
             link.click();

             // Clean up the temporary link and Blob URL
             document.body.removeChild(link);
             window.URL.revokeObjectURL(blobUrl);

         } catch (error) {
             console.error("Download failed:", error);
             // Fallback: Try opening in a new tab if fetch fails
             window.open(asset.fileUrl, '_blank');
         }
     };
    // --- End of handleDownload function ---

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" // Added padding for smaller screens
            onClick={onClose}
        >
            <div
                className="relative bg-card rounded-xl w-full max-w-4xl flex flex-col md:flex-row shadow-2xl shadow-primary/20 border border-white/10 max-h-[90vh]" // Limit max height
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white cursor-pointer"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X className="h-6 w-6 cursor-pointer" />
                </Button>

                {/* Left - Asset Preview */}
                {/* Use the renderPreview function */}
                <div className="md:w-3/5 relative bg-black rounded-t-xl md:rounded-t-none md:rounded-l-xl overflow-hidden flex items-center justify-center min-h-[300px]">
                    {renderPreview()}
                </div>

                {/* Right - Asset Details */}
                <div className="md:w-2/5 p-6 md:p-8 flex flex-col bg-card rounded-b-xl md:rounded-b-none md:rounded-r-xl overflow-hidden">
                    {/* Make this section scrollable if content overflows */}
                    <div className="flex-grow overflow-y-auto pr-2"> {/* Added padding-right for scrollbar */}
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 break-words"> {/* Allow title to wrap */}
                            {asset.title}
                        </h2>

                        <p className="text-sm text-muted-foreground mb-6">
                            Uploaded on {uploadedDate}
                        </p>

                        {/* Asset Metadata */}
                        <div className="space-y-4 text-muted-foreground text-sm mb-6"> {/* Added margin-bottom */}
                            <div className="flex items-center">
                                <FileIcon className="flex-shrink-0 text-base mr-3 w-5 text-center" />
                                <p className="break-all"> {/* Allow long types to wrap */}
                                    File Type: {asset.fileType || "N/A"}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <Scaling className="flex-shrink-0 text-base mr-3 w-5 text-center" />
                                <p>File Size: {asset.fileSize || "N/A"}</p>
                            </div>

                           {/* Only show description if it exists */}
                           {asset.description && (
                               <div className="flex items-start">
                                   <FileText className="flex-shrink-0 text-base mr-3 w-5 text-center mt-0.5" />
                                   <p className="break-words">{asset.description}</p> {/* Allow long descriptions to wrap */}
                               </div>
                           )}
                        </div>
                    </div>

                    {/* Actions - Stick to bottom */}
                    <div className="mt-auto pt-6 border-t border-border flex items-center gap-4">
                        {/* Download Button */}
                        <Button
                            onClick={handleDownload} // Use the download handler
                            className="flex-1 h-12 text-base font-bold shadow-[0_0_15px_rgba(94,234,212,0.3)] hover:shadow-[0_0_25px_rgba(94,234,212,0.5)] cursor-pointer"
                            disabled={!asset.fileUrl} // Disable if no URL
                        >
                            <Download className="mr-2 h-5 w-5" />
                            <span>Download</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}