// actions/chatActions.ts
"use server";

import { ObjectId } from "mongodb";
import { clientPromise } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Define supported models mapping client IDs to actual API names
export interface ChatMessage {
    role: "user" | "model";
    content: string;
    fileName?: string; 
}

// Define the structure of a message (as stored in DB)
interface Message {
    role: "user" | "model";
    content: string;
    createdAt: Date;
    fileMetadata?: { name: string; mimeType: string }; 
}

// ----> OLD Chat Document Structure (from prior context, not used for new history) <----
interface LegacyChatDocument {
    _id: ObjectId;
    userId: string;
    agentId: string; 
    title: string;
    createdAt: Date;
    messages: Message[]; 
}

// Define the return type of the action
export interface ChatResponse {
    success: boolean;
    chatId?: string; 
    aiMessage?: ChatMessage;
    error?: string;
}

export interface ChatListItem {
    id: string; 
    title: string;
}

export interface LatestChatData {
    chatId: string;
    agentId: string;
}

// =========================================================================
// === NEW USER-CENTRIC CHAT HISTORY MODEL TYPES ===========================
// =========================================================================

// Map where key is agentId (string) and value is an array of Messages
interface AgentHistoryMap {
    [agentId: string]: Message[];
}

// New Document Structure: Stores all history for one user
interface UserHistoryDocument {
    _id?: ObjectId;
    userId: string; // Indexed for fast lookup
    history: AgentHistoryMap;
}

interface SaveChatPayload {
    agentId: string;
    userMessage: Omit<Message, 'createdAt'>;
    aiMessage: Omit<Message, 'createdAt'>;
}

/**
 * Stores chat messages into a single document per user, nested by agentId.
 * Uses MongoDB upsert with $push to append to the specific agent's history array.
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
        const db = client.db(process.env.MONGODB_DB_NAME!);
        const userHistoryCollection = db.collection<UserHistoryDocument>("user_chats"); 

        // 1. Create the path for the specific agent's message array using dot notation
        const historyPath = `history.${agentId}`;

        // 2. Perform the update/upsert
        const updateResult = await userHistoryCollection.updateOne(
            // Filter: Find the document belonging to the current user
            { userId: userId },
            // Update: Append both user and AI messages to the specific agent's history array
            {
                $push: {
                    [historyPath]: {
                        $each: [userMsgWithTime, aiMsgWithTime]
                    }
                } as any, 
                // CRITICAL FIX: Only set userId on insert. 
                // The implicit creation of the 'history' object by $push is now allowed.
                $setOnInsert: {
                    userId: userId,
                    // REMOVED: history: {} <-- This caused the conflict!
                }
            },
            // Options: Create the document if it doesn't exist
            { upsert: true }
        );

        if (updateResult.acknowledged) {
            return { success: true };
        }
        
        return { success: false, error: "Failed to acknowledge database update." };

    } catch (error) {
        console.error("Failed to save user chat history:", error);
        return { success: false, error: "Database error occurred during chat save." };
    }
}


/**
 * Retrieves the complete chat history for a specific agent for the authenticated user.
 * This uses the new single-document per user history structure.
 */
export async function getAgentChatHistoryAction(
    agentId: string
): Promise<ChatMessage[]> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user) return [];

    const userId = session.user.id;

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME!);
        const userHistoryCollection = db.collection<UserHistoryDocument>("user_chats");

        // 1. Find the user's history document
        // 2. Use projection to only retrieve the messages for the specific agent
        const projection: any = { _id: 0 };
        projection[`history.${agentId}`] = 1;

        const userHistoryDoc = await userHistoryCollection.findOne(
            { userId: userId },
            { projection: projection }
        );

        // Check if the document exists and contains history for the agent
        const messages: Message[] = userHistoryDoc?.history?.[agentId] || [];

        // Map the stored Message structure to the public ChatMessage structure
        return messages.map((msg: Message) => ({
            role: msg.role,
            content: msg.content,
            // Map fileMetadata.name to fileName
            createdAt: msg.createdAt,
            fileName: msg.fileMetadata?.name,
        }));

    } catch (error) {
        console.error(`Failed to fetch chat history for agent ${agentId}:`, error);
        return [];
    }
}

/**
 * Deletes the entire chat history for a specific agent for the authenticated user.
 * This removes the agent's array from the user's single history document using $unset.
 */
export async function deleteAgentChatHistoryAction(
    agentId: string
): Promise<{ success: boolean, error?: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return { success: false, error: "Authentication required." };
    }
    
    const userId = session.user.id;

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME!);
        const userHistoryCollection = db.collection<UserHistoryDocument>("user_chats"); 

        // 1. Create the path to the specific agent's history field
        const historyPath = `history.${agentId}`;

        // 2. Use $unset to remove the entire field (the agent's history array)
        const updateResult = await userHistoryCollection.updateOne(
            // Filter: Find the document belonging to the current user
            { userId: userId },
            // Update: Remove the specific history sub-field
            {
                $unset: {
                    [historyPath]: "" // Value can be anything, typically an empty string
                }
            }
        );

        if (updateResult.acknowledged && updateResult.modifiedCount > 0) {
            return { success: true };
        }
        
        // If modifiedCount is 0, it means the user or the agent history didn't exist, which is still technically a success (the history is gone).
        return { success: true };

    } catch (error) {
        console.error(`Failed to delete chat history for agent ${agentId}:`, error);
        return { success: false, error: "Database error occurred during chat deletion." };
    }
}


// --- LEGACY FUNCTIONS (kept for context/compatibility) ---

// This function likely refers to the old schema where each chat was a separate document.
export async function getChatHistoryAction(
    chatId: string
): Promise<ChatMessage[]> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user) return [];

    try {
        // 🛑 FIX 1: Validate chatId format before attempting ObjectId construction
        if (!ObjectId.isValid(chatId)) {
            console.warn(`Invalid Chat ID format received: ${chatId}`);
            return []; // Return empty array silently to prevent server crash
        }
        
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME!);
        // Ensure you use the typed collection if available (as shown in your prior context)
        const chatsCollection = db.collection<LegacyChatDocument>("chats"); 

        const chat = await chatsCollection.findOne({
            _id: new ObjectId(chatId),
            userId: session.user.id,
        });

        // If chat is null or messages array is empty/missing, return empty array
        if (!chat || !chat.messages) {
            return [];
        }

        // 🛑 FIX 2: Include safe mapping for file metadata based on previous context
        return chat.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            // Safely map fileName if fileMetadata exists
            fileName: msg.fileMetadata?.name,
        }));
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Failed to fetch chat history:", error);
        // Return an empty array on error so the client component displays the welcome screen
        return [];
    }
}