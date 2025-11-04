import { Copy, Paperclip } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Agent } from "@/action/agentActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessageProps } from "@/type/types";

const MODELS = [
  { id: "gpt-3.5-turbo", name: "GEMINI PRO" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-4-32k", name: "GPT-4-32k" },
]

export default function ChatMessage({
  message,
  agent,
  session,
}: {
  message: ChatMessageProps;
  agent: Agent;
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  } | null;
}) {
  const isUser = message.sender === "user";
  const modelInfo = isUser
    ? null
    : MODELS.find((m) => m.id === message.model)?.name;
  const agentAvatar = isUser
    ? session?.user?.image || "/placeholder-user-avatar.png"
    : agent.avatarUrl || "/placeholder-avatar.png";
  const agentName = isUser ? "You" : agent.name;

  // 1. Create the Date object from the message prop
  const date = new Date(message.createdAt || new Date()); // Fallback for invalid date

  // 2. Check if the date is valid before formatting it
  const timeString = isNaN(date.getTime())
    ? "---"
    : date.toLocaleTimeString([], {
        // If valid, format it
        hour: "2-digit",
        minute: "2-digit",
      }); // If invalid, show a placeholder

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard
        .writeText(message.text)
        .then(() => {
          console.log("Message copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy message: ", err);
        });
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Icon/Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
          isUser ? "order-2" : "order-1"
        }`}
      >
        {isUser ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={agentAvatar} />
            <AvatarFallback>
              {session?.user?.name ? session.user.name[0] : "U"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Image
            alt={agentName}
            className="object-cover"
            height={32}
            src={agentAvatar}
            width={32}
          />
        )}
      </div>

      {/* --- NEW WRAPPER for bubble + actions --- */}
      <div
        className={cn(
          "flex flex-col gap-1", // Stacks bubble on top of actions
          isUser
            ? "order-1 flex-1 items-end" // <-- ADDED flex-1 and items-end
            : "order-2"
        )}
      >
        {/* Message Bubble */}
        <div
          className={`relative max-w-[70%] rounded-lg p-3 shadow-sm md:max-w-[65%] ${
            isUser
              ? "rounded-br-none bg-zinc-600 text-zinc-50" // Removed 'order-1'
              : "rounded-bl-none border border-zinc-700 bg-zinc-800" // Removed 'order-2'
          }`}
        >
          {!isUser && (
            <p className="mb-1 font-medium text-xs text-zinc-500">
              {agentName} {modelInfo && `(${modelInfo})`}
            </p>
          )}

          {message.text && (
            <div className="prose prose-sm prose-invert wrap-break-word prose-leading-relaxed prose-p:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            </div>
          )}

          {message.fileName && (
            <div
              className={`mt-2 flex items-center gap-1 border-t pt-1 text-xs opacity-80 ${
                isUser ? "border-zinc-500/50" : "border-zinc-700"
              }`}
            >
              <Paperclip className="h-3 w-3" /> {message.fileName}
            </div>
          )}
        </div>

        {/* --- Actions and Timing Row (NOW OUTSIDE) --- */}
        <div
          className={cn(
            "flex items-center gap-2",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <p className={"text-[10px] text-zinc-500"}>{timeString}</p>

          {message.text && (
            <Button
              aria-label="Copy message"
              className="h-5 w-5 cursor-pointer p-0 text-zinc-500 transition-colors hover:text-zinc-100"
              onClick={handleCopy}
              size="icon-sm"
              variant="ghost"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {/* --- END WRAPPER --- */}
    </div>
  );
}
