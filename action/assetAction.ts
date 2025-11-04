// actions/assetActions.ts
"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { clientPromise } from "@/lib/db";
import type { Asset, AssetData, UpdateAssetPayload } from "@/type/types";

/**
 * Creates a new asset document in the database.
 * @param assetData The data for the new asset.
 * @returns An object with success status and the created asset data.
 */
export async function createAsset(assetData: AssetData) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("assets");

    const assetDocument = {
      ...assetData,
      createdAt: new Date(),
    };

    const insertResult = await collection.insertOne(assetDocument);
    const savedAsset = {
      id: insertResult.insertedId.toString(),
      title: assetDocument.title,
      description: assetDocument.description,
      fileUrl: assetDocument.fileUrl,
      fileType: assetDocument.fileType,
      fileSize: assetDocument.fileSize,
      createdAt: assetDocument.createdAt,
    };

    // Revalidate the assets page cache to show the new data
    revalidatePath("/assets");

    return { success: true, data: savedAsset };
  } catch {
    return { success: false, error: "Failed to save to database." };
  }
}

/**
 * Fetches all assets from the database, sorted by creation date.
 * @returns A promise that resolves to an array of Asset objects.
 */
export async function getAssets(): Promise<Asset[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("assets");

    const assetsFromDb = await collection
      .find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray();

    // Map MongoDB document format (_id) to application format (id)
    const assets: Asset[] = assetsFromDb.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    }));

    return assets;
  } catch {
    return [];
  }
}

/**
 * Updates an existing asset's title and description.
 * @param assetId The ID of the asset to update.
 * @param payload An object containing the new title and description.
 * @returns An object with success status and the updated asset data.
 */
export async function updateAsset(
  assetId: string,
  payload: UpdateAssetPayload
) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("assets");

    // Convert the string ID back to a MongoDB ObjectId
    const objectId = new ObjectId(assetId);

    const updateDocument = {
      $set: {
        title: payload.title,
        description: payload.description,
        updatedAt: new Date(), // Track update timestamp
      },
    };

    const findOneAndUpdateResult = await collection.findOneAndUpdate(
      { _id: objectId },
      updateDocument,
      { returnDocument: "after" } // Ensures the *updated* document is returned
    );

    if (!findOneAndUpdateResult) {
      return { success: false, error: "Asset not found." };
    }

    const updatedDoc = findOneAndUpdateResult;

    // Serialize the updated document to match the Asset type
    const savedAsset = {
      id: updatedDoc._id.toString(),
      title: updatedDoc.title,
      description: updatedDoc.description,
      fileUrl: updatedDoc.fileUrl,
      fileType: updatedDoc.fileType,
      fileSize: updatedDoc.fileSize,
      createdAt: updatedDoc.createdAt,
      updatedAt: updatedDoc.updatedAt,
    };

    // Revalidate the assets page cache
    revalidatePath("/assets");
    return { success: true, data: savedAsset };
  } catch {
    return { success: false, error: "Failed to update asset." };
  }
}

/**
 * Deletes an asset from the database.
 * @param assetId The ID of the asset to delete.
 * @returns An object with success status.
 */
export async function deleteAsset(assetId: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("assets");

    // Convert string ID to MongoDB ObjectId
    const objectId = new ObjectId(assetId);

    const deleteResult = await collection.deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return { success: false, error: "Asset not found." };
    }

    // Revalidate the assets page cache
    revalidatePath("/assets");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete asset." };
  }
}
