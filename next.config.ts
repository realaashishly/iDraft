import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ui-avatars.com",
                port: "",
                pathname: "/api/**",
            },
            {
                protocol: "https",
                hostname: "utfs.io",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "avatar.iran.liara.run",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "cdn.discordapp.com",
                port: "",
                pathname: "/avatars/**", // Be more specific for security
            },
            {
                protocol: "https", // Or 'http' if you know some are not secure
                hostname: "yt3.googleusercontent.com",
                port: "",
                pathname: "/**", // This allows any path on that host
            },
            // You might also need this one, as it appears in your src prop
            {
                protocol: "http",
                hostname: "googleusercontent.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "**", // Allow any hostname
            },
            {
                protocol: "https",
                hostname: "**", // Allow any hostname
            },
        ],
    },
    experimental: {
        serverComponentsExternalPackages: ["mime"],
        serverActions: {
            bodySizeLimit: "5mb",
        },
    },
};

export default nextConfig;
