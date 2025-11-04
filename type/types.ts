import type { Agent } from "@/action/agentActions";
import type { ObjectId } from "mongodb";

export type CreateAgentPayload = {
  name: string;
  title: string;
  description: string;
  systemInstructions: string;
  avatarUrl?: string | null;
  fileUrls?: string[];
};

export type AiResponse = {
  success: boolean;
  text?: string;
  chatId?: string;
  error?: string;
};

export type CreateAppPayload = {
  appName: string;
  appDescription?: string | null;
  appLink: string;
  logoUrl: string;
};

export type App = {
  id: string;
  appName: string;
  appDescription?: string | null;
  appLink: string;
  logoUrl: string;
  createdAt: string;
};

export type UpdateAppPayload = {
  appName?: string;
  appDescription?: string | null;
  appLink?: string;
  logoUrl?: string;
};

export type Asset = {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  createdAt?: Date;
  fileName?: string;
  uploadedAt?: Date | string;
};

export type AssetData = {
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
};

export type UpdateAssetPayload = {
  title: string;
  description: string;
};

export type ChatMessage = {
  role: "user" | "model";
  content: string;
  fileName?: string;
};

export type Message = {
  role: "user" | "model";
  content: string;
  createdAt: Date;
  fileMetadata?: { name: string; mimeType: string };
};

export type LegacyChatDocument = {
  _id: ObjectId;
  userId: string;
  agentId: string;
  title: string;
  createdAt: Date;
  messages: Message[];
};

export type ChatResponse = {
  success: boolean;
  chatId?: string;
  aiMessage?: ChatMessage;
  error?: string;
};

export type ChatListItem = {
  id: string;
  title: string;
};

export type LatestChatData = {
  chatId: string;
  agentId: string;
};

export type AgentHistoryMap = {
  [agentId: string]: Message[];
};

export type UserHistoryDocument = {
  _id?: ObjectId;
  userId: string;
  history: AgentHistoryMap;
};

export type SaveChatPayload = {
  agentId: string;
  userMessage: Omit<Message, "createdAt">;
  aiMessage: Omit<Message, "createdAt">;
};

export type Task = {
  id: number;
  text: string;
  isCompleted: boolean;
};

export type DashboardState = {
  todos?: Task[];
};

export type DashboardStateDocument = {
  _id?: ObjectId;
  userId: string;
  state: DashboardState;
  updatedAt: Date;
};

export type UpdateUserData = {
  name?: string;
  profession?: string;
  image?: string;
};

export type ChatRouteParams = {
  params: {
    chatId: string;
  };
};

export type ChatPageProps = {
  params: {
    agentId: string;
  };
};

export type ChatMessageProps = {
  id: string;
  sender: "user" | "ai";
  text: string;
  model?: string;
  fileName?: string;
  createdAt: Date | string;
}

export type MessagePayload = {
  role: "user" | "model";
  content: string;
  fileMetadata?: { name: string; mimeType: string };
}

export type HistoryMessage = {
  role: "user" | "model";
  content: string;
  fileName?: string;
  createdAt: Date | string;
}

export type  AIChatInterfaceProps = {
  agent: Agent;
}

export type SessionWithToken = {
  accessToken?: string | null;
};

export type Todo = {
  isCompleted: boolean;
}