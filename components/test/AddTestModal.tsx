"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
    fetchMetadataAction,
    type FetchedMetadata,
} from "@/action/metadataActions";
import { createLinkAction } from "@/action/linkActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Added for description

// --- Props ---
interface AddLinkModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onLinkSaved: () => void; // Function to refresh the list on the parent
}

export function AddLinkModal({
    isOpen,
    onOpenChange,
    onLinkSaved,
}: AddLinkModalProps) {
    // --- State for the modal ---
    const [url, setUrl] = useState("");
    const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- Reset state when modal closes ---
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setUrl("");
                setMetadata(null);
                setError(null);
                setIsLoading(false);
                setIsSaving(false);
            }, 200); // Delay to allow exit animation
        }
    }, [isOpen]);

    // --- Handlers (moved from Page.tsx) ---

    const handleFetchMetadata = useCallback(async (pastedUrl: string) => {
        setIsLoading(true);
        setError(null);
        setMetadata(null);

        if (!pastedUrl.startsWith("http")) {
            setError("Please enter a valid URL (e.g., https://...)");
            setIsLoading(false);
            return;
        }

        const result = await fetchMetadataAction(pastedUrl);
        if (result.success) {
            setMetadata(result.data);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    }, []);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData("text");
        if (pastedText) {
            setUrl(pastedText);
            handleFetchMetadata(pastedText);
        }
    };

    const handleSaveLink = async () => {
        if (!metadata || !url) return;
        setIsSaving(true);
        setError(null);

        const payload = {
            url: url,
            title: metadata.title,
            description: metadata.description,
            imageUrl: metadata.imageUrl,
        };

        const result = await createLinkAction(payload);
        if (result.success) {
            onLinkSaved(); // Call parent to refresh
            onOpenChange(false); // Close modal
        } else {
            setError(result.error || "Failed to save link.");
        }
        setIsSaving(false);
    };
    
    // --- Manual change handlers for editable fields ---
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!metadata) return;
        setMetadata({ ...metadata, title: e.target.value });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!metadata) return;
        setMetadata({ ...metadata, description: e.target.value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Link</DialogTitle>
                    <DialogDescription>
                        Paste a URL to fetch its metadata. You can edit the details before saving.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                    {/* 1. URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="url-input">Link URL</Label>
                        <Input
                            id="url-input"
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError(null);
                                setMetadata(null);
                            }}
                            onPaste={handlePaste}
                            onBlur={() => {
                                if (url && !metadata && !isLoading) handleFetchMetadata(url);
                            }}
                            disabled={isLoading || isSaving}
                        />
                        {isLoading && (
                            <div className="flex items-center text-sm text-blue-500">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Fetching metadata...
                            </div>
                        )}
                    </div>

                    {/* 2. Metadata Preview & Edit Fields */}
                    {metadata && (
                        <div className="space-y-4 pt-4 border-t">
                            {/* Image Preview (No Upload) */}
                            {metadata.imageUrl && (
                                <div className="relative h-40 w-full overflow-hidden rounded-md border">
                                    <Image
                                        src={metadata.imageUrl}
                                        alt="Fetched Thumbnail"
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                            )}
                            
                            {/* Editable Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title-edit">Title</Label>
                                <Input
                                    id="title-edit"
                                    value={metadata.title || ""}
                                    onChange={handleTitleChange}
                                    disabled={isSaving}
                                />
                            </div>

                            {/* Editable Description */}
                            <div className="space-y-2">
                                <Label htmlFor="desc-edit">Description</Label>
                                <Textarea
                                    id="desc-edit"
                                    value={metadata.description || ""}
                                    onChange={handleDescriptionChange}
                                    disabled={isSaving}
                                    className="h-24 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* 3. Error Display */}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveLink} disabled={!metadata || isSaving || isLoading}>
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}