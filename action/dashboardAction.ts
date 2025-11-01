"use server";

import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { clientPromise } from "@/lib/db";

// 1. Define the shape of a single task
interface Task {
    id: number;
    text: string;
    isCompleted: boolean;
}

// 2. Define the shape of the dashboard state
// (This is flexible, you can add more items later)
export interface DashboardState {
    todos?: Task[];
    // You could add: widgetLayout?: { ... }
    // You could add: activity?: { ... }
}

// 3. Define the document structure in MongoDB
interface DashboardStateDocument {
    _id?: ObjectId;
    userId: string;
    state: DashboardState;
    updatedAt: Date;
}

/**
 * Retrieves the saved dashboard state for the currently authenticated user.
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
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection<DashboardStateDocument>("dashboardState");

        const doc = await collection.findOne({ userId: session.user.id });

        if (doc) {
            return { success: true, data: doc.state };
        } else {
            // No state saved yet, return empty object
            return { success: true, data: {} };
        }
    } catch (error) {
        console.error("Failed to get dashboard state:", error);
        return { success: false, error: "Database error." };
    }
}

/**
 * Saves (or updates) the dashboard state for the currently authenticated user.
 * This performs an "upsert" operation.
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

        await collection.updateOne(filter, updateDocument, { upsert: true });

        return { success: true };
    } catch (error) {
        console.error("Failed to save dashboard state:", error);
        return { success: false, error: "Database error." };
    }
}