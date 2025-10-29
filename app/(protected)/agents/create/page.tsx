// app/agents/create/page.tsx
"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    UploadCloud,
    File as FileIcon,
    X,
    UserCircle,
    ArrowLeft,
} from "lucide-react";
import Image from "next/image";

import { useUploadThing } from "@/lib/uploadthing"; // Adjust path as needed
import { createAgentAction } from "@/action/agentActions";


// Interface for data sent to the server action (uses URLs)
interface CreateAgentPayload {
    name: string;
    title: string;
    description: string;
    systemInstructions: string;
    avatarUrl?: string | null;
    fileUrls?: string[];
}


export default function CreateAgentPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [systemInstructions, setSystemInstructions] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const filesInputRef = useRef<HTMLInputElement>(null);

    // --- NEW: Extracted Server Action Logic ---
    // This function will be called *after* files are successfully uploaded,
    // or immediately if there are no files to upload.
    const saveAgent = async (urls: { avatarUrl: string | null; fileUrls: string[] }) => {
        const { avatarUrl, fileUrls } = urls;
        
        console.log("Calling createAgentAction...");
        // isProcessing is already true, so we just call the action.
        const payload: CreateAgentPayload = {
            name,
            title,
            description,
            systemInstructions,
            avatarUrl: avatarUrl,
            fileUrls: fileUrls,
        };

        try {
            const result = await createAgentAction(payload);
            
            if (result.success) {
                console.log("Agent created successfully:", result.data);
                router.push('/agents'); // Navigate on success
                // No need to setIsProcessing(false) due to navigation
            } else {
                // Handle error returned from server action
                throw new Error(result.error || "Server action failed to create agent.");
            }
        } catch (err: any) {
            // Catch errors from server action
            console.error("Agent creation (action) failed:", err);
            setError(err.message || "An unexpected error occurred.");
            setIsProcessing(false); // Stop processing indicator ONLY on error
            setUploadProgress(null); // Reset progress on error
        }
    };
    // --- END NEW FUNCTION ---


    // --- 3. Initialize UploadThing Hook (MODIFIED) ---
    const { startUpload, isUploading } = useUploadThing(
        "imageUploader",
        {
            onUploadProgress: (progress) => {
                console.log("Upload Progress:", progress);
                setUploadProgress(progress);
            },
            
            // --- THIS IS THE KEY CHANGE ---
            // This callback now handles the server action call.
            onClientUploadComplete: async (res) => {
                console.log("Upload Completed on Client:", res);
                setUploadProgress(null); // Clear progress
                
                // 1. Parse results (same logic as before)
                let uploadedAvatarUrl: string | null = null;
                let uploadedFileUrls: string[] = [];
                let resultIndex = 0;
                
                // Check state to see if a profile image was part of this batch
                if (profileImage) {
                    uploadedAvatarUrl = res[resultIndex]?.url ?? null;
                    resultIndex++;
                }
                uploadedFileUrls = res.slice(resultIndex).map(r => r.url);
                
                // 2. Call the server action with the new URLs
                await saveAgent({
                    avatarUrl: uploadedAvatarUrl,
                    fileUrls: uploadedFileUrls,
                });
            },
            
            onUploadError: (error: Error) => {
                // This is critical for stopping the process on upload failure
                console.error("UploadThing Error during upload:", error);
                setError(`File upload failed: ${error.message}`);
                setIsProcessing(false); // Stop the overall process
                setUploadProgress(null);
            },
        }
    );

    // --- File Input Handlers (Unchanged) ---
    const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("Profile image must be less than 5MB.");
                return;
            }
            setError(null);
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => { setProfilePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
        event.target.value = "";
    };

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            if (files.length + newFiles.length > 5) {
                setError("You can attach a maximum of 5 files.");
                event.target.value = ""; return;
            }
            for (const file of newFiles) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
                    setError(`File "${file.name}" is too large (max 10MB).`);
                    event.target.value = ""; return;
                }
            }
            setError(null);
            setFiles((prev) => [...prev, ...newFiles]);
        }
        event.target.value = "";
    };

    const removeFile = (fileName: string) => {
        setFiles((prev) => prev.filter((f) => f.name !== fileName));
    };
    // --- End File Input Handlers ---


    // --- Form Submission Logic (MODIFIED) ---
    // This function is now much simpler.
    // It *only* starts the upload or calls saveAgent directly if no files.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Prevent submission if already uploading or submitting
        if (isUploading || isProcessing) return;

        setError(null);
        setIsProcessing(true); // Indicate overall process started
        setUploadProgress(null);

        // --- Step 1: Collect Files ---
        const filesToUpload: File[] = [];
        if (profileImage) filesToUpload.push(profileImage);
        if (files.length > 0) filesToUpload.push(...files);

        // --- Step 2: Decide what to do ---
        if (filesToUpload.length > 0) {
            // --- Has files: Start the upload ---
            console.log("Starting file upload...");
            setUploadProgress(0); // Show progress starting
            
            // !! NO AWAIT !!
            // Fire-and-forget. The `onClientUploadComplete` or `onUploadError`
            // callbacks will handle the next steps.
            startUpload(filesToUpload);
            
        } else {
            // --- No files: Call saveAgent directly ---
            console.log("No files to upload, saving agent directly.");
            
            // We await this because it's the full save operation
            await saveAgent({ avatarUrl: null, fileUrls: [] });
        }
    };
    
    // --- JSX (Unchanged) ---
    return (
        <div className="relative min-h-screen p-4 md:p-8">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="absolute top-4 left-4 md:top-8 md:left-8 z-10 text-muted-foreground hover:text-foreground"
                disabled={isProcessing || isUploading}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agents
            </Button>

            <div className="max-w-3xl mx-auto pt-16 md:pt-8">
                <h1 className="text-3xl font-bold mb-6 text-center">Create New Agent</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Image Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <Label htmlFor="profile-image-upload" className="text-lg font-medium">Profile Image</Label>
                        <div
                            className={`w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center relative overflow-hidden group bg-muted/20 
                                    ${isProcessing || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary transition-colors'}`}
                            onClick={() => !(isProcessing || isUploading) && profileInputRef.current?.click()}
                        >
                            {profilePreview ? (
                                <Image src={profilePreview} alt="Profile preview" layout="fill" objectFit="cover" />
                            ) : (
                                <UserCircle className="w-16 h-16 text-muted-foreground" />
                            )}
                            { !(isProcessing || isUploading) && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                                Upload
                                </div>
                            )}
                        </div>
                        <input
                            id="profile-image-upload" ref={profileInputRef} type="file" accept="image/*"
                            onChange={handleProfileImageChange} className="hidden" disabled={isProcessing || isUploading}
                        />
                    </div>

                    {/* Agent Name */}
                    <div className="space-y-2">
                        <Label htmlFor="agent-name" className="font-medium">Agent Name</Label>
                        <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Marketing Assistant" required disabled={isProcessing || isUploading}/>
                    </div>

                    {/* Agent Title */}
                    <div className="space-y-2">
                        <Label htmlFor="agent-title" className="font-medium">Title / Role</Label>
                        <Input id="agent-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Content Strategist" required disabled={isProcessing || isUploading}/>
                    </div>

                    {/* Agent Description */}
                    <div className="space-y-2">
                        <Label htmlFor="agent-description" className="font-medium">Description</Label>
                        <Textarea id="agent-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do? Briefly explain its purpose." rows={3} required disabled={isProcessing || isUploading}/>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <Label htmlFor="system-instructions" className="font-medium">System Prompt / Instructions</Label>
                        <Textarea id="system-instructions" value={systemInstructions} onChange={(e) => setSystemInstructions(e.target.value)} placeholder="Define the agent's personality, capabilities, limitations, and how it should respond..." rows={8} required disabled={isProcessing || isUploading}/>
                        <p className="text-xs text-muted-foreground">Provide detailed instructions for the AI's behavior and context.</p>
                    </div>

                    {/* Optional File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="agent-files" className="font-medium">Attach Files (Optional)</Label>
                        <div
                            className={`border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-muted/5 ${isProcessing || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary hover:bg-muted/10'}`}
                            onClick={() => !(isProcessing || isUploading) && filesInputRef.current?.click()}
                        >
                            <UploadCloud className="w-10 h-10 text-muted-foreground mb-3"/>
                            <p className="text-sm font-medium text-foreground mb-1">Click or drag files to attach</p>
                            <p className="text-xs text-muted-foreground">Supports various document and data formats.</p>
                            <input id="agent-files" ref={filesInputRef} type="file" multiple onChange={handleFilesChange} className="hidden" disabled={isProcessing || isUploading} />
                        </div>
                        {/* Display attached files */}
                        {files.length > 0 && (
                            <div className="mt-3 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/20">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Attached files:</p>
                                {files.map(file => (
                                    <div key={file.name} className="text-sm p-1.5 px-3 border border-border rounded-md flex items-center justify-between bg-background">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => !(isProcessing || isUploading) && removeFile(file.name)} disabled={isProcessing || isUploading}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Progress Indicator */}
                    {isUploading && uploadProgress !== null && (
                        <div className="w-full bg-muted rounded-full h-2.5 dark:bg-zinc-700">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-150 ease-linear" style={{ width: `${uploadProgress}%` }}></div>
                            <p className="text-xs text-center text-muted-foreground mt-1">Uploading files... {uploadProgress}%</p>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <Button type="submit" size="lg" disabled={isUploading || isProcessing || !name || !title}>
                            {isUploading
                                ? `Uploading (${uploadProgress ?? 0}%)`
                                : isProcessing // This will now be true for both upload AND save
                                ? "Saving Agent..."
                                : "Create Agent"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}