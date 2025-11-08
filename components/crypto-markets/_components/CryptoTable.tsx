"use client";

import { TrendingUp, TrendingDown, AlertCircle, Loader2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CryptoAsset } from "@/type/types";

interface CryptoTableProps {
  assets: CryptoAsset[];
  isLoading: boolean;
  error: string | null;
  itemsPerPage: number; 
  currentPage: number;
  timeRange: string;
}

// (Helper functions formatMarketCap and renderSparkline are unchanged)
function formatMarketCap(num: number): string {
  if (num >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(2) + "T";
  }
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  return num.toLocaleString();
}

function renderSparkline(data: number[] | null) {
  if (!data || data.length < 2) return null;
  const width = 100, height = 32, strokeWidth = 2;
  const min = Math.min(...data), max = Math.max(...data), range = max - min;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height + strokeWidth / 2;
    return `${x},${y}`;
  }).join(" ");
  const isPositive = data[data.length - 1] >= data[0];
  // --- MODIFICATION: Sparkline colors for light/dark ---
  // Using Tailwind CSS classes for colors won't work in SVG `stroke`.
  // We can't use 'dark:' here, so we'll just use the same vibrant colors.
  const strokeColor = isPositive ? "#22c55e" : "#ef4444"; 
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-8" preserveAspectRatio="none">
      <polyline fill="none" stroke={strokeColor} strokeWidth={strokeWidth} points={points} />
    </svg>
  );
}
// --- END Helper Functions ---


export function CryptoTable({ assets, isLoading, error, itemsPerPage, currentPage, timeRange }: CryptoTableProps) {
  
  const getChangeData = (asset: CryptoAsset) => {
    switch (timeRange) {
      case "7D":
        return { change: asset.change_7d, label: "Change (7D)" };
      case "30D":
        return { change: asset.change_30d, label: "Change (30D)" };
      case "1D":
      default:
        return { change: asset.change_1d, label: "Change (24h)" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading cryptocurrency data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-8 text-red-600 dark:text-red-500">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p>Error loading data: {error}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Please try again later.</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
        <Search className="h-8 w-8 mb-4" />
        <p className="text-lg font-semibold">No crypto assets found.</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-transparent overflow-x-auto">
      <Table className="text-zinc-900 dark:text-zinc-100 min-w-[1200px]">
        <TableHeader>
          {/* Note: shadcn TableRow doesn't apply border classes here, it's on the head/cell */}
          <TableRow className="border-zinc-200 dark:border-zinc-800">
            <TableHead className="text-zinc-600 dark:text-zinc-300 w-[60px]">S.No.</TableHead>
            <TableHead className="text-zinc-600 dark:text-zinc-300 w-[300px]">Name</TableHead>
            <TableHead className="text-zinc-600 dark:text-zinc-300">Price</TableHead>
            <TableHead className="text-zinc-600 dark:text-zinc-300">
              {getChangeData(assets[0]).label}
            </TableHead>
            <TableHead className="text-zinc-600 dark:text-zinc-300">24h Volume</TableHead>
            <TableHead className="text-zinc-600 dark:text-zinc-300">Market Cap</TableHead>
            <TableHead className="text-zinc-600 dark:text-zinc-300">Circulating Supply</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset, index) => {
            const { change } = getChangeData(asset);
            const isPositive = change ? change >= 0 : false;
            
            return (
              <TableRow 
                key={asset.id} 
                className="hover:bg-zinc-50/70 border-zinc-200 dark:hover:bg-zinc-700/70 dark:border-zinc-800"
              >
                
                <TableCell className="font-medium text-zinc-600 dark:text-zinc-300">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </TableCell>
                
                <TableCell className="flex items-center gap-3 py-4">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={asset.iconUrl} alt={asset.name} />
                    <AvatarFallback className="bg-zinc-200 text-zinc-700 text-xs dark:bg-zinc-600 dark:text-white">
                      {asset.symbol.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900 dark:text-white">{asset.name}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">{asset.symbol}</span>
                  </div>
                  <div className="grow flex justify-end">
                    {renderSparkline(asset.sparkline)}
                  </div>
                </TableCell>
                
                <TableCell className="font-medium text-zinc-900 dark:text-white">
                  ${asset.price.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </TableCell>

                <TableCell className={isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  <div className="flex items-center">
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {change?.toFixed(2) ?? 'N/A'}%
                  </div>
                </TableCell>

                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  ${formatMarketCap(asset.volume24h)}
                </TableCell>
                
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  ${formatMarketCap(asset.marketCap)}
                </TableCell>
                
                <TableCell className="text-zinc-600 dark:text-zinc-300">
                  {asset.circulatingSupply.toLocaleString()} {asset.symbol}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}