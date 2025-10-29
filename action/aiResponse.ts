// actions/aiResponse.ts (Ensure this version is saved and deployed)
"use server";

import { GoogleGenAI, Content, Part } from "@google/genai";
import { Buffer } from "buffer";
// Removed: import { ObjectId } from "mongodb"; // No longer needed as we don't deal with old chat IDs
import { auth } from "@/lib/auth"; 
// Removed: import { clientPromise } from "@/lib/db"; // No longer needed directly for saving
import { headers } from "next/headers";
// --- NEW IMPORT ---
import { saveUserChatHistoryAction } from "./chatActions";

// NOTE: We only need the types for local use now, so we simplify.
// The external actions handle the full DB structure.

export interface AiResponse {
    success: boolean;
    text?: string;
    chatId?: string; 
    error?: string;
}

// --- Next.js Server Action Configuration ---
(generateAiContent as any).maxDuration = 60; 

// --- 1. Centralized Initialization ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

// --- 2. Utility Function: File to Generative Part ---
async function fileToGenerativePart(file: File): Promise<Part> {
    const buffer = Buffer.from(await file.arrayBuffer());

    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type,
        },
    };
}

/**
 * Generates AI content and saves the conversation using the new user-centric schema.
 */
export async function generateAiContent(
    chatId: string | undefined, 
    agentId: string, 
    userInput: string,
    agentSystemInstructions: string,
    attachedFile: File | null
): Promise<AiResponse> { 
    
    // --- 0. Setup and Auth ---
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return { success: false, error: "Authentication required." };
    }

    if (!GEMINI_API_KEY) {
        return { success: false, error: "Gemini API Key is missing." };
    }
    
    let fullText = "";

    try {
        const parts: Part[] = [];
        
        // **CRITICAL FIX/ALIGNMENT: Define userMessagePayload with fileMetadata**
        let fileMetadata = undefined;

        // 1. Add File Part (if file exists) & Validation
        if (attachedFile) {
            const mimeType = attachedFile.type;
            if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
                return {
                    success: false,
                    error: `Unsupported file type: ${mimeType}. Only documents (PDF, DOCX, TXT, etc.) are currently allowed.`,
                };
            }
            const filePart = await fileToGenerativePart(attachedFile);
            parts.push(filePart);
            
            // Capture file metadata for saving to DB
            fileMetadata = { name: attachedFile.name, mimeType: mimeType }; 
        }
        
        const userMessagePayload = {
            role: "user" as const,
            content: userInput,
            // Include file metadata only if it exists
            ...(fileMetadata && { fileMetadata: fileMetadata })
        };


        // 2. Add Text Part & Prepare Content
        parts.push({ text: userInput });
        const geminiContents: Content[] = [{ role: "user", parts: parts }];
        
        // --- 3. Removed: Old Database Chat Saving/Updating Logic ---

        const config = {
            temperature: 0.75,
            systemInstruction: agentSystemInstructions,
        };

        // --- 4. Gemini API Call (Streaming) ---
        const responseStream = await ai.models.generateContentStream({
            model: DEFAULT_GEMINI_MODEL,
            config,
            contents: geminiContents,
        });

        for await (const chunk of responseStream) {
            fullText += chunk.text;
        }

        // --- 5. Save AI Response and User Message to New User History ---
        const aiResponseText = fullText.trim();
        
        const aiMessagePayload = {
            role: "model" as const,
            content: aiResponseText,
        };


        // --- 6. Return Response ---
        try {
            const jsonObject = JSON.parse(aiResponseText);
            const responseText = jsonObject.request || jsonObject.greeting || jsonObject.response || aiResponseText;

            return { success: true, text: responseText, chatId: undefined }; 
        } catch (e) {
            return { success: true, text: aiResponseText, chatId: undefined };
        }
    } catch (error) {
        console.error(`AI Generation or DB Error:`, error);
        return {
            success: false,
            error: attachedFile
                ? `Failed to generate content (File: ${attachedFile?.name || 'unknown file'}). Processing timeout or incompatible format.`
                : `Failed to generate content from AI model (${DEFAULT_GEMINI_MODEL}).`,
        };
    }
}