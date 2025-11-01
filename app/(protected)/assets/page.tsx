"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AssetCard, AssetCardSkeleton } from "@/components/Assets/AssetsCard";
import AssetUploadButton from "@/components/Assets/AssetUploadButton";
import { AssetDetailModal } from "@/components/Assets/AssetDetails";
import { AssetEditModal } from "@/components/Assets/AssetEditModal";
import { Asset } from "@/lib/types";
import { getAssets, deleteAsset, updateAsset } from "@/action/assetAction";
import { useSession } from "@/lib/auth-client";
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
import { Loader2, Search, SlidersHorizontal } from "lucide-react"; // <-- UPDATED IMPORTS

// --- NEW IMPORTS ---
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
// --- END NEW IMPORTS ---


export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToConfirmDelete, setAssetToConfirmDelete] = useState<Asset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

  const { data: session } = useSession();

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAssets = await getAssets();
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchMatch =
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch =
        fileTypeFilter === "all" ||
        asset.fileType?.startsWith(fileTypeFilter);
      return searchMatch && typeMatch;
    });
  }, [assets, searchTerm, fileTypeFilter]);

  // ... (handleDelete and handleUpdate functions remain the same) ...
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
    } catch (error: any) {
      console.error("Failed to delete asset:", error);
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleUpdate = async (payload: {
    title: string;
    description: string;
  }) => {
    if (!editingAsset) throw new Error("No asset selected for editing.");

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
    } catch (error: any) {
      console.error("Failed to update asset:", error);
      throw error;
    }
  };

  return (
    <>
      {/* --- WRAP IN COLLAPSIBLE --- */}
      <Collapsible>
        <div className="p-4">
          {/* --- UPDATED HEADER --- */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Your Assets</h1>
            <div className="flex items-center gap-2"> {/* Wrapper for buttons */}
              <CollapsibleTrigger asChild>
                <Button variant='outline' size='icon'>
                  <SlidersHorizontal className='h-4 w-4' />
                </Button>
              </CollapsibleTrigger>
              {session?.user.role === "admin" && (
                <AssetUploadButton onUploadComplete={loadAssets} />
              )}
            </div>
          </div>
          {/* --- END UPDATED HEADER --- */}


          {/* --- UPDATED FILTER/SEARCH BAR (NOW COLLAPSIBLE) --- */}
          <CollapsibleContent>
            <div className="mb-8 flex flex-col gap-4 md:flex-row animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <div className="relative flex-1">
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
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


          {/* --- Asset grid (Unchanged) --- */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              <>
                <AssetCardSkeleton />
                <AssetCardSkeleton />
                <AssetCardSkeleton />
                <AssetCardSkeleton />
              </>
            ) : filteredAssets.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">
                {assets.length === 0
                  ? "No assets found. Upload your first file!"
                  : "No assets match your search or filter."}
              </p>
            ) : (
              filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                  isAdmin={session?.user.role === "admin"}
                  onEdit={() => setEditingAsset(asset)}
                  onDelete={() => setAssetToConfirmDelete(asset)}
                  isDeleting={deletingAssetId === asset.id}
                />
              ))
            )}
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
            open={!!assetToConfirmDelete}
            onOpenChange={() => setAssetToConfirmDelete(null)}
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