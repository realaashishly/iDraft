"use client";

import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 15_000;

interface StockData {
  name: string;
  symbol: string;
  price: string;
  change: string;
  trend: LucideIcon;
  color: string;
}

interface AlphaVantageGainer {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
}

interface ApiRouteResponse {
  stocks: AlphaVantageGainer[];
}

// This function transforms the new API data structure
function transformApiResponse(stocks: AlphaVantageGainer[]): StockData[] {
  // We no longer need nameMap, as the stocks are dynamic

  return stocks.map((stock) => {
    const price = Number.parseFloat(stock.price);
    const change = Number.parseFloat(stock.change_amount);

    const isPositive = change >= 0;

    return {
      symbol: stock.ticker,
      name: stock.ticker, // Use ticker as name, since API doesn't provide full name
      price: price.toFixed(2),
      change: `${isPositive ? "+" : ""}${change.toFixed(2)}`,
      trend: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? "text-green-500" : "text-red-500",
    };
  });
}

// --- Main Component ---

function StockWidget() {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches data from OUR OWN API route (/api/stocks)
   */
  const fetchStockData = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch("/api/stocks");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch: ${response.statusText}`
        );
      }

      const data: ApiRouteResponse = await response.json();

      if (!data.stocks) {
        throw new Error(
          "API response format unexpected. 'stocks' array is missing."
        );
      }

      const formattedData = transformApiResponse(data.stocks);
      setStockData(formattedData);
    } catch (e: any) {
      console.error("Failed to fetch stock data:", e);
      setError(e.message || "Failed to load data.");
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]);

  // Effect to fetch data on mount and set up polling
  useEffect(() => {
    fetchStockData();

    const intervalId = setInterval(() => {
      fetchStockData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchStockData]);

  // --- Render Logic (Modified) ---

  if (isLoading) {
    return (
      <div className="w-full space-y-2 text-center text-muted-foreground text-sm">
        Loading top gainers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-2 text-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {stockData.map((item) => (
        <div className="flex items-center justify-between" key={item.symbol}>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted/50 font-bold text-sm">
              {/* Use first letter of symbol as icon */}
              {item.symbol.substring(0, 1)}
            </div>
            <div className="flex flex-col">
              {/* Both name and symbol are the ticker */}
              <span className="font-medium text-xs">{item.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {item.symbol}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-medium text-xs">{item.price}</span>
            <div
              className={`flex items-center font-medium text-xs ${item.color}`}
            >
              <item.trend className="mr-0.5" size={10} />
              {item.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StockWidget;
