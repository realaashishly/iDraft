// actions/assetActions.ts
"use server";

import { clientPromise } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { type Asset } from "@/lib/types";
import { ObjectId } from "mongodb";

interface AssetData {
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
}

interface UpdateAssetPayload {
  title: string;
  description: string;
}

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

    // --- FIX IS HERE ---
    // Convert the returned document (especially the _id) to a plain object
    const savedAsset = {
        id: insertResult.insertedId.toString(), // Convert ObjectId to string
        title: assetDocument.title,
        description: assetDocument.description,
        fileUrl: assetDocument.fileUrl,
        fileType: assetDocument.fileType,
        fileSize: assetDocument.fileSize,
        createdAt: assetDocument.createdAt,
    }
    // --- END FIX ---

    revalidatePath("/assets"); // Adjust path if needed

    // Return the plain object, not the raw MongoDB document
    return { success: true, data: savedAsset }; 

  } catch (error) {
    console.error("Failed to create asset:", error);
    return { success: false, error: "Failed to save to database." };
  }
}

export async function getAssets(): Promise<Asset[]> {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection("assets");

        // Fetch all documents, sort by creation date descending
        const assetsFromDb = await collection.find({})
            .sort({ createdAt: -1 }) // Sort newest first
            .toArray();

        // Map the MongoDB documents to your Asset type, ensuring serializability
        const assets: Asset[] = assetsFromDb.map((doc) => ({
            id: doc._id.toString(), // Convert ObjectId to string
            title: doc.title,
            description: doc.description,
            fileUrl: doc.fileUrl,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            // Ensure createdAt is a Date object (it should be, but belt-and-suspenders)
            createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
        }));

        return assets;
    } catch (error) {
        console.error("Failed to fetch assets:", error);
        return []; // Return empty array on error
    }
}


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
        updatedAt: new Date(), // Optional: track updates
      },
    };

    // Find the document and update it, returning the *new* document
    const findOneAndUpdateResult = await collection.findOneAndUpdate(
      { _id: objectId },
      updateDocument,
      { returnDocument: "after" } // Returns the document *after* the update
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

    revalidatePath("/assets"); // Revalidate the path to show new data
    return { success: true, data: savedAsset };
  } catch (error) {
    console.error("Failed to update asset:", error);
    return { success: false, error: "Failed to update asset." };
  }
}

// --- NEW FUNCTION: deleteAsset ---
/**
 * Deletes an asset from the database.
 * @param assetId The string ID of the asset to delete.
 */
export async function deleteAsset(assetId: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("assets");

    // Convert the string ID back to a MongoDB ObjectId
    const objectId = new ObjectId(assetId);

    const deleteResult = await collection.deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return { success: false, error: "Asset not found." };
    }

    revalidatePath("/assets"); // Revalidate the path to update the list
    return { success: true };
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return { success: false, error: "Failed to delete asset." };
  }
}