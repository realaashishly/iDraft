import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/db";
import Asset from "@/models/Asset";

export async function GET() {
  await clientPromise;
  const assets = await Asset.find({}).sort({ createdAt: -1 });
  return NextResponse.json(assets);
}
