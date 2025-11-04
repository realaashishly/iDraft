export interface NewAsset {
  title: string;
  description?: string;
  tags?: string[];
  file?: File;
  fileUrl: string;

  // This type can be derived from the 'file' object
  type?: "image" | "pdf" | "video" | "audio";
}
