"use server";

import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clientPromise } from "@/lib/db";
import type {
  ChatMessage,
  HistoryMessage,
  LegacyChatDocument,
  Message,
  SaveChatPayload,
  UserHistoryDocument,
} from "@/type/types";

const dbName = process.env.MONGODB_DB_NAME;

/**
 * Saves a user and AI message pair to the consolidated user chat history.
 * This action uses an upsert to create a single document per user if one doesn't exist,
 * or appends messages to the appropriate agent's history array if it does.
 *
 * @param payload The chat data to save, including agent ID and messages.
 * @returns A promise resolving to an object with success status.
 */
export async function saveUserChatHistoryAction(
  payload: SaveChatPayload
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;
  const { agentId, userMessage, aiMessage } = payload;
  const now = new Date();

  // Prepare full message objects with timestamps
  const userMsgWithTime: Message = { ...userMessage, createdAt: now };
  const aiMsgWithTime: Message = { ...aiMessage, createdAt: now };

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const userHistoryCollection =
      db.collection<UserHistoryDocument>("user_chats");

    // Use dot notation to target the specific agent's history array
    const historyPath = `history.${agentId}`;

    const updateResult = await userHistoryCollection.updateOne(
      { userId },
      {
        // Append both messages to the specific agent's history array
        $push: {
          [historyPath]: {
            $each: [userMsgWithTime, aiMsgWithTime],
          },
        },
        // On first-time insert, set the userId
        $setOnInsert: {
          userId,
        },
      },
      // Create the document if it doesn't exist
      { upsert: true }
    );

    if (updateResult.acknowledged) {
      return { success: true };
    }

    return {
      success: false,
      error: "Failed to acknowledge database update.",
    };
  } catch {
    return {
      success: false,
      error: "Database error occurred during chat save.",
    };
  }
}

/**
 * Retrieves the complete chat history for a specific agent for the authenticated user.
 * This uses the new single-document per user history structure.
 *
 * @param agentId The ID of the agent to fetch history for.
 * @returns A promise resolving to an array of chat messages.
 */
export async function getAgentChatHistoryAction(
  agentId: string
): Promise<HistoryMessage[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return [];
  }

  const userId = session.user.id;

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const userHistoryCollection =
      db.collection<UserHistoryDocument>("user_chats");

    // Project only the requested agent's history and exclude the _id
    const projection: Record<string, 0 | 1> = { _id: 0 };
    projection[`history.${agentId}`] = 1;

    const userHistoryDoc = await userHistoryCollection.findOne(
      { userId },
      { projection }
    );

    // Find the messages or default to an empty array
    const messages: Message[] = userHistoryDoc?.history?.[agentId] || [];

    // Map the stored Message structure to the public ChatMessage structure
    return messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      // Adapt stored 'fileMetadata.name' to public 'fileName'
      fileName: msg.fileMetadata?.name,
    }));
  } catch {
    return [];
  }
}

/**
 * Deletes the entire chat history for a specific agent for the authenticated user.
 * This removes the agent's array from the user's single history document using $unset.
 *
 * @param agentId The ID of the agent whose history will be deleted.
 * @returns A promise resolving to an object with success status.
 */
export async function deleteAgentChatHistoryAction(
  agentId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const userHistoryCollection =
      db.collection<UserHistoryDocument>("user_chats");

    // Path to the specific agent's history field
    const historyPath = `history.${agentId}`;

    const updateResult = await userHistoryCollection.updateOne(
      { userId },
      {
        // Use $unset to remove the entire field (agent's history array)
        $unset: {
          [historyPath]: "",
        },
      }
    );

    // Acknowledged means the operation was attempted.
    // If modifiedCount is 0, the history may have already been gone, which is still a success.
    if (updateResult.acknowledged) {
      return { success: true };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Database error occurred during chat deletion.",
    };
  }
}

// --- LEGACY FUNCTIONS ---

/**
 * **LEGACY:** Retrieves chat history from the old (per-chat document) schema.
 * Kept for compatibility or data migration purposes.
 *
 * @param chatId The _id of the legacy 'chats' document.
 * @returns A promise resolving to an array of chat messages.
 */
export async function getChatHistoryAction(
  chatId: string
): Promise<ChatMessage[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return [];
  }

  try {
    // Prevent server crash if an invalid ID format is passed
    if (!ObjectId.isValid(chatId)) {
      return [];
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const chatsCollection = db.collection<LegacyChatDocument>("chats");

    const chat = await chatsCollection.findOne({
      _id: new ObjectId(chatId),
      userId: session.user.id,
    });

    if (!chat?.messages) {
      return [];
    }

    return chat.messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
      // Map fileMetadata if it exists
      fileName: msg.fileMetadata?.name,
    }));
  } catch {
    return [];
  }
}
