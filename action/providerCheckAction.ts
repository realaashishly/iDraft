'use server'

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { clientPromise } from "@/lib/db";

// Define the list of providers your app supports (from your Sidebar)
const KNOWN_PROVIDERS = [
    "google",
    "discord",
    "spotify",
    "slack",
    "github",
];

export async function checkProviderConnection() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Initialize the response object with all known providers as false
    const connections: Record<string, boolean> = {};
    KNOWN_PROVIDERS.forEach((provider) => {
        connections[provider] = false;
    });

    if (!session?.user?.id) {
        return {
            success: false,
            message: "Authentication required.",
            data: connections,
        };
    }

    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection("account"); 

        const userId = new ObjectId(session.user.id);

        const providersCursor = collection.find(
            { userId }
        );
        
        const providers = await providersCursor.toArray();

        if (providers.length === 0) {
            return {
                success: true,
                message: "No provider connections found.",
                data: connections,
            };
        }

        providers.forEach((account) => {
            console.log('account: ', account.providerId);
            connections[account.providerId as string] = true
        });

        return {
            success: true,
            message: "Provider connections fetched successfully.",
            data: connections,
        };

    } catch (error) {
        console.error("Error in checkProviderConnection:", error);
        return {
            success: false,
            message: "An internal server error occurred.",
            data: connections,
        };
    }
}