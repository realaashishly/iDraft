"use client";

import { Download, File as FileIcon, FileText, Scaling, X } from "lucide-react";
import Image from "next/image";
import type { Asset } from "@/type/types";
import { Button } from "../ui/button";

export function AssetDetailModal({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) {
  if (!asset) return null;

  const uploadedDate = new Date(
    asset.createdAt ?? Date.now()
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // --- Function to render the correct preview ---
  const renderPreview = () => {
    if (!asset.fileUrl) {
      return (
        <div className="flex h-full min-h-[250px] w-full items-center justify-center md:min-h-full">
          <FileIcon className="h-32 w-32 text-muted-foreground" />
          <span className="sr-only">No preview available</span>
        </div>
      );
    }

    if (asset.fileType?.startsWith("image")) {
      return (
        <Image
          alt={asset.title}
          className="h-full w-full object-contain" // Use object-contain for better visibility
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          src={asset.fileUrl} // Adjust sizes prop
        />
      );
    }

    if (asset.fileType?.startsWith("video")) {
      return (
        <video
          aria-label={`Video player for ${asset.title}`}
          className="h-full w-full bg-black object-contain" // Add browser default controls
          controls // Contain video within bounds
          src={asset.fileUrl}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (asset.fileType?.startsWith("audio")) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4">
          <FileIcon className="mb-4 h-32 w-32 text-muted-foreground" />{" "}
          {/* Optional icon */}
          <audio
            aria-label={`Audio player for ${asset.title}`}
            className="w-full max-w-sm" // Add browser default controls
            controls // Limit width of controls
            src={asset.fileUrl}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Fallback for other file types
    return (
      <div className="flex h-full min-h-[250px] w-full items-center justify-center md:min-h-full">
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
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = asset.title || "download"; // Use asset title or default
      document.body.appendChild(link);
      link.click();

      // Clean up the temporary link and Blob URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: Try opening in a new tab if fetch fails
      window.open(asset.fileUrl, "_blank");
    }
  };
  // --- End of handleDownload function ---

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" // Added padding for smaller screens
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-white/10 bg-card shadow-2xl shadow-primary/20 md:flex-row" // Limit max height
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button
          aria-label="Close modal"
          className="absolute top-2 right-2 z-10 cursor-pointer rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="h-6 w-6 cursor-pointer" />
        </Button>

        {/* Left - Asset Preview */}
        {/* Use the renderPreview function */}
        <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-t-xl bg-black md:w-3/5 md:rounded-t-none md:rounded-l-xl">
          {renderPreview()}
        </div>

        {/* Right - Asset Details */}
        <div className="flex flex-col overflow-hidden rounded-b-xl bg-card p-6 md:w-2/5 md:rounded-r-xl md:rounded-b-none md:p-8">
          {/* Make this section scrollable if content overflows */}
          <div className="grow overflow-y-auto pr-2">
            {" "}
            {/* Added padding-right for scrollbar */}
            <h2 className="wrap-break-word mb-2 font-bold text-2xl text-foreground md:text-3xl">
              {" "}
              {/* Allow title to wrap */}
              {asset.title}
            </h2>
            <p className="mb-6 text-muted-foreground text-sm">
              Uploaded on {uploadedDate}
            </p>
            {/* Asset Metadata */}
            <div className="mb-6 space-y-4 text-muted-foreground text-sm">
              {" "}
              {/* Added margin-bottom */}
              <div className="flex items-center">
                <FileIcon className="mr-3 w-5 shrink-0 text-center text-base" />
                <p className="break-all">
                  {" "}
                  {/* Allow long types to wrap */}
                  File Type: {asset.fileType || "N/A"}
                </p>
              </div>
              <div className="flex items-center">
                <Scaling className="mr-3 w-5 shrink-0 text-center text-base" />
                <p>File Size: {asset.fileSize || "N/A"}</p>
              </div>
              {/* Only show description if it exists */}
              {asset.description && (
                <div className="flex items-start">
                  <FileText className="mt-0.5 mr-3 w-5 shrink-0 text-center text-base" />
                  <p className="wrap-break-word">{asset.description}</p>{" "}
                  {/* Allow long descriptions to wrap */}
                </div>
              )}
            </div>
          </div>

          {/* Actions - Stick to bottom */}
          <div className="mt-auto flex items-center gap-4 border-border border-t pt-6">
            {/* Download Button */}
            <Button
              className="h-12 flex-1 cursor-pointer font-bold text-base shadow-[0_0_15px_rgba(94,234,212,0.3)] hover:shadow-[0_0_25px_rgba(94,234,212,0.5)]" // Use the download handler
              disabled={!asset.fileUrl}
              onClick={handleDownload} // Disable if no URL
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
