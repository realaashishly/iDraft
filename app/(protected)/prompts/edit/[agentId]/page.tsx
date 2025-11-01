// app/agents/edit/[agentId]/page.tsx
"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserCircle, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

import { useUploadThing } from "@/lib/uploadthing";
// --- Import NEW and RENAMED actions ---
import { 
    updateAgentAction, 
    getAgentByIdAction,
    CreateAgentPayload, 
} from "@/action/agentActions";

// Note: CreateAgentPayload is reused for the update payload

export default function EditAgentPage() {
    const router = useRouter();
    const params = useParams();
    const agentId = params.agentId as string;

    // --- State ---
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [systemInstructions, setSystemInstructions] = useState("");
    
    // 'profileImage' is for a NEWLY uploaded file
    const [profileImage, setProfileImage] = useState<File | null>(null); 
    // 'profilePreview' shows the current image (new or existing)
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    // 'existingAvatarUrl' stores the original URL from the DB
    const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null); 

    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true); // --- NEW: State for initial fetch
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);

    // --- NEW: Data Fetching Effect ---
    useEffect(() => {
        if (!agentId) {
            setError("No agent ID provided.");
            setIsLoadingData(false);
            return;
        }

        const fetchAgentData = async () => {
            setIsLoadingData(true);
            const result = await getAgentByIdAction(agentId);
            
            if (result.success) {
                const agent = result.data;
                setName(agent.name);
                setTitle(agent.title);
                setDescription(agent.description);
                setSystemInstructions(agent.systemInstructions);
                setProfilePreview(agent.avatarUrl || null); // Set the preview to the existing avatar
                setExistingAvatarUrl(agent.avatarUrl || null); // Store the original URL
            } else {
                setError(result.error);
            }
            setIsLoadingData(false);
        };

        fetchAgentData();
    }, [agentId]);

    // --- RENAMED: Server Action Logic ---
    // This function now calls updateAgentAction
    const saveAgentChanges = async (urls: { newAvatarUrl: string | null }) => {
        const { newAvatarUrl } = urls;
        
        // **Logic:** Use the new URL if one was just uploaded.
        // If no new file was uploaded (newAvatarUrl is null), use the existing one.
        const finalAvatarUrl = newAvatarUrl !== null ? newAvatarUrl : existingAvatarUrl;

        const payload: CreateAgentPayload = {
            name,
            title,
            description,
            systemInstructions,
            avatarUrl: finalAvatarUrl,
        };

        try {
            // **CHANGED:** Call updateAgentAction
            const result = await updateAgentAction(agentId, payload);
            
            if (result.success) {
                console.log("Agent updated successfully:", result.data);
                router.push('/prompts'); // Navigate to agents list
            } else {
                throw new Error(result.error || "Server action failed to update agent.");
            }
        } catch (err: any) {
            console.error("Agent update (action) failed:", err);
            setError(err.message || "An unexpected error occurred.");
            setIsProcessing(false);
            setUploadProgress(null);
        }
    };
    // --- END RENAMED FUNCTION ---

    // --- Initialize UploadThing Hook ---
    const { startUpload, isUploading } = useUploadThing(
        "imageUploader",
        {
            onUploadProgress: (progress) => {
                setUploadProgress(progress);
            },
            onClientUploadComplete: async (res) => {
                setUploadProgress(null);
                
                let uploadedAvatarUrl: string | null = null;
                
                if (profileImage) { // Check if a new file was staged
                    uploadedAvatarUrl = res[0]?.url ?? null;
                }
                
                // **CHANGED:** Call saveAgentChanges with the NEW URL
                await saveAgentChanges({ newAvatarUrl: uploadedAvatarUrl });
            },
            onUploadError: (error: Error) => {
                console.error("UploadThing Error during upload:", error);
                setError(`File upload failed: ${error.message}`);
                setIsProcessing(false);
                setUploadProgress(null);
            },
        }
    );

    // --- File Input Handler (Unchanged) ---
    const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("Profile image must be less than 5MB.");
                return;
            }
            setError(null);
            setProfileImage(file); // Stage the new file for upload
            const reader = new FileReader();
            reader.onloadend = () => { setProfilePreview(reader.result as string); }; // Update preview
            reader.readAsDataURL(file);
        }
        event.target.value = "";
    };

    // --- MODIFIED: Form Submission Logic ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploading || isProcessing) return;

        setError(null);
        setIsProcessing(true);

        // **MODIFIED:** Check if a *new* profile image was staged
        if (profileImage) {
            // --- Has new file: Start the upload ---
            setUploadProgress(0);
            startUpload([profileImage]); // Upload the new file
            // The onClientUploadComplete callback will handle saving
        } else {
            // --- No new file: Call saveAgentChanges directly ---
            console.log("No new files to upload, saving agent changes directly.");
            // Pass 'null' to indicate no new URL was generated
            await saveAgentChanges({ newAvatarUrl: null });
        }
    };
    
    // --- NEW: Loading State ---
    if (isLoadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">Loading agent data...</p>
            </div>
        );
    }

    // --- JSX (Titles and Button Text Changed) ---
    return (
        <div className="relative min-h-screen p-4 md:p-8">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="absolute top-4 left-4 md:top-8 md:left-8 z-10 text-muted-foreground hover:text-foreground cursor-pointer"
                disabled={isProcessing || isUploading}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <div className="max-w-3xl mx-auto pt-16 md:pt-8">
                {/* --- CHANGED --- */}
                <h1 className="text-3xl font-bold mb-6 text-center">Edit Agent</h1>

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
                                 Change
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

                    {/* (File upload section remains commented out) */}

                    {/* Upload Progress Indicator */}
                    {isUploading && uploadProgress !== null && (
                        <div className="w-full bg-muted rounded-full h-2.5 dark:bg-zinc-700">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-150 ease-linear" style={{ width: `${uploadProgress}%` }}></div>
                            <p className="text-xs text-center text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        {/* --- CHANGED --- */}
                        <Button type="submit" size="lg" className="cursor-pointer" disabled={isUploading || isProcessing || !name || !title}>
                            {isUploading
                                ? `Uploading (${uploadProgress ?? 0}%)`
                                : isProcessing
                                ? "Saving Changes..."
                                : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}