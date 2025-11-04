import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/db";
import Asset from "@/models/Asset";

export async function GET() {
  try {
    await clientPromise;

    const assets = await Asset.find({}).sort({ createdAt: -1 });

    return NextResponse.json(assets, { status: 200 });
  } catch (error) {

    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { message: "Failed to load assets.", error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}