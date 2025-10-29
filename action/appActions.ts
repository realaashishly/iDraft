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