// app/api/stocks/route.ts

import { NextResponse } from "next/server";

const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

export async function GET() {
  if (!apiKey) {
    console.error("API key is not configured");
    return NextResponse.json(
      { error: "API key is not configured" },
      { status: 500 }
    );
  }

  // This single URL gets all top gainers
  const url = `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;

  try {
    const response = await fetch(url, {
      // Revalidate data cache every 15 minutes
      // (This is separate from the component's refresh interval)
      next: { revalidate: 900 } 
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage API failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Check for API limit or error messages
    if (data["Error Message"] || data["Information"]) {
      console.warn("API limit or error:", data["Error Message"] || data["Information"]);
      return NextResponse.json(
        { error: data["Information"] || "API rate limit reached." },
        { status: 429 } // 429 Too Many Requests
      );
    }
    
    if (!data.top_gainers) {
      throw new Error("Invalid API response: 'top_gainers' array not found.");
    }

    // 1. Get the top_gainers array
    const topGainers = data.top_gainers;

    // 2. Take the first 4 items
    const top4 = topGainers.slice(0, 4);

    // 3. Send these 4 stocks to our client
    return NextResponse.json({ stocks: top4 });

  } catch (error: any) {
    console.error("Internal Server Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch stock data." },
      { status: 500 }
    );
  }
}