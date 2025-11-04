// components/Assets/AssetEditModal.tsx
"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Asset } from "@/type/types";

interface AssetEditModalProps {
  asset: Asset;
  onClose: () => void;
  onSave: (payload: { title: string; description: string }) => Promise<void>;
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
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="title">
              Title
            </Label>
            <Input
              className="col-span-3"
              id="title"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="pt-2 text-right" htmlFor="description">
              Description
            </Label>
            <Textarea
              className="col-span-3"
              id="description"
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              value={description}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="cursor-pointer" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="cursor-pointer"
            disabled={isSaving}
            onClick={handleSubmit}
          >
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
