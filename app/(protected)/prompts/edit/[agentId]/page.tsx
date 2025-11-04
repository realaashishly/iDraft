// app/agents/edit/[agentId]/page.tsx
"use client";

// --- Icon Imports ---
import { ArrowLeft, Loader2, UserCircle } from "lucide-react";
// --- React & Next.js Imports ---
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
// --- Actions, Libs & Types ---
import { getAgentByIdAction, updateAgentAction } from "@/action/agentActions";
// --- Component Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";
import type { CreateAgentPayload } from "@/type/types";

/** Note: CreateAgentPayload is reused here, as the update schema matches the creation schema. */

/**
 * EditAgentPage
 * A client component page that allows users to edit the details of an existing agent.
 * It fetches the agent's current data, pre-populates the form, and handles
 * form submission, including optional avatar image uploads via UploadThing.
 */
export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;

  // --- Component State ---

  // Form field states
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");

  /**
   * State for managing the agent's avatar.
   * This requires three pieces of state to handle all edit cases:
   */
  // 1. A new file staged for upload (e.g., File object)
  const [profileImage, setProfileImage] = useState<File | null>(null);
  // 2. The URL to display in the preview (can be a local blob: URL or the existing http: URL)
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  // 3. The original avatar URL loaded from the database, to be reused if no new image is uploaded.
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null
  );

  // UI/Loading states
  const [isProcessing, setIsProcessing] = useState(false); // General processing (saving)
  const [isLoadingData, setIsLoadingData] = useState(true); // Initial data fetch
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Ref to programmatically trigger the hidden file input
  const profileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Effect: Fetch Agent Data
   * On component mount, fetches the existing agent's data using the `agentId`
   * from the URL parameters and populates the form state.
   */
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
        // Set both preview and existing URL from the fetched data
        setProfilePreview(agent.avatarUrl || null);
        setExistingAvatarUrl(agent.avatarUrl || null);
      } else {
        setError(result.error);
      }
      setIsLoadingData(false);
    };

    fetchAgentData();
  }, [agentId]);

  /**
   * saveAgentChanges
   * Final step in the update process. This function is called *after* any
   * potential file upload is complete, or directly by handleSubmit if no
   * new file was staged.
   *
   * @param urls - An object containing the `newAvatarUrl`, which is
   * the URL from UploadThing (if a new file was uploaded) or `null`.
   */
  const saveAgentChanges = async (urls: { newAvatarUrl: string | null }) => {
    const { newAvatarUrl } = urls;

    // Determine the correct URL to save. Use the new URL if one was uploaded,
    // otherwise, fall back to the existing URL.
    const finalAvatarUrl =
      newAvatarUrl !== null ? newAvatarUrl : existingAvatarUrl;

    const payload: CreateAgentPayload = {
      name,
      title,
      description,
      systemInstructions,
      avatarUrl: finalAvatarUrl,
    };

    try {
      // Call the update server action
      const result = await updateAgentAction(agentId, payload);

      if (result.success) {
        console.log("Agent updated successfully:", result.data);
        router.push("/prompts"); // Navigate back to the agents list
      } else {
        throw new Error(
          result.error || "Server action failed to update agent."
        );
      }
    } catch (err: any) {
      console.error("Agent update (action) failed:", err);
      setError(err.message || "An unexpected error occurred.");
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  /**
   * UploadThing Hook Setup
   * Configures the `useUploadThing` hook for the "imageUploader" endpoint.
   */
  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    /**
     * onUploadProgress: Updates the UI with the current upload percentage.
     */
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    /**
     * onClientUploadComplete: Fired when UploadThing successfully uploads a file.
     * It receives the file URL and then calls `saveAgentChanges` to complete the agent update.
     */
    onClientUploadComplete: async (res) => {
      setUploadProgress(null);

      let uploadedAvatarUrl: string | null = null;

      // Only assign the URL if a new file was actually staged
      if (profileImage) {
        uploadedAvatarUrl = res[0]?.url ?? null;
      }

      // Pass the new URL (or null if upload failed) to the save function
      await saveAgentChanges({ newAvatarUrl: uploadedAvatarUrl });
    },
    /**
     * onUploadError: Handles errors specifically from the UploadThing process.
     */
    onUploadError: (error: Error) => {
      console.error("UploadThing Error during upload:", error);
      setError(`File upload failed: ${error.message}`);
      setIsProcessing(false);
      setUploadProgress(null);
    },
  });

  /**
   * handleProfileImageChange
   * Fired when the user selects a file from the file input.
   * 1. Validates the file (e.g., size).
   * 2. Stages the file in the `profileImage` state for `handleSubmit` to process.
   * 3. Uses FileReader to create a local preview URL and sets it in `profilePreview`.
   */
  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile image must be less than 5MB.");
        return;
      }
      setError(null);

      // 1. Stage the new file for upload
      setProfileImage(file);

      // 2. Generate a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string); // Update preview
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file if needed
    event.target.value = "";
  };

  /**
   * handleSubmit
   * Orchestrates the form submission.
   * It checks if a *new* profile image has been staged (`profileImage` state).
   * - If YES: It starts the UploadThing process (`startUpload`).
   * `onClientUploadComplete` will then call `saveAgentChanges`.
   * - If NO: It calls `saveAgentChanges` directly, passing `null` for the
   * newAvatarUrl, which signals to reuse the `existingAvatarUrl`.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading || isProcessing) return; // Prevent multiple submissions

    setError(null);
    setIsProcessing(true);

    // Check if a new file was staged
    if (profileImage) {
      // Case 1: New file exists. Start the upload.
      setUploadProgress(0);
      startUpload([profileImage]);
      // The `onClientUploadComplete` callback will handle the final save.
    } else {
      // Case 2: No new file. Save form data directly.
      console.log("No new files to upload, saving agent changes directly.");
      // Pass 'null' to indicate no new URL was generated
      await saveAgentChanges({ newAvatarUrl: null });
    }
  };

  // --- Render Logic ---

  /**
   * Initial Loading State
   * Renders a spinner while fetching the agent's data.
   */
  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading agent data...</p>
      </div>
    );
  }

  /**
   * Main Edit Form
   */
  return (
    <div className="relative min-h-screen p-4 md:p-8">
      {/* Back Button */}
      <Button
        className="absolute top-4 left-4 z-10 cursor-pointer text-muted-foreground hover:text-foreground md:top-8 md:left-8"
        disabled={isProcessing || isUploading}
        onClick={() => router.back()}
        variant="ghost"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mx-auto max-w-3xl pt-16 md:pt-8">
        <h1 className="mb-6 text-center font-bold text-3xl">Edit Agent</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Profile Image Upload Section */}
          <div className="flex flex-col items-center gap-2">
            <Label
              className="font-medium text-lg"
              htmlFor="profile-image-upload"
            >
              Profile Image
            </Label>
            {/* Clickable avatar preview area */}
            <div
              className={`group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-muted-foreground/50 border-dashed bg-muted/20 ${
                isProcessing || isUploading
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer transition-colors hover:border-primary"
              }`}
              // Programmatically click the hidden file input
              onClick={() =>
                !(isProcessing || isUploading) &&
                profileInputRef.current?.click()
              }
            >
              {profilePreview ? (
                <Image
                  alt="Profile preview"
                  layout="fill"
                  objectFit="cover"
                  src={profilePreview}
                />
              ) : (
                <UserCircle className="h-16 w-16 text-muted-foreground" />
              )}
              {/* Hover effect to indicate clickability */}
              {!(isProcessing || isUploading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-medium text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Change
                </div>
              )}
            </div>
            {/* Hidden file input, controlled by the ref */}
            <input
              accept="image/*"
              className="hidden"
              disabled={isProcessing || isUploading}
              id="profile-image-upload"
              onChange={handleProfileImageChange}
              ref={profileInputRef}
              type="file"
            />
          </div>

          {/* Agent Name Field */}
          <div className="space-y-2">
            <Label className="font-medium" htmlFor="agent-name">
              Agent Name
            </Label>
            <Input
              disabled={isProcessing || isUploading}
              id="agent-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Assistant"
              required
              value={name}
            />
          </div>

          {/* Agent Title Field */}
          <div className="space-y-2">
            <Label className="font-medium" htmlFor="agent-title">
              Title / Role
            </Label>
            <Input
              disabled={isProcessing || isUploading}
              id="agent-title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Content Strategist"
              required
              value={title}
            />
          </div>

          {/* Agent Description Field */}
          <div className="space-y-2">
            <Label className="font-medium" htmlFor="agent-description">
              Description
            </Label>
            <Textarea
              disabled={isProcessing || isUploading}
              id="agent-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do? Briefly explain its purpose."
              required
              rows={3}
              value={description}
            />
          </div>

          {/* System Prompt Field */}
          <div className="space-y-2">
            <Label className="font-medium" htmlFor="system-instructions">
              System Prompt / Instructions
            </Label>
            <Textarea
              disabled={isProcessing || isUploading}
              id="system-instructions"
              onChange={(e) => setSystemInstructions(e.target.value)}
              placeholder="Define the agent's personality, capabilities, limitations, and how it should respond..."
              required
              rows={8}
              value={systemInstructions}
            />
            <p className="text-muted-foreground text-xs">
              Provide detailed instructions for the AI's behavior and context.
            </p>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && uploadProgress !== null && (
            <div className="h-2.5 w-full rounded-full bg-muted dark:bg-zinc-700">
              <div
                className="h-2.5 rounded-full bg-primary transition-all duration-150 ease-linear"
                style={{ width: `${uploadProgress}%` }}
              />
              <p className="mt-1 text-center text-muted-foreground text-xs">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Error Message Display */}
          {error && <p className="font-medium text-red-500 text-sm">{error}</p>}

          {/* Form Submission Button */}
          <div className="flex justify-end pt-4">
            <Button
              className="cursor-pointer"
              disabled={
                isUploading || // Disable while uploading
                isProcessing || // Disable while saving
                !name || // Disable if required fields are empty
                !title
              }
              size="lg"
              type="submit"
            >
              {/* Dynamic button text based on state */}
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
