// agents/[agentId]/page.tsx
// This file is now a pure Server Component.

import { getAgentByIdAction, type Agent } from "@/action/agentActions";
import { notFound } from "next/navigation";
import AIChatInterface from "@/components/Agents/AIChatPage";

interface ChatPageProps {
    params: {
        agentId: string;
    };
}

export default async function AgentChatPage({ params }: ChatPageProps) {
    const { agentId } = await params;

    // 1. Fetch Agent data
    const result = await getAgentByIdAction(agentId);
    const agent: Agent | undefined = result?.data;

    if (!agent) {
        return notFound();
    }

    return <AIChatInterface agent={agent} />;
}
