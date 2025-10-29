"use client";

import { useState, useEffect, useCallback } from "react";
import { AssetCard, AssetCardSkeleton } from "@/components/Assets/AssetsCard";
import AssetUploadButton from "@/components/Assets/AssetUploadButton";
import { AssetDetailModal } from "@/components/Assets/AssetDetails";
import { Asset } from "@/lib/types";
import { getAssets } from "@/action/assetAction";
import { useSession } from "@/lib/auth-client";

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

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

    return (
        <div className='p-4'>
            <div className='flex items-center justify-between mb-8'>
                <h1 className='text-3xl font-bold'>Your Assets</h1>
                {session?.user.role === "admin" && (
                    <AssetUploadButton onUploadComplete={loadAssets} />
                )}
            </div>

            {/* Asset grid */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {isLoading ? (
                    // Show skeleton loaders while fetching
                    <>
                        <AssetCardSkeleton />
                        <AssetCardSkeleton />
                        <AssetCardSkeleton />
                        <AssetCardSkeleton />
                        <AssetCardSkeleton />
                        <AssetCardSkeleton />
                    </>
                ) : assets.length === 0 ? (
                    <p className='col-span-full text-center text-muted-foreground'>
                        No assets found. Upload your first file!
                    </p>
                ) : (
                    assets.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onClick={() => setSelectedAsset(asset)}
                        />
                    ))
                )}
            </div>

            {/* Asset detail modal (remains the same) */}
            {selectedAsset && (
                <AssetDetailModal
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                />
            )}
        </div>
    );
}
