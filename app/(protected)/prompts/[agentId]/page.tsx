// agents/[agentId]/page.tsx

import { notFound } from "next/navigation";
import { type Agent, getAgentByIdAction } from "@/action/agentActions";
import AIChatInterface from "@/components/Agents/AIChatPage";
import type { ChatPageProps } from "@/type/types";

export default async function AgentChatPage({ params }: ChatPageProps) {
  const { agentId } = await params;

  // 1. Fetch Agent data
  const result = await getAgentByIdAction(agentId);
  // @ts-expect-error
  const agent: Agent | undefined = result?.data;

  if (!agent) {
    return notFound();
  }

  return <AIChatInterface agent={agent} />;
}
