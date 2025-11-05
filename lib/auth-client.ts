import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  // Add this 'plugins' array
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, useSession, signOut, getSession, updateUser } =
  createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
  });

export  const connectSpotify = async () => {
    const data = await authClient.signIn.social({
        provider: "spotify"
    })

    return data;
}

export const connectDiscord = async () => {
    const data = await authClient.signIn.social({
        provider: "discord",
    })

    return data;
}

export const requestGoogleMailAccess = async () => {
  await authClient.linkSocial({
    provider: "google",
    scopes: ["https://www.googleapis.com/auth/gmail.addons.current.message.readonly"],
  });
};

export const connectGithub = async () => {
    const data = await authClient.signIn.social({
        provider: "github"
    })
    return data;
}

export const connectSlack = async () => {
  await authClient.signIn.social({
    provider: "slack",
    scopes: ["channels:read", "chat:write"], // Additional Slack API scopes
  });
};

export const connectTwitter = async () => {
    const data = await authClient.signIn.social({
        provider: "twitter"
    })
    return data;
}
