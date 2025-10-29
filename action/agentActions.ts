// actions/agentActions.ts (or a new file like actions/adminActions.ts)
"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { clientPromise } from "@/lib/db";
import { log } from "console";

// --- Define the expected input data structure ---
// Note: This expects URLs for images/files, assuming they are uploaded separately first.
interface CreateAgentPayload {
    name: string;
    title: string;
    description: string;
    systemInstructions: string;
    avatarUrl?: string | null; // URL from upload
    fileUrls?: string[]; // URLs from upload
    // Add any other fields you store for an agent
}

// --- Define the structure of the agent document in the DB (adjust as needed) ---
interface AgentDocument extends CreateAgentPayload {
    _id?: ObjectId; // Added by MongoDB
    createdAt: Date;
    updatedAt: Date;
    // Add any other fields like creatorId, etc.
    // creatorId?: string;
}

export interface Agent extends Omit<AgentDocument, "_id"> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function createAgentAction(payload: CreateAgentPayload) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME!); // Use your DB name env variable
        const agentsCollection = db.collection("agents"); // Use your agents collection name

        const newAgentDocument: Omit<AgentDocument, "_id"> = {
            ...payload,
            avatarUrl: payload.avatarUrl ?? null, // Ensure null if undefined
            fileUrls: payload.fileUrls ?? [], // Ensure empty array if undefined
            createdAt: new Date(),
            updatedAt: new Date(),
            // Optionally add the creator's ID
            // creatorId: session.user.id,
        };

        const insertResult = await agentsCollection.insertOne(newAgentDocument);

        if (!insertResult.insertedId) {
            throw new Error("Failed to insert agent into database.");
        }

        // 3. --- Revalidate Path (Optional) ---
        // Invalidate the cache for the page that lists agents
        revalidatePath("/agents");

        // 4. --- Return Success ---
        // Convert the inserted document ID to a string for the return value
        const createdAgent = {
            ...newAgentDocument,
            id: insertResult.insertedId.toString(), // Convert ObjectId to string id
            createdAt: newAgentDocument.createdAt,
            updatedAt: newAgentDocument.updatedAt,
        };
        // Omit the raw _id if you don't need it in the return payload
        // delete (createdAgent as any)._id;

        return { success: true, data: createdAgent };
    } catch (error) {
        console.error("Failed to create agent:", error);
        let errorMessage = "Database error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
    // --- End DB Operation ---
}

export async function getAgentsAction(): Promise<
    { success: true; data: Agent[] } | { success: false; error: string }
> {
    // Note: This action is public. If you need to protect it,
    // add your server-side authentication check here.

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME!);
        const agentsCollection = db.collection<AgentDocument>("agents");

        // Find all agents, sort by newest first
        const agentsDocs = await agentsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
            

        // Convert MongoDB ObjectId to a plain string 'id' for the client
        const agents: Agent[] = agentsDocs.map((doc) => {
            const { _id, ...rest } = doc;
            return {
                ...rest,
                id: _id!.toString(), // Convert ObjectId to string
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            };
        });

        return { success: true, data: agents };
    } catch (error) {
        console.error("Failed to fetch agents:", error);
        let errorMessage = "Database error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
}

export async function getAgentByIdAction(
    agentId: string
): Promise<{ success: true; data: Agent } | { success: false; error: string }> {
    // Optional: Add auth check if only logged-in users can see agents
    // const session = await getSession();
    // if (!session?.user) {
    //   return { success: false, error: "Authentication required." };
    // }

    if (!ObjectId.isValid(agentId)) {
        return { success: false, error: "Invalid Agent ID format." };
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME!);
        const agentsCollection = db.collection<AgentDocument>("agents");

        const agentDoc = await agentsCollection.findOne({
            _id: new ObjectId(agentId),
        });
        

        if (!agentDoc) {
            return { success: false, error: "Agent not found." };
        }

        // Convert to client-safe format
        const { _id, ...rest } = agentDoc;
        const agent: Agent = {
            ...rest,
            id: _id!.toString(),
            createdAt: agentDoc.createdAt,
            updatedAt: agentDoc.updatedAt,
        };

        return { success: true, data: agent };
    } catch (error) {
        console.error("Failed to fetch agent by ID:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Database error occurred.";
        return { success: false, error: errorMessage };
    }
}
