"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, File as FileIcon, X, AlertCircle } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { createAsset } from "@/action/assetAction";


export default function AssetUploadButton({ onUploadComplete }: { onUploadComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // New state for saving to DB

    const MAX_SIZE = 16 * 1024 * 1024;

    // Helper to reset all states
    const resetForm = () => {
        setFile(null);
        setTitle("");
        setDescription("");
        setError(null);
        setIsUploading(false);
        setIsSaving(false);
    };

    // Initialize the UploadThing hook
    const { startUpload } = useUploadThing(
        "imageUploader", // Your file route name
        {
            onClientUploadComplete: async (res) => {
                setIsUploading(false);
                const uploadedFile = res[0];
                if (!file) return;

                // Build the asset data object to save
                const assetData = {
                    title: title,
                    description: description || "",
                    fileUrl: uploadedFile.url,
                    fileType: file.type || "unknown",
                    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                };

                try {
                    
                    setIsSaving(true);
                    const result = await createAsset(assetData);

                    if (!result.success) {
                        throw new Error(result.error);
                    }

                  
                    resetForm();
                    setIsOpen(false);
                    onUploadComplete();
                    
                    
                } catch (dbError: any) {
                    setError(`Failed to save to database: ${dbError.message}`);
                    setIsSaving(false);
                }
            },
            onUploadError: (error: Error) => {
                setIsUploading(false);
                setError(`Upload failed: ${error.message}`);
            },
            onUploadBegin: () => {
                setError(null);
                setIsUploading(true);
            },
        }
    );

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            setError(null);
            if (fileRejections.length > 0) {
                const rejection = fileRejections[0];
                if (rejection.file.size > MAX_SIZE) {
                    setError(
                        `File too large. Max size is ${formatBytes(MAX_SIZE)}.`
                    );
                } else {
                    setError(rejection.errors[0].message);
                }
                setFile(null);
                return;
            }
            if (acceptedFiles.length > 0) {
                const f = acceptedFiles[0];
                setFile(f);
                setTitle(f.name.split(".").slice(0, -1).join(".") || f.name);
                setDescription("");
            }
        },
        []
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: MAX_SIZE,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }
        if (!title) {
            setError("Please enter a title.");
            return;
        }
        // This just starts the upload.
        // The 'onClientUploadComplete' callback handles the database saving.
        await startUpload([file]);
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Upload File</Button>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        resetForm(); // Reset form if dialog is closed
                    }
                }}
            >
                <DialogContent className='sm:max-w-[500px] max-h-[80vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                        <DialogDescription>
                            Select any file. Max size: {formatBytes(MAX_SIZE)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4 py-4'>
                        {!file ? (
                            <div
                                {...getRootProps()}
                                className={`relative p-8 w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                    isDragActive
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                }`}
                            >
                                <input {...getInputProps()} />
                                <div className='flex flex-col items-center justify-center text-center'>
                                    <UploadCloud className='w-12 h-12 text-muted-foreground mb-4' />
                                    <p className='font-semibold text-foreground'>
                                        {isDragActive
                                            ? "Drop here..."
                                            : "Drag & drop or click to browse"}
                                    </p>
                                    <p className='text-xs text-muted-foreground mt-1'>
                                        Any file type supported
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className='relative p-4 border border-dashed rounded-lg bg-background/50'>
                                <div className='flex items-center space-x-4'>
                                    <FileIcon className='h-10 w-10 text-primary' />
                                    <div className='flex-1 overflow-hidden'>
                                        <p className='text-sm font-medium text-foreground truncate'>
                                            {file.name}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>
                                            {formatBytes(file.size)} •{" "}
                                            {file.type}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground'
                                    onClick={() => setFile(null)}
                                    disabled={isUploading || isSaving}
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                        )}

                        {error && (
                            <div className='flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20'>
                                <AlertCircle className='h-4 w-4 text-destructive' />
                                <p className='text-sm text-destructive'>
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className='space-y-2'>
                            <label className='text-sm font-medium text-muted-foreground'>
                                Title
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isUploading || isSaving}
                            />
                        </div>

                        <div className='space-y-2'>
                            <label className='text-sm font-medium text-muted-foreground'>
                                Description
                            </label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isUploading || isSaving}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setIsOpen(false)}
                            disabled={isUploading || isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading || isSaving || !file || !title}
                        >
                            {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Upload"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}