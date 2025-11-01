"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { clientPromise } from "@/lib/db";

// --- Data structure for creating a new app ---
interface CreateAppPayload {
  appName: string;
  appDescription?: string | null;
  appLink: string;
  logoUrl: string; // URL from file upload
}

// --- Data structure as it exists in the MongoDB ---
interface AppDocument extends CreateAppPayload {
  _id?: ObjectId;
  createdAt: Date;
}

interface UpdateAppPayload {
	appName?: string;
	appDescription?: string | null;
	appLink?: string;
	logoUrl?: string;
}

// --- Client-safe data structure (what's returned to the page) ---
export interface App {
  id: string; 
  appName: string;
  appDescription?: string | null;
  appLink: string;
  logoUrl: string;
  // --- FIX #1: The type for the client MUST be a string ---
  createdAt: string; 
}

// --- Action to CREATE a new app ---
export async function createAppAction(
  payload: CreateAppPayload
): Promise<{ success: true; data: App } | { success: false; error: string }> {
  

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME!);
    const appsCollection = db.collection<AppDocument>("apps");

    const newAppDocument: Omit<AppDocument, '_id'> = {
      ...payload,
      createdAt: new Date(),
      
    };

    const insertResult = await appsCollection.insertOne(newAppDocument);

    if (!insertResult.insertedId) {
      throw new Error("Failed to insert app into database.");
    }

    revalidatePath("/"); 

    // --- FIX #2: Manually build the plain object to return ---
    // Do not return `newAppDocument` directly.
    const createdApp: App = {
      id: insertResult.insertedId.toString(),
      appName: newAppDocument.appName,
      appDescription: newAppDocument.appDescription,
      appLink: newAppDocument.appLink,
      logoUrl: newAppDocument.logoUrl,
      createdAt: newAppDocument.createdAt.toISOString(), // Convert Date to string
    };

    return { success: true, data: createdApp };

  } catch (error) {
    console.error("Failed to create app:", error);
    const errorMessage = error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- Action to GET all apps ---
export async function getAppsAction(): Promise<
  { success: true; data: App[] } | { success: false; error: string }
> {
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME!);
    const appsCollection = db.collection<AppDocument>("apps");

    const appsDocs = await appsCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();

    // --- FIX #3: Manually convert every doc to a plain object ---
    const apps: App[] = appsDocs.map(doc => {
      return {
        id: doc._id!.toString(), // Convert ObjectId to string
        appName: doc.appName,
        appDescription: doc.appDescription,
        appLink: doc.appLink,
        logoUrl: doc.logoUrl,
        createdAt: doc.createdAt.toISOString(), // Convert Date to string
      };
    });

    return { success: true, data: apps };

  } catch (error) {
    console.error("Failed to fetch apps:", error);
    const errorMessage = error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- NEW: Action to UPDATE an existing app ---
export async function updateAppAction(
	id: string,
	payload: UpdateAppPayload
): Promise<{ success: true; data: App } | { success: false; error: string }> {
	try {
		// Validate the ID format
		if (!ObjectId.isValid(id)) {
			return { success: false, error: "Invalid app ID format." };
		}

		// Prevent updating with an empty payload
		if (Object.keys(payload).length === 0) {
			return { success: false, error: "No update fields provided." };
		}

		const client = await clientPromise;
		const db = client.db(process.env.MONGODB_DB_NAME!);
		const appsCollection = db.collection<AppDocument>("apps");

		const objectId = new ObjectId(id);

		// Use $set to update only the fields provided in the payload
		const updateDocument = {
			$set: payload,
		};

		// --- FIX #1 ---
		// 'result' will be the 'AppDocument' itself, or 'null'.
		const result = await appsCollection.findOneAndUpdate(
			{ _id: objectId },
			updateDocument,
			{
				returnDocument: "after", // This option causes the change
			}
		);

		// --- FIX #2 ---
		// Check the 'result' object directly.
		if (!result) {
			return { success: false, error: "App not found or failed to update." };
		}

		// If we are here, 'result' IS the updated document.
		revalidatePath("/");

		// --- FIX #3 ---
		// Serialize 'result' directly, not 'result.value'.
		const updatedApp: App = {
			id: result._id!.toString(),
			appName: result.appName,
			appDescription: result.appDescription,
			appLink: result.appLink,
			logoUrl: result.logoUrl,
			createdAt: result.createdAt.toISOString(),
		};

		return { success: true, data: updatedApp };
	} catch (error) {
		console.error("Failed to update app:", error);
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
		// Validate the ID format
		if (!ObjectId.isValid(id)) {
			return { success: false, error: "Invalid app ID format." };
		}

		const client = await clientPromise;
		const db = client.db(process.env.MONGODB_DB_NAME!);
		const appsCollection = db.collection<AppDocument>("apps");

		const objectId = new ObjectId(id);

		const deleteResult = await appsCollection.deleteOne({ _id: objectId });

		if (deleteResult.deletedCount === 0) {
			return { success: false, error: "App not found." };
		}

		revalidatePath("/"); // Revalidate to remove the app from the list

		return { success: true };
	} catch (error) {
		console.error("Failed to delete app:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Database error occurred.";
		return { success: false, error: errorMessage };
	}
}