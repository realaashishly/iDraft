// app/agents/create/page.tsx
"use client";

import { ArrowLeft, UserCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { type ChangeEvent, useRef, useState } from "react";
import { createAgentAction } from "@/action/agentActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";
import type { CreateAgentPayload } from "@/type/types";

/**
 * Renders a form for creating a new AI Agent.
 * Handles form state, profile image upload, and submission to a server action.
 */

export default function CreateAgentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);

  const KILOBYTE = 1024;
  const MAX_SIZE_MB = 5;
  const MEGABYTE = KILOBYTE * KILOBYTE;
  const MAX_PROFILE_IMAGE_SIZE = MAX_SIZE_MB * MEGABYTE;

  /**
   * Helper function to call the server action with agent data.
   * This is called after file uploads are complete, or directly if no files.
   * @param urls An object containing the (optional) uploaded avatar URL.
   */
  const saveAgent = async (urls: {
    avatarUrl: string | null;
    fileUrls: string[];
  }) => {
    const { avatarUrl } = urls;

    const payload: CreateAgentPayload = {
      name,
      title,
      description,
      systemInstructions,
      avatarUrl,
    };

    try {
      const result = await createAgentAction(payload);

      if (result.success) {
        router.push("/prompts"); // Navigate on success
      } else {
        throw new Error(
          result.error || "Server action failed to create agent."
        );
      }
    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },

    /**
     * Called when UploadThing successfully completes all file uploads.
     * This then triggers the `saveAgent` server action.
     */
    onClientUploadComplete: async (res) => {
      setUploadProgress(null);
      let uploadedAvatarUrl: string | null = null;
      const resultIndex = 0;

      if (profileImage) {
        uploadedAvatarUrl = res[resultIndex]?.url ?? null;
      }

      await saveAgent({
        avatarUrl: uploadedAvatarUrl,
        fileUrls: [],
      });
    },

    /**
     * Called if UploadThing fails during the upload process.
     */
    onUploadError: (uploadError: Error) => {
      setError(`File upload failed: ${uploadError.message}`);
      setIsProcessing(false);
      setUploadProgress(null);
    },
  });

  /**
   * Handles the file input change event for the profile image.
   * Validates file size and generates a local preview.
   * @param event The React ChangeEvent from the file input.
   */
  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        setError("Profile image must be less than 5MB.");
        return;
      }
      setError(null);
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  /**
   * Handles the main form submission.
   * If a profile image is present, it starts the upload process.
   * If not, it directly calls `saveAgent` with no URLs.
   * @param e The React FormEvent.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading || isProcessing) {
      return;
    }

    setError(null);
    setIsProcessing(true);
    setUploadProgress(null);

    const filesToUpload: File[] = [];
    if (profileImage) {
      filesToUpload.push(profileImage);
    }

    if (filesToUpload.length > 0) {
      // Has files: Start the upload.
      // `onClientUploadComplete` will call `saveAgent` upon success.
      setUploadProgress(0);
      startUpload(filesToUpload);
    } else {
      // No files: Call saveAgent directly.
      await saveAgent({ avatarUrl: null, fileUrls: [] });
    }
  };

  return (
    <div className="relative min-h-screen p-4 md:p-8">
      <Button
        className="absolute top-4 left-4 z-10 cursor-pointer text-muted-foreground hover:text-foreground md:top-8 md:left-8"
        disabled={isProcessing || isUploading}
        onClick={() => router.back()}
        variant="ghost"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Agents
      </Button>

      <div className="mx-auto max-w-3xl pt-16 md:pt-8">
        <h1 className="mb-6 text-center font-bold text-3xl">
          Create New Agent
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-2">
            <Label
              className="font-medium text-lg"
              htmlFor="profile-image-upload"
            >
              Profile Image
            </Label>
            <button
              className={`group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-muted-foreground/50 border-dashed bg-muted/20 ${
                isProcessing || isUploading
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer transition-colors hover:border-primary"
              }`} // 1. Intrinsic HTML attributes first
              onClick={() =>
                !(isProcessing || isUploading) &&
                profileInputRef.current?.click()
              } // 2. className next
              type="button" // 3. Event handler last
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
              {!(isProcessing || isUploading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-medium text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Upload
                </div>
              )}
            </button>
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

          {/* Agent Name */}
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

          {/* Agent Title */}
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

          {/* Agent Description */}
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

          {/* System Prompt */}
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
                Creating files... {uploadProgress}%
              </p>
            </div>
          )}

          {error && <p className="font-medium text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              className="cursor-pointer"
              disabled={isUploading || isProcessing || !name || !title}
              size="lg"
              type="submit"
            >
              {/* Use a function to calculate the text and avoid nesting */}
              {(() => {
                if (isUploading) {
                  return `Creating (${uploadProgress ?? 0}%)`;
                }
                if (isProcessing) {
                  return "Saving Agent...";
                }
                return "Create Agent";
              })()}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
