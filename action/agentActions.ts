// actions/agentActions.ts
"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { clientPromise } from "@/lib/db";
import type { CreateAgentPayload } from "@/type/types";

/**
 * Internal type representing the agent document in the MongoDB database.
 */
interface AgentDocument extends CreateAgentPayload {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Optionally: creatorId: string;
}

/**
 * Client-facing type for an Agent, mapping MongoDB's `_id` to `id`.
 */
export interface Agent extends Omit<AgentDocument, "_id"> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const dbName = process.env.MONGODB_DB_NAME;

/**
 * Creates a new agent in the database.
 */
export async function createAgentAction(payload: CreateAgentPayload) {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const agentsCollection = db.collection("agents");

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

    // Invalidate the cache for the page that lists agents
    revalidatePath("/agents");

    // Convert the inserted document to the client-facing 'Agent' type
    const serializableAgent = {
      id: insertResult.insertedId.toString(), // Convert ObjectId to string
      name: newAgentDocument.name,
      title: newAgentDocument.title,
      description: newAgentDocument.description,
      systemInstructions: newAgentDocument.systemInstructions,
      avatarUrl: newAgentDocument.avatarUrl,
      fileUrls: newAgentDocument.fileUrls,
      createdAt: newAgentDocument.createdAt.toISOString(), // Convert Date to string
      updatedAt: newAgentDocument.updatedAt.toISOString(), // Convert Date to string
    };

    return { success: true, data: serializableAgent };
  } catch (error) {
    let errorMessage = "Database error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetches all agents from the database, sorted by creation date.
 */
export async function getAgentsAction(): Promise<
  { success: true; data: Agent[] } | { success: false; error: string }
> {
  // Note: This action is public. If you need to protect it,
  // add your server-side authentication check here.

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
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
        id: _id?.toString(), // Convert ObjectId to string
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    });

    return { success: true, data: agents };
  } catch (error) {
    let errorMessage = "Database error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetches a single agent by its ID.
 */
export async function getAgentByIdAction(
  agentId: string
): Promise<{ success: true; data: Agent } | { success: false; error: string }> {
  // Optional: Add auth check if only logged-in users can see agents
  // const session = await getSession();
  // if (!session?.user) {
  //    return { success: false, error: "Authentication required." };
  // }

  if (!ObjectId.isValid(agentId)) {
    return { success: false, error: "Invalid Agent ID format." };
  }

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
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
      id: _id?.toString(),
      createdAt: agentDoc.createdAt,
      updatedAt: agentDoc.updatedAt,
    };

    return { success: true, data: agent };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates an existing agent's data by its ID.
 */
export async function updateAgentAction(
  agentId: string,
  payload: Partial<CreateAgentPayload> // Allow partial updates
): Promise<{ success: true; data: Agent } | { success: false; error: string }> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const agentsCollection = db.collection<AgentDocument>("agents");

    const updateData = {
      ...payload,
      updatedAt: new Date(),
    };

    // Find and update the agent.
    // You can add `creatorId: session.user.id` to the filter
    // to ensure users can only edit their own agents.
    const updateResult = await agentsCollection.findOneAndUpdate(
      { _id: new ObjectId(agentId) /*, creatorId: session.user.id */ },
      { $set: updateData },
      { returnDocument: "after" } // Return the updated document
    );

    if (!updateResult) {
      return { success: false, error: "Agent not found or update failed." };
    }

    revalidatePath("/agents");
    revalidatePath(`/agents/${agentId}`); // Revalidate the specific agent page

    // Format and return the updated agent
    const { _id, ...rest } = updateResult;
    const updatedAgent: Agent = {
      ...rest,
      id: _id.toString(),
      createdAt: updateResult.createdAt,
      updatedAt: updateResult.updatedAt,
    };

    return { success: true, data: updatedAgent };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Deletes an agent from the database by its ID.
 */
export async function deleteAgentAction(
  agentId: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!ObjectId.isValid(agentId)) {
    return { success: false, error: "Invalid Agent ID format." };
  }

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const agentsCollection = db.collection("agents");

    // You can add `creatorId: session.user.id` to the filter
    // to ensure users can only delete their own agents.
    const deleteResult = await agentsCollection.deleteOne({
      _id: new ObjectId(agentId),
      /* creatorId: session.user.id */
    });

    if (deleteResult.deletedCount === 0) {
      return { success: false, error: "Agent not found." };
    }

    revalidatePath("/agents");
    revalidatePath(`/agents/${agentId}`);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return { success: false, error: errorMessage };
  }
}
