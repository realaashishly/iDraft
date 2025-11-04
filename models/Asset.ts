import mongoose, { type Document, Schema } from "mongoose";

export interface IAsset extends Document {
  title: string;
  type: string;
  createdAt: Date;
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  uploadedBy: string;
}

const AssetSchema: Schema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  tags: { type: [String] },
  uploadedBy: { type: String, required: true },
});

export default mongoose.models.Asset ||
  mongoose.model<IAsset>("Asset", AssetSchema);
