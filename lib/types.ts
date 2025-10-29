export type Asset = {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  createdAt?: Date;
};

export interface NewAsset {
  title: string;
  description?: string;
  tags?: string[];
  file?: File;
  fileUrl: string;
  
  // This type can be derived from the 'file' object
  type?: "image" | "pdf" | "video" | "audio"; 
}