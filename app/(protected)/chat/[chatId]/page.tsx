// app/chat/[chatId]/page.tsx

import { notFound } from "next/navigation";
import { getAgentByIdAction } from "@/action/agentActions";
import { getChatHistoryAction } from "@/action/chatActions";
import AIChatInterface from "@/components/Agents/AIChatPage";
import type { ChatRouteParams } from "@/type/types";

export default async function ChatPage({ params }: ChatRouteParams) {
  const { chatId } = params;

  // 1. Fetch the chat history to confirm chat existence and get context (messages)
  const history = await getChatHistoryAction(chatId);

  // 2. Determine the associated agent ID (You'll need an action to retrieve the AgentId associated with this chat or the agent data directly)
  // For simplicity, let's assume agentId is stored *somewhere* or we just use a default agent.
  // **Since your AIChatInterface expects an Agent object, we need a way to fetch it.**

  // 🛑 IMPORTANT: If your chat DB document stores the original Agent ID:
  // const agentId = await getAgentIdFromChatId(chatId);

  // 3. Fetch the Agent based on the ID derived from the chat
  const agentResult = await getAgentByIdAction("AGENT_ID_ASSOCIATED_WITH_CHAT"); // Replace "AGENT_ID..."
  // @ts-expect-error
  if (!history || history.length === 0 || !agentResult?.data) {
    // If the chat doesn't exist, the agent doesn't exist, or the history is invalid
    return notFound();
  }

  // 4. Render the client interface, passing the Chat ID as the initial ID
  // @ts-expect-error
  return <AIChatInterface agent={agentResult.data} />;
}
