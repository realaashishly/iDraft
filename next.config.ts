import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatar.vercel.sh",
                port: "",
                pathname: "/**",
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
        ],
    },
    experimental: {
        serverComponentsExternalPackages: ["mime"],
        serverActions: {
            // Set the body size limit higher to allow file uploads.
            // Recommended to use '4mb', '5mb', or more, depending on your file size expectations.
            bodySizeLimit: "5mb",
        },
    },
};

export default nextConfig;
