import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  // Define a route for product images
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after a successful upload
      console.log("Upload complete! File URL:", file.url);
      return { url: file.url };
    }),

  // Define a route for handover email attachments (PDFs, JPGs, PNGs, documents)
  handoverAttachment: f(["pdf", "image", "blob"])
    .onUploadComplete(async ({ file }) => {
      console.log("Handover attachment uploaded:", file.name, file.url);
      return { url: file.url, name: file.name, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;