"use client";

import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deleteAsset, getAssets, updateAsset } from "@/action/assetAction";
import { AssetDetailModal } from "@/components/Assets/AssetDetails";
import { AssetEditModal } from "@/components/Assets/AssetEditModal";
import { AssetCard, AssetCardSkeleton } from "@/components/Assets/AssetsCard";
import AssetUploadButton from "@/components/Assets/AssetUploadButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import type { Asset } from "@/type/types";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToConfirmDelete, setAssetToConfirmDelete] =
    useState<Asset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

  const { data: session } = useSession();

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAssets = await getAssets();
      setAssets(fetchedAssets);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        // Handle cases where a non-Error was thrown
        setError(new Error("An unknown error occurred"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        const searchMatch =
          asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.description.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch =
          fileTypeFilter === "all" ||
          asset.fileType?.startsWith(fileTypeFilter);
        return searchMatch && typeMatch;
      }),
    [assets, searchTerm, fileTypeFilter]
  );

  const handleDelete = async (assetId: string) => {
    setDeletingAssetId(assetId);
    try {
      const result = await deleteAsset(assetId);
      if (result.success) {
        setAssets((prevAssets) =>
          prevAssets.filter((asset) => asset.id !== assetId)
        );
        setAssetToConfirmDelete(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        // Handle cases where a non-Error was thrown
        setError(new Error("An unknown error occurred"));
      }
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleUpdate = async (payload: {
    title: string;
    description: string;
  }) => {
    if (!editingAsset) {
      throw new Error("No asset selected for editing.");
    }

    try {
      const result = await updateAsset(editingAsset.id, payload);

      if (result.success && result.data) {
        setAssets((prevAssets) =>
          prevAssets.map((asset) =>
            asset.id === editingAsset.id ? { ...asset, ...result.data } : asset
          )
        );
        setEditingAsset(null);
      } else {
        throw new Error(result.error || "Failed to update asset.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        // Handle cases where a non-Error was thrown
        setError(new Error("An unknown error occurred"));
      }
    }
  };

  // --- REFACTORED LOGIC ---
  // This logic was moved out of the JSX to avoid nested ternaries.
  let gridContent: ReactNode;

  if (isLoading) {
    // 1. Loading state
    gridContent = (
      <>
        <AssetCardSkeleton />
        <AssetCardSkeleton />
        <AssetCardSkeleton />
        <AssetCardSkeleton />
      </>
    );
  } else if (error) {
    // 4. Error state
    gridContent = (
      <p className="col-span-full text-center text-destructive">
        Failed to load assets: {error.message}
      </p>
    );
  } else if (filteredAssets.length === 0) {
    // 2. Empty state (also fixed the nested ternary for the message)
    const emptyMessage =
      assets.length === 0
        ? "No assets found. Upload your first file!"
        : "No assets match your search or filter.";

    gridContent = (
      <p className="col-span-full text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  } else {
    // 3. Data state
    gridContent = filteredAssets.map((asset) => (
      <AssetCard
        asset={asset}
        // @ts-expect-error
        isAdmin={session?.user.role === "admin"}
        isDeleting={deletingAssetId === asset.id}
        key={asset.id}
        onClick={() => setSelectedAsset(asset)}
        onDelete={() => setAssetToConfirmDelete(asset)}
        onEdit={() => setEditingAsset(asset)}
      />
    ));
  }
  // --- END REFACTORED LOGIC ---

  return (
    <>
      {/* --- WRAP IN COLLAPSIBLE --- */}
      <Collapsible>
        <div className="p-4">
          {/* --- UPDATED HEADER --- */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-bold text-3xl">Your Assets</h1>
            <div className="flex items-center gap-2">
              {" "}
              {/* Wrapper for buttons */}
              <CollapsibleTrigger asChild>
                <Button size="icon" variant="outline">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              {/* @ts-expect-error */}
              {session?.user.role === "admin" && (
                <AssetUploadButton onUploadComplete={loadAssets} />
              )}
            </div>
          </div>
          {/* --- END UPDATED HEADER --- */}

          {/* --- UPDATED FILTER/SEARCH BAR (NOW COLLAPSIBLE) --- */}
          <CollapsibleContent>
            <div className="fade-in-0 slide-in-from-top-4 mb-8 flex animate-in flex-col gap-4 duration-300 md:flex-row">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="w-full pl-10"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  value={searchTerm}
                />
              </div>
              <Select onValueChange={setFileTypeFilter} value={fileTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="application/pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
          {/* --- END FILTER/SEARCH BAR --- */}

          {/* --- Asset grid (NOW CLEANED UP) --- */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridContent}
          </div>
          {/* --- END Asset grid --- */}

          {/* --- Modals (Unchanged) --- */}
          {selectedAsset && (
            <AssetDetailModal
              asset={selectedAsset}
              onClose={() => setSelectedAsset(null)}
            />
          )}
          {editingAsset && (
            <AssetEditModal
              asset={editingAsset}
              onClose={() => setEditingAsset(null)}
              onSave={handleUpdate}
            />
          )}
          <AlertDialog
            onOpenChange={() => setAssetToConfirmDelete(null)}
            open={!!assetToConfirmDelete}
          >
            {assetToConfirmDelete && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the asset:{" "}
                    <strong className="text-foreground">
                      {assetToConfirmDelete.title}
                    </strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deletingAssetId === assetToConfirmDelete.id}
                    onClick={async (e) => {
                      e.preventDefault();
                      await handleDelete(assetToConfirmDelete.id);
                    }}
                  >
                    {/* This single ternary is fine as it's not nested */}
                    {deletingAssetId === assetToConfirmDelete.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            )}
          </AlertDialog>
        </div>
      </Collapsible>
    </>
  );
}
