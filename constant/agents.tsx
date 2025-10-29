export interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
  description: string;
  title: string;
  handle: string;
  status: "Online" | "Offline";
  systemPrompt: string;
}

export const agents: Agent[] = [
  {
    id: "agent-001",
    name: "Nova",
    title: "General AI Assistant",
    handle: "nova_ai",
    status: "Online",
    avatarUrl: "https://avatar.vercel.sh/nova.png",
    description: "A friendly and knowledgeable AI assistant for general questions and everyday help.",
    systemPrompt: "You are Nova, a friendly and knowledgeable AI assistant. Provide helpful and accurate information in a conversational manner.",
  },
  {
    id: "agent-002",
    name: "Dr. Lexi",
    title: "Medical Information Assistant",
    handle: "dr_lexi",
    status: "Online",
    avatarUrl: "https://avatar.vercel.sh/dr_lexi.png",
    description: "A medical information assistant that provides general health knowledge (not a substitute for professional care).",
    systemPrompt: "You are Nova, a friendly and knowledgeable AI assistant. Provide helpful and accurate information in a conversational manner.",
  },
  {
    id: "agent-003",
    name: "CodeCraft",
    title: "Programming Mentor",
    handle: "codecraft_dev",
    status: "Online",
    avatarUrl: "https://avatar.vercel.sh/codecraft.png",
    description: "A programming mentor that helps with coding problems, best practices, and debugging.",
    systemPrompt: "You are Nova, a friendly and knowledgeable AI assistant. Provide helpful and accurate information in a conversational manner.",
  },
  {
    id: "agent-004",
    name: "EcoGuide",
    title: "Environmental Advisor",
    handle: "ecoguide_green",
    status: "Online",
    avatarUrl: "https://avatar.vercel.sh/ecoguide.png",
    description: "An environmental advisor offering tips on sustainability, climate action, and green living.",
    systemPrompt: "You are Nova, a friendly and knowledgeable AI assistant. Provide helpful and accurate information in a conversational manner.",
  },
  {
    id: "agent-005",
    name: "Historia",
    title: "History Expert",
    handle: "historia_edu",
    status: "Online",
    avatarUrl: "https://avatar.vercel.sh/historia.png",
    description: "A history expert who brings the past to life with engaging stories and factual accuracy.",
    systemPrompt: "You are Nova, a friendly and knowledgeable AI assistant. Provide helpful and accurate information in a conversational manner.",
  },
];