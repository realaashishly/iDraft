import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
  debug: true,
  // --- Update adapter to use your cached connection promise ---

  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      messagesLeft: {
        type: "number",
        required: true,
        defaultValue: 10,
        input: false,
      },
      geminiApiKey: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      profession: {
        type: "string",
        required: false,
        defaultValue: "",
      },
    },
  },
});
