"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { clientPromise } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function updateUserGeminiApiKeyAction(geminiApiKey: string) {
    // --- 1. Get Session ---
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return {
            success: false,
            message: "Authentication required.",
        };
    }

    console.log("Session and gemini key:  ", session.user, geminiApiKey);

    // --- 2. Validate Data ---
    if (
        !geminiApiKey ||
        typeof geminiApiKey !== "string" ||
        geminiApiKey.trim().length < 10
    ) {
        return {
            success: false,
            message: "Invalid API key. The key seems too short or is empty.",
        };
    }

    // --- 3. Execute Update ---
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection("user");

        const userId = new ObjectId(session.user.id);

        console.log("logging userid for mongo: ", userId);

        // --- FIX ---
        // Change this back to `findOneAndUpdate` and uncomment the arguments
        const updateResult = await collection.findOneAndUpdate(
            { _id: userId }, // 1. Filter
            { $set: { geminiApiKey: geminiApiKey.trim() } }, // 2. Update document
            { returnDocument: "after" } // 3. Options
        );

        // Your error checking logic is correct for `findOneAndUpdate`
        if (!updateResult) {
            console.error(
                "Failed to update API key: Document not found or update failed."
            );
            return {
                success: false,
                message: "Failed to update API key. User not found.",
            };
        }

        // --- 4. Revalidate and Return Success ---
        revalidatePath("/profile");
        revalidatePath("/settings");

        return {
            success: true,
            message: "Gemini API key updated successfully.",
            data: updateResult.value, // Optionally return the updated user
        };
    } catch (error) {
        console.error("Failed to update Gemini API key:", error);
        return {
            success: false,
            message: "A server error occurred during update.",
        };
    }
}

export async function decrementMessagesLeftAction() {
    // --- 1. Get Session ---
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return {
            success: false,
            message: "Authentication required.",
        };
    }

    // --- 2. No Data Validation Needed ---
    // We are not receiving any data from the client, so no validation here.

    // --- 3. Execute Atomic Update ---
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection("user");

        const userId = new ObjectId(session.user.id);

        console.log(`Attempting to decrement message count for user ${userId}`);

        // --- KEY CHANGES ---
        // We find the user AND check if they have messages > 0
        // If they do, we atomically decrement the count by 1.
        const updateResult = await collection.findOneAndUpdate(
            {
                _id: userId,
                messagesLeft: { $gt: 0 }, // Filter: Find user ONLY IF messages are greater than 0
            },
            { $inc: { messagesLeft: -1 } }, // Update: Use $inc to decrement by 1
            { returnDocument: "after" } // Options: Return the *new* document
        );

        // --- 4. Handle Results ---
        // If `updateResult` is null, it means the filter did not match.
        // This happens if the user ID is wrong OR if `messagesLeft` was 0.
        if (!updateResult) {
            console.warn(
                `User ${userId} has no messages left or was not found.`
            );
            return {
                success: false,
                message: "You are out of messages.",
            };
        }

        // --- 5. Revalidate and Return Success ---
        revalidatePath("/profile"); // Revalidate any page that shows the message count

        return {
            success: true,
            message: "Message count decremented.",
            data: updateResult.value, // Return the updated user data
        };
    } catch (error) {
        console.error("Failed to decrement message count:", error);
        return {
            success: false,
            message: "A server error occurred while updating message count.",
        };
    }
}

export async function getUserGeminiApiKeyAction() {
    // --- 1. Get Session ---
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return {
            success: false,
            message: "Authentication required.",
            apiKey: null,
        };
    }

    // --- 2. Execute Database Find ---
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection("user");

        const userId = new ObjectId(session.user.id);

        // Find the user, but only return the 'geminiApiKey' field for efficiency
        const user = await collection.findOne(
            { _id: userId },
            { projection: { geminiApiKey: 1 } }
        );

        if (!user) {
            return { 
                success: false, 
                message: "User not found.", 
                apiKey: null 
            };
        }

        // --- 3. Return Success ---
        // Return the key, or null if it's not set
        return {
            success: true,
            apiKey: user.geminiApiKey || null,
        };

    } catch (error) {
        console.error("Failed to get Gemini API key:", error);
        return {
            success: false,
            message: "A server error occurred.",
            apiKey: null,
        };
    }
}
