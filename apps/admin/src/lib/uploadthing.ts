import { generateUploadDropzone, generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadDropzone: any = generateUploadDropzone<OurFileRouter>();
export const UploadButton: any = generateUploadButton<OurFileRouter>();