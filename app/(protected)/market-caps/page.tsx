"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Sparkles, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CryptoAsset } from "@/type/types";
import { CryptoTable } from "@/components/crypto-markets/_components/CryptoTable";


export default function CryptoMarketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("1D");
  // const [assetType, setAssetType] = useState("All assets"); // This was removed in your provided code
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [allCryptoData, setAllCryptoData] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crypto-markets");
      if (!response.ok) {
        throw new Error("Failed to fetch data from server");
      }
      const data: any[] = await response.json();

      const formattedData: CryptoAsset[] = data.map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        circulatingSupply: coin.circulating_supply,
        iconUrl: coin.image,
        sparkline: coin.sparkline_in_7d.price,
        change_1d: coin.price_change_percentage_24h_in_currency,
        change_7d: coin.price_change_percentage_7d_in_currency,
        change_30d: coin.price_change_percentage_30d_in_currency,
      }));
      
      setAllCryptoData(formattedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // --- Filtering Logic (Search) ---
  const filteredAssets = useMemo(() => {
    let filtered = allCryptoData;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          asset.symbol.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtered;
  }, [allCryptoData, searchTerm]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAssets.slice(startIndex, endIndex);
  }, [filteredAssets, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Crypto markets</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Today's Cryptocurrency Prices by Market Capitalization</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchAssets()}
              disabled={isLoading}
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" /> 
              )}
              <span className="sr-only">Refresh Data</span>
            </Button>

            <CollapsibleTrigger asChild>
              <Button variant="outline" size="icon" className="text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle Filters</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </header>

        <CollapsibleContent>
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <label htmlFor="search-tokens" className="sr-only">Search tokens name...</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-900 dark:text-zinc-400" />
                <Input
                  id="search-tokens"
                  placeholder="Search tokens name..."
                  className="pl-10 bg-white border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:ring-orange-500 focus:border-orange-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); 
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px] bg-white border-zinc-300 text-zinc-900 focus:ring-orange-500 focus:border-orange-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                  <SelectItem value="1D">1D (24h)</SelectItem>
                  <SelectItem value="7D">7D</SelectItem>
                  <SelectItem value="30D">30D</SelectItem>
                </SelectContent>
              </Select>
              
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-6">
        <CryptoTable
          assets={paginatedAssets}
          isLoading={isLoading}
          error={error}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          timeRange={timeRange}
        />
      </div>

      {/* Pagination Controls */}
      {!isLoading && !error && filteredAssets.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Select value={String(itemsPerPage)} onValueChange={(val) => {
            setItemsPerPage(Number(val));
            setCurrentPage(1); 
          }}>
            <SelectTrigger className="w-[180px] bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
              <SelectItem value="10">Shows 10 per page</SelectItem>
              <SelectItem value="20">Shows 20 per page</SelectItem>
              <SelectItem value="50">Shows 50 per page</SelectItem>
            </SelectContent>
          </Select>

          <nav className="flex items-center gap-1 my-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className=" hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              className="text-zinc-700 border-zinc-300 bg-white cursor-default dark:text-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
            >
              Page {currentPage} of {totalPages}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}