"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress"; // 1. Import Progress
import { UploadCloud, File, X, Loader2 } from "lucide-react";


import { useUploadThing } from "@/lib/uploadthing";
import { createAppAction } from "@/action/appActions";

// Define the form schema (no change)
const appFormSchema = z.object({
  appName: z.string().min(2, "App name must be at least 2 characters."),
  appDescription: z.string().optional(),
  appLink: z.string().url("Please enter a valid URL (e.g., https://...)"),
});

type AppFormValues = z.infer<typeof appFormSchema>;

// Define props for the modal
interface AddAppModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // 3. Add a prop to refresh the app list on success
  onAppCreated: () => void; 
}

export function AddAppModal({
  isOpen,
  onOpenChange,
  onAppCreated, // 4. Use the new prop
}: AddAppModalProps) {
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 5. Initialize UploadThing hook
  //    Make sure "imageUploader" is an endpoint that accepts single images
  const { startUpload } = useUploadThing("imageUploader", {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: () => {
      setIsUploading(false);
      setUploadProgress(100);
    },
    onUploadError: (err) => {
      console.error("Upload error", err);
      setError(`Logo upload failed: ${err.message}`);
      setIsProcessing(false);
      setIsUploading(false);
    },
  });

  // Initialize the form (no change)
  const form = useForm<AppFormValues>({
    resolver: zodResolver(appFormSchema),
    defaultValues: {
      appName: "",
      appDescription: "",
      appLink: "",
    },
  });

  // Handle file selection (no change)
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLogoFile(event.target.files?.[0] || null);
    setError(null); // Clear error on new file select
  };

  // 6. Handle the final form submission (REPLACED)
  const onSubmit = async (data: AppFormValues) => {
    if (!logoFile) {
      setError("Please upload an app logo.");
      return;
    }

    setIsProcessing(true);
    setIsUploading(true);
    setError(null);

    try {
      // --- 1. Upload the logoFile ---
      console.log("Starting logo upload...");
      const uploadResult = await startUpload([logoFile]);

      // Check for upload error (onUploadError will also catch this)
      if (!uploadResult || uploadResult.length === 0) {
        throw new Error("Logo upload failed. Please try again.");
      }

      const { url: logoUrl } = uploadResult[0];
      console.log("Logo uploaded:", logoUrl);

      // --- 2. Call the server action ---
      console.log("Calling server action...");
      const actionResult = await createAppAction({
        ...data,
        logoUrl: logoUrl,
      });

      if (!actionResult.success) {
        throw new Error(actionResult.error);
      }

      // --- 3. Handle Success ---
      console.log("App created!");
      onAppCreated(); // Refresh the list on the page
      form.reset();
      setLogoFile(null);
      onOpenChange(false); // Close the modal

    } catch (err: any) {
      console.error("Failed to create app:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper to determine button text
  const getButtonText = () => {
    if (isUploading) {
      return `Uploading... ${uploadProgress}%`;
    }
    if (isProcessing) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      );
    }
    return "Save App";
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isProcessing) return; // Don't close while submitting
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New App</DialogTitle>
          <DialogDescription>
            Fill in the details for the new app. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* App Logo */}
            <FormItem>
              <FormLabel>App Logo</FormLabel>
              <FormControl>
                <div
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 p-6 text-center transition-colors hover:border-primary ${
                    isProcessing ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  onClick={() =>
                    !isProcessing && logoInputRef.current?.click()
                  }
                >
                  <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Click to upload logo (1 file only)
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={isProcessing}
                  />
                </div>
              </FormControl>
              {logoFile && !isUploading && (
                <div className="mt-2 flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <File className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{logoFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => !isProcessing && setLogoFile(null)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {isUploading && <Progress value={uploadProgress} className="mt-2" />}
              <FormMessage />
            </FormItem>

            {/* App Name */}
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Project Manager"
                      {...field}
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* App Description */}
            <FormField
              control={form.control}
              name="appDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this app do?"
                      {...field}
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* App Visit Link */}
            <FormField
              control={form.control}
              name="appLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Visit Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Message */}
            {error && (
              <p className="text-center text-sm font-medium text-red-500">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isProcessing}>
                {getButtonText()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}