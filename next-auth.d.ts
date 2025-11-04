// next-auth.d.ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  type User = {
    role: string;
    messagesLeft: number;
    geminiApiKey: string;
    profession: string;
  };

  type Session = {
    user: User & DefaultSession["user"];
  };
}
