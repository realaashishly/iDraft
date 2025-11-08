"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

import type { App, CreateAppPayload, UpdateAppPayload } from "@/type/types";
import { fetchMetadataAction } from "@/action/metadataActions";
import {
  createAppAction,
  updateAppAction,
} from "@/action/appActions"; // NEW IMPORTS
import { useState, useEffect } from "react";

interface AddAppModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAppCreated: () => void; // This re-fetches apps on the main page
  appToEdit?: App;
}

const EMPTY_FORM = {
  appLink: "",
  appName: "",
  appDescription: "",
  logoUrl: "",
};

export function AddAppModal({
  isOpen,
  onOpenChange,
  onAppCreated,
  appToEdit,
}: AddAppModalProps) {
  const isEditMode = !!appToEdit;

  const [formState, setFormState] = useState<CreateAppPayload>(
    appToEdit || EMPTY_FORM
  );
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null); // NEW: For db errors

  // Effect to populate form when `appToEdit` or `isOpen` changes
  useEffect(() => {
    if (isOpen) {
      if (appToEdit) {
        setFormState(appToEdit);
      } else {
        setFormState(EMPTY_FORM);
      }
    } else {
      // Clear all errors when modal closes
      setMetadataError(null);
      setSubmitError(null);
    }
  }, [appToEdit, isOpen]);

  // Handles closing the modal and resetting state
  const handleModalOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  // --- Metadata Fetching ---
  const handleLinkChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setFormState((prev) => ({ ...prev, appLink: newLink }));
    setMetadataError(null);
    setSubmitError(null);

    if (!newLink.startsWith("http")) {
      return;
    }

    setIsFetchingMetadata(true);
    try {
      const result = await fetchMetadataAction(newLink);

      if (result.success) {
        const metadata = result.data;
        setFormState((prev) => ({
          ...prev,
          // Only auto-fill if the field is empty or we are NOT in edit mode
          appName: !isEditMode || !prev.appName ? metadata.title : prev.appName,
          appDescription:
            !isEditMode || !prev.appDescription
              ? metadata.description
              : prev.appDescription,
          logoUrl:
            !isEditMode || !prev.logoUrl ? metadata.imageUrl : prev.logoUrl,
        }));
      } else {
        setMetadataError(result.error);
      }
    } catch (error) {
      setMetadataError("Failed to fetch metadata.");
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  // --- NEW: Handle form submission to create or update ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result;
      if (isEditMode && appToEdit) {
        // --- Call UPDATE Action ---
        const payload: UpdateAppPayload = { ...formState };
        result = await updateAppAction(appToEdit.id, payload);
      } else {
        // --- Call CREATE Action ---
        const payload: CreateAppPayload = { ...formState };
        result = await createAppAction(payload);
      }

      // --- Handle Result ---
      if (result.success) {
        onAppCreated(); // This re-fetches the list on the main page
        handleModalOpenChange(false); // Close the modal
      } else {
        setSubmitError(result.error); // Show database error
      }
    } catch (err) {
      setSubmitError("An unexpected client-side error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to update form state for any field
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit App" : "Add New App"}</DialogTitle>
        </DialogHeader>

        {/* --- FORM --- */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* App Link Input */}
            <div className="space-y-1">
              <Label htmlFor="appLink">App Link *</Label>
              <Input
                id="appLink"
                name="appLink"
                value={formState.appLink}
                onChange={handleLinkChange} // Fetches metadata
                placeholder="https://example.com/app"
                required
              />
              {isFetchingMetadata && (
                <div className="flex items-center text-sm text-blue-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching metadata...
                </div>
              )}
              {metadataError && (
                <p className="text-sm text-red-500">{metadataError}</p>
              )}
            </div>

            {/* App Name Input */}
            <div className="space-y-1">
              <Label htmlFor="appName">App Name *</Label>
              <Input
                id="appName"
                name="appName"
                value={formState.appName}
                onChange={handleFormChange} // Simple state update
                placeholder="My Awesome App"
                required
              />
            </div>

            {/* App Description Input */}
            <div className="space-y-1">
              <Label htmlFor="appDescription">Description</Label>
              <Textarea
                id="appDescription"
                name="appDescription"
                value={formState.appDescription}
                onChange={handleFormChange} // Simple state update
                placeholder="A brief description of the app."
              />
            </div>

            {/* Logo URL Input */}
            <div className="space-y-1">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                value={formState.logoUrl}
                onChange={handleFormChange} // Simple state update
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <DialogFooter>
            {/* Display submission errors */}
            {submitError && (
              <p className="mr-auto text-sm text-red-500">{submitError}</p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || isFetchingMetadata}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add App"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}