// type/auth.d.ts

import type { DefaultSession, DefaultUser } from "@auth/core/types";

// This is the key: we are augmenting the core module
declare module "@auth/core/types" {
  /**
   * Extend the built-in 'User' type.
   * This is used in the backend auth callbacks (jwt, session).
   */
  interface User extends DefaultUser {
    role: string;
    messagesLeft: number;
    geminiApiKey: string;
    profession: string;
  }

  /**
   * Extend the built-in 'Session' type.
   * This is what the `useSession` hook will return on the client.
   */
  interface Session {
    user: {
      /** The user's database ID */
      id: string;
      /** The user's custom role */
      role: string;
      /** The user's remaining message count */
      messagesLeft: number;
      /** The user's personal Gemini API key */
      geminiApiKey: string;
      /** The user's profession */
      profession: string;
    } & DefaultSession["user"]; // This merges with default properties (name, email, image)
  }
}
