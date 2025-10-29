import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({
        image: {
            maxFileSize: "16MB",
            maxFileCount: 10,
        },
        pdf: {
            maxFileSize: "16MB",
            maxFileCount: 10,
        },
        video: {
            maxFileSize: "16MB",
            maxFileCount: 10,
        },
        audio: {
            maxFileSize: "16MB",
            maxFileCount: 10,
        },
    }).onUploadComplete(async ({ file }) => {
        console.log("file url", file.ufsUrl);

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { uploadedBy: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
