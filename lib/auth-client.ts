import { createAuthClient } from "better-auth/react";
export const { signIn, signUp, useSession, signOut, getSession, updateUser } = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
});

