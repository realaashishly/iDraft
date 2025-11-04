"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clientPromise } from "@/lib/db";
import type { UpdateUserData } from "@/type/types";

/**
 * Updates the Gemini API key for the currently authenticated user.
 * @param geminiApiKey The new API key to save.
 * @returns A promise resolving to an object with success status and a message.
 */
export async function updateUserGeminiApiKeyAction(geminiApiKey: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Authentication required.",
    };
  }

  // Basic key validation
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

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("user");

    const userId = new ObjectId(session.user.id);

    const updateResult = await collection.findOneAndUpdate(
      { _id: userId },
      { $set: { geminiApiKey: geminiApiKey.trim() } },
      { returnDocument: "after" } // Return the updated document
    );

    if (!updateResult) {
      return {
        success: false,
        message: "Failed to update API key. User not found.",
      };
    }

    revalidatePath("/profile");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Gemini API key updated successfully.",
      data: updateResult.value,
    };
  } catch {
    return {
      success: false,
      message: "A server error occurred during update.",
    };
  }
}

/**
 * Atomically decrements the `messagesLeft` count for the authenticated user.
 * This operation will fail if the user's message count is already 0.
 * @returns A promise resolving to an object with success status and the updated user data.
 */
export async function decrementMessagesLeftAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Authentication required.",
    };
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("user");

    const userId = new ObjectId(session.user.id);

    // Atomically find and update the user *only if* they have messages left
    const updateResult = await collection.findOneAndUpdate(
      {
        _id: userId,
        messagesLeft: { $gt: 0 }, // Ensure user has messages to decrement
      },
      { $inc: { messagesLeft: -1 } }, // Atomically decrement by 1
      { returnDocument: "after" } // Return the *new* document
    );

    // If updateResult is null, the filter failed (user not found or messagesLeft was 0)
    if (!updateResult) {
      return {
        success: false,
        message: "You are out of messages.",
      };
    }

    revalidatePath("/profile"); // Revalidate any page that shows the message count

    return {
      success: true,
      message: "Message count decremented.",
      data: updateResult.value,
    };
  } catch {
    return {
      success: false,
      message: "A server error occurred while updating message count.",
    };
  }
}

/**
 * Retrieves the authenticated user's saved Gemini API key.
 * @returns A promise resolving to an object with success status and the API key (or null).
 */
export async function getUserGeminiApiKeyAction() {
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

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("user");

    const userId = new ObjectId(session.user.id);

    // Find the user and project only the 'geminiApiKey' field
    const user = await collection.findOne(
      { _id: userId },
      { projection: { geminiApiKey: 1 } }
    );

    if (!user) {
      return {
        success: false,
        message: "User not found.",
        apiKey: null,
      };
    }

    return {
      success: true,
      apiKey: user.geminiApiKey || null,
    };
  } catch {
    return {
      success: false,
      message: "A server error occurred.",
      apiKey: null,
    };
  }
}

export async function clearUserGeminiApiKeyAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, message: "Authentication required." };
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("user");
    const userId = new ObjectId(session.user.id);

    // --- MongoDB Operation ---
    // Finds the user and sets the 'geminiApiKey' field to null
    const updateResult = await collection.updateOne(
      { _id: userId },
      { $set: { geminiApiKey: null } }
    );
    // -------------------------

    if (updateResult.matchedCount === 0) {
      return { success: false, message: "User not found." };
    }

    return { success: true, message: "API key cleared." };
  } catch (_error) {
    return { success: false, message: "A server error occurred." };
  }
}

/**
 * Updates the authenticated user's profile data (e.g., name, profession, image).
 * This performs a partial update, only changing the fields that are provided.
 * @param data An object containing the fields to update.
 * @returns A promise resolving to an object with success status and the updated user data.
 */
export async function updateUserProfileAction(data: UpdateUserData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Authentication required.",
    };
  }

  if (!data || Object.keys(data).length === 0) {
    return {
      success: false,
      message: "No data provided for update.",
    };
  }

  // Build a $set object only with the provided, valid fields
  const updateDoc: Partial<UpdateUserData> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.length < 2) {
      return {
        success: false,
        message: "Name must be at least 2 characters.",
      };
    }
    updateDoc.name = data.name;
  }

  if (data.profession !== undefined) {
    updateDoc.profession = data.profession;
  }

  if (data.image !== undefined) {
    if (typeof data.image !== "string" || data.image.length === 0) {
      return { success: false, message: "Invalid image URL." };
    }
    updateDoc.image = data.image;
  }

  if (Object.keys(updateDoc).length === 0) {
    return {
      success: false,
      message: "No valid data fields provided for update.",
    };
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("user");

    const userId = new ObjectId(session.user.id);

    const updateResult = await collection.findOneAndUpdate(
      { _id: userId },
      { $set: updateDoc }, // Apply partial updates
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return {
        success: false,
        message: "Failed to update profile. User not found.",
      };
    }

    revalidatePath("/profile");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Profile updated successfully.",
      data: updateResult.value,
    };
  } catch {
    return {
      success: false,
      message: "A server error occurred during profile update.",
    };
  }
}
