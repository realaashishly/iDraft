// Make sure to install: npm install react-markdown
import ReactMarkdown from "react-markdown";

// --- Assuming these imports are present ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Copy, Paperclip } from "lucide-react";
import { type Agent } from "@/action/agentActions";
import { MODELS } from "@/constant/models";
import { ChatMessageProps } from "./AIChatPage"; 
import { cn } from "@/lib/utils";
import remarkGfm from 'remark-gfm';
// ---

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
    const modelInfo = !isUser
        ? MODELS.find((m) => m.id === message.model)?.name
        : null;
    const agentAvatar = !isUser
        ? agent.avatarUrl || "/placeholder-avatar.png"
        : session?.user?.image || "/placeholder-user-avatar.png";
    const agentName = !isUser ? agent.name : "You";

    // 1. Create the Date object from the message prop
    const date = new Date(message.createdAt || new Date()); // Fallback for invalid date

    // 2. Check if the date is valid before formatting it
    const timeString = !isNaN(date.getTime())
        ? date.toLocaleTimeString([], {
              // If valid, format it
              hour: "2-digit",
              minute: "2-digit",
          })
        : "---"; // If invalid, show a placeholder

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
        <div
            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {/* Icon/Avatar */}
            <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                    isUser ? "order-2" : "order-1"
                }`}
            >
                {isUser ? (
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src={agentAvatar} />
                        <AvatarFallback>
                            {session?.user?.name ? session.user.name[0] : "U"}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <Image
                        src={agentAvatar}
                        alt={agentName}
                        width={32}
                        height={32}
                        className='object-cover'
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
                    className={`max-w-[70%] md:max-w-[65%] p-3 rounded-lg shadow-sm relative ${
                        isUser
                            ? "bg-zinc-600 text-zinc-50 rounded-br-none" // Removed 'order-1'
                            : "bg-zinc-800 border border-zinc-700 rounded-bl-none" // Removed 'order-2'
                    }`}
                >
                    {!isUser && (
                        <p className='text-xs font-medium text-zinc-500 mb-1'>
                            {agentName} {modelInfo && `(${modelInfo})`}
                        </p>
                    )}

                    {message.text && (
                        <div className='prose prose-sm prose-invert wrap-break-word prose-p:my-2 prose-leading-relaxed'>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                        </div>
                    )}

                    {message.fileName && (
                        <div
                            className={`mt-2 text-xs opacity-80 flex items-center gap-1 border-t pt-1 ${
                                isUser
                                    ? "border-zinc-500/50"
                                    : "border-zinc-700"
                            }`}
                        >
                            <Paperclip className='h-3 w-3' /> {message.fileName}
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
                    <p className={`text-[10px] text-zinc-500`}>{timeString}</p>

                    {message.text && (
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={handleCopy}
                            className='text-zinc-500 hover:text-zinc-100 h-5 w-5 p-0 transition-colors cursor-pointer'
                            aria-label='Copy message'
                        >
                            <Copy className='h-3 w-3' />
                        </Button>
                    )}
                </div>
            </div>
            {/* --- END WRAPPER --- */}
        </div>
    );
}
