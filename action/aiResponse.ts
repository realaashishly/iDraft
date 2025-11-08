"use server";

import { Buffer } from "node:buffer";
import { type Content, GoogleGenAI, type Part } from "@google/genai";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { AiResponse } from "@/type/types";

Object.assign(generateAiContent, { maxDuration: 60 });
Object.assign(generateAiContentByUserAPI, { maxDuration: 60 });

// --- 2. Utility Function: File to Generative Part ---
export async function fileToGenerativePart(file: File): Promise<Part> {
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
  userInput: string,
  agentSystemInstructions: string,
  attachedFile: File | null
): Promise<AiResponse> {
  // --- 0. Setup and Auth ---
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  // --- 1. Centralized Initialization ---
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

  if (!GEMINI_API_KEY) {
    return { success: false, error: "Gemini API Key is missing." };
  }

  let fullText = "";

  try {
    const parts: Part[] = [];

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
    }

    // 2. Add Text Part & Prepare Content
    parts.push({ text: userInput });
    const geminiContents: Content[] = [{ role: "user", parts }];

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

    // --- 6. Return Response ---
    try {
      const jsonObject = JSON.parse(aiResponseText);
      const responseText =
        jsonObject.request ||
        jsonObject.greeting ||
        jsonObject.response ||
        aiResponseText;

      return { success: true, text: responseText, chatId: undefined };
    } catch {
      return { success: true, text: aiResponseText, chatId: undefined };
    }
  } catch {
    return {
      success: false,
      error: attachedFile
        ? `Failed to generate content (File: ${
            attachedFile?.name || "unknown file"
          }). Processing timeout or incompatible format.`
        : `Failed to generate content from AI model (${DEFAULT_GEMINI_MODEL}).`,
    };
  }
}

export async function generateAiContentByUserAPI(
  userInput: string,
  agentSystemInstructions: string,
  attachedFile: File | null
): Promise<AiResponse> {
  // --- 0. Setup and Auth ---
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  // --- 1. Centralized Initialization ---
  const GEMINI_API_KEY = session.user.geminiApiKey;

  if (!GEMINI_API_KEY) {
    return { success: false, error: "Gemini API Key is missing." };
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

  let fullText = "";

  try {
    const parts: Part[] = [];

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
    }

    // 2. Add Text Part & Prepare Content
    parts.push({ text: userInput });
    const geminiContents: Content[] = [{ role: "user", parts }];

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

    // --- 6. Return Response ---
    try {
      const jsonObject = JSON.parse(aiResponseText);
      const responseText =
        jsonObject.request ||
        jsonObject.greeting ||
        jsonObject.response ||
        aiResponseText;

      return { success: true, text: responseText, chatId: undefined };
    } catch {
      return { success: true, text: aiResponseText, chatId: undefined };
    }
  } catch {
    return {
      success: false,
      error: attachedFile
        ? `Failed to generate content (File: ${
            attachedFile?.name || "unknown file"
          }). Processing timeout or incompatible format.`
        : `Failed to generate content from AI model (${DEFAULT_GEMINI_MODEL}).`,
    };
  }
}
