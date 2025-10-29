import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: "inactive" },
  settings: { type: Object, default: {} },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  avatarUrl: { type: String, default: "/default-avatar.png" },
  integrations: { type: [integrationSchema], default: [] },
  geminiApiKey: { type: String, default: "" },
  claudeApiKey: { type: String, default: "" },
  openaiApiKey: { type: String, default: "" },
  grokApiKey: { type: String, default: "" },
  qwenApiKey: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
