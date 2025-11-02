import { NextResponse } from "next/server";
import Asset from "@/models/Asset";
import { clientPromise } from "@/lib/db";

export async function GET() {
  await clientPromise;
  const assets = await Asset.find({}).sort({ createdAt: -1 });
  return NextResponse.json(assets);
}