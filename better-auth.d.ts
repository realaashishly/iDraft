import { DefaultUser } from "better-auth";
import { Session as ClientSession } from "@/lib/auth-client";

declare module "better-auth" {
  interface User extends DefaultUser {
    role: string;
    messagesLeft: number;
    geminiApiKey: string;
    profession: string;
  }
}

declare module "@/lib/auth-client" {
  interface Session {
    user: User;
  }
}