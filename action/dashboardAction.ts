"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clientPromise } from "@/lib/db";
import type { DashboardState, DashboardStateDocument } from "@/type/types";

const dbName = process.env.MONGODB_DB_NAME;

/**
 * Retrieves the saved dashboard state for the currently authenticated user.
 * Returns an empty object if no state has been saved previously.
 *
 * @returns A promise resolving to an object with success status and the user's dashboard state.
 */
export async function getDashboardStateAction(): Promise<{
  success: boolean;
  data?: DashboardState | null;
  error?: string;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection<DashboardStateDocument>("dashboardState");

    const doc = await collection.findOne({ userId: session.user.id });

    if (doc) {
      return { success: true, data: doc.state };
    }
    // No state saved yet, return default empty object
    return { success: true, data: {} };
  } catch {
    return { success: false, error: "Database error." };
  }
}

/**
 * Saves or updates (upserts) the dashboard state for the currently authenticated user.
 *
 * @param payload The complete dashboard state object to save.
 * @returns A promise resolving to an object with success status.
 */
export async function saveDashboardStateAction(
  payload: DashboardState
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection<DashboardStateDocument>("dashboardState");

    const filter = { userId: session.user.id };
    const updateDocument = {
      $set: {
        state: payload,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId: session.user.id,
      },
    };

    // Use upsert: true to create the document if it doesn't exist
    await collection.updateOne(filter, updateDocument, { upsert: true });

    return { success: true };
  } catch {
    return { success: false, error: "Database error." };
  }
}
