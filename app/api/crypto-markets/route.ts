import { NextResponse } from "next/server";

// This is the CoinGecko endpoint that provides all the data we need.
// It's public and doesn't require an API key for demo use.
const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets";

export async function GET() {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "100", // Get the top 100 coins
    page: "1",
    sparkline: "true", // Get sparkline data for the chart
    price_change_percentage: "24h,7d,30d",
  });

  try {
    // We fetch the data on the server to avoid CORS issues and to
    // (in the future) securely add an API key here.
    const response = await fetch(`${COINGECKO_URL}?${params.toString()}`, {
      // Revalidate data every 60 seconds
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from CoinGecko: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("API Fetch Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch cryptocurrency data." },
      { status: 500 }
    );
  }
}