"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { clientPromise } from "@/lib/db";
import type { App, CreateAppPayload, UpdateAppPayload } from "@/type/types";

interface AppDocument extends CreateAppPayload {
  _id?: ObjectId;
  createdAt: Date;
}

const dbName = process.env.MONGODB_DB_NAME;

// --- Action to CREATE a new app ---
export async function createAppAction(
  payload: CreateAppPayload
): Promise<{ success: true; data: App } | { success: false; error: string }> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const appsCollection = db.collection<AppDocument>("apps");

    const newAppDocument: Omit<AppDocument, "_id"> = {
      ...payload,
      createdAt: new Date(),
    };

    const insertResult = await appsCollection.insertOne(newAppDocument);

    if (!insertResult.insertedId) {
      throw new Error("Failed to insert app into database.");
    }

    revalidatePath("/");

    const createdApp: App = {
      id: insertResult.insertedId.toString(),
      appName: newAppDocument.appName,
      appDescription: newAppDocument.appDescription,
      appLink: newAppDocument.appLink,
      logoUrl: newAppDocument.logoUrl,
      createdAt: newAppDocument.createdAt.toISOString(),
    };

    return { success: true, data: createdApp };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- Action to GET all apps ---
export async function getAppsAction(): Promise<
  { success: true; data: App[] } | { success: false; error: string }
> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const appsCollection = db.collection<AppDocument>("apps");

    const appsDocs = await appsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const apps: App[] = appsDocs.map((doc) => ({
      id: doc._id?.toString(),
      appName: doc.appName,
      appDescription: doc.appDescription,
      appLink: doc.appLink,
      logoUrl: doc.logoUrl,
      createdAt: doc.createdAt.toISOString(),
    }));

    return { success: true, data: apps };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- NEW: Action to UPDATE an existing app ---
export async function updateAppAction(
  id: string,
  payload: UpdateAppPayload
): Promise<{ success: true; data: App } | { success: false; error: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: "Invalid app ID format." };
    }

    if (Object.keys(payload).length === 0) {
      return { success: false, error: "No update fields provided." };
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const appsCollection = db.collection<AppDocument>("apps");

    const objectId = new ObjectId(id);

    const updateDocument = {
      $set: payload,
    };

    const result = await appsCollection.findOneAndUpdate(
      { _id: objectId },
      updateDocument,
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      return { success: false, error: "App not found or failed to update." };
    }

    revalidatePath("/");

    const updatedApp: App = {
      id: result._id?.toString(),
      appName: result.appName,
      appDescription: result.appDescription,
      appLink: result.appLink,
      logoUrl: result.logoUrl,
      createdAt: result.createdAt.toISOString(),
    };

    return { success: true, data: updatedApp };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- NEW: Action to DELETE an app ---
export async function deleteAppAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: "Invalid app ID format." };
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const appsCollection = db.collection<AppDocument>("apps");

    const objectId = new ObjectId(id);

    const deleteResult = await appsCollection.deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return { success: false, error: "App not found." };
    }

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}
