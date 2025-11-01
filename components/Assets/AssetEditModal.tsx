// components/Assets/AssetEditModal.tsx
"use client";

import { useState, useEffect } from "react";
import { type Asset } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AssetEditModalProps {
  asset: Asset;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description: string;
  }) => Promise<void>;
}

export function AssetEditModal({
  asset,
  onClose,
  onSave,
}: AssetEditModalProps) {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description);
  const [isSaving, setIsSaving] = useState(false);

  // Ensure form fields update if the asset prop changes
  useEffect(() => {
    setTitle(asset.title);
    setDescription(asset.description);
  }, [asset]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({ title, description });
      // On success, the parent component will close the modal by
      // setting editingAsset to null, which unmounts this component.
    } catch (error) {
      console.error("Save failed:", error);
      // If saving fails, stay in the modal and allow user to retry
      setIsSaving(false);
    }
  };

  return (
    // `open={true}` and `onOpenChange={onClose}` ensure the modal
    // is controlled by the parent component's state.
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving} className="cursor-pointer">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}