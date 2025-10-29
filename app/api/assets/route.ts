import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import Asset from "@/models/Asset";

export async function GET() {
  await client.connect();
  const assets = await Asset.find({}).sort({ createdAt: -1 });
  return NextResponse.json(assets);
}