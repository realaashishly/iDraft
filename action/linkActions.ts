"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { clientPromise } from "@/lib/db";
// We'll define the types for our new "Link" resource
// based on the metadata your component fetches.

// --- Type Definitions ---

/**
 * The data structure for a Link as it is returned to the client.
 * All properties are serializable (strings).
 */
export type Link = {
  id: string;
  url: string;
  title: string;
  description: string | null; // Can be null if metadata is missing
  imageUrl: string | null; // Can be null
  createdAt: string;
};

/**
 * The payload required to create a new link.
 * This is what your client component will send after fetching metadata.
 */
export type CreateLinkPayload = {
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

/**
 * The payload for updating an existing link.
 * All fields are optional.
 */
export type UpdateLinkPayload = Partial<CreateLinkPayload>;

/**
 * The internal structure of the document in the MongoDB "links" collection.
 */
interface LinkDocument extends CreateLinkPayload {
  _id?: ObjectId;
  createdAt: Date;
}

const dbName = process.env.MONGODB_DB_NAME;
const collectionName = "links"; // We'll use a new collection named "links"

// --- Action to CREATE a new link ---
export async function createLinkAction(
  payload: CreateLinkPayload
): Promise<{ success: true; data: Link } | { success: false; error: string }> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const linksCollection = db.collection<LinkDocument>(collectionName);

    // Optional: Check if a link with this URL already exists
    const existingLink = await linksCollection.findOne({ url: payload.url });
    if (existingLink) {
      return { success: false, error: "This link has already been saved." };
    }

    const newLinkDocument: Omit<LinkDocument, "_id"> = {
      ...payload,
      createdAt: new Date(),
    };

    const insertResult = await linksCollection.insertOne(newLinkDocument);

    if (!insertResult.insertedId) {
      throw new Error("Failed to insert link into database.");
    }

    revalidatePath("/"); // Revalidate the root path, just like your example

    // Transform the document into the client-safe Link type
    const createdLink: Link = {
      id: insertResult.insertedId.toString(),
      url: newLinkDocument.url,
      title: newLinkDocument.title,
      description: newLinkDocument.description,
      imageUrl: newLinkDocument.imageUrl,
      createdAt: newLinkDocument.createdAt.toISOString(),
    };

    return { success: true, data: createdLink };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- Action to GET all links ---
export async function getLinksAction(): Promise<
  { success: true; data: Link[] } | { success: false; error: string }
> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const linksCollection = db.collection<LinkDocument>(collectionName);

    const linkDocs = await linksCollection
      .find({})
      .sort({ createdAt: -1 }) // Show newest first
      .toArray();

    // Map the database documents to the client-safe Link type
    const links: Link[] = linkDocs.map((doc) => ({
      id: doc._id!.toString(), // Using ! as _id is guaranteed from a find operation
      url: doc.url,
      title: doc.title,
      description: doc.description,
      imageUrl: doc.imageUrl,
      createdAt: doc.createdAt.toISOString(),
    }));

    return { success: true, data: links };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- Action to UPDATE an existing link ---
export async function updateLinkAction(
  id: string,
  payload: UpdateLinkPayload
): Promise<{ success: true; data: Link } | { success: false; error: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: "Invalid link ID format." };
    }

    if (Object.keys(payload).length === 0) {
      return { success: false, error: "No update fields provided." };
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const linksCollection = db.collection<LinkDocument>(collectionName);

    const objectId = new ObjectId(id);

    const updateDocument = {
      $set: payload,
    };

    // Find the document, update it, and return the *new* version
    const result = await linksCollection.findOneAndUpdate(
      { _id: objectId },
      updateDocument,
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      return { success: false, error: "Link not found or failed to update." };
    }

    revalidatePath("/"); // Revalidate the root path

    // Transform the updated document into the client-safe Link type
    const updatedLink: Link = {
      id: result._id!.toString(),
      url: result.url,
      title: result.title,
      description: result.description,
      imageUrl: result.imageUrl,
      createdAt: result.createdAt.toISOString(),
    };

    return { success: true, data: updatedLink };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- Action to DELETE a link ---
export async function deleteLinkAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!ObjectId.isValid(id)) {
      return { success: false, error: "Invalid link ID format." };
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const linksCollection = db.collection<LinkDocument>(collectionName);

    const objectId = new ObjectId(id);

    const deleteResult = await linksCollection.deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return { success: false, error: "Link not found." };
    }

    revalidatePath("/"); // Revalidate the root path

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}