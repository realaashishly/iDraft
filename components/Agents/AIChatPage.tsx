"use client";

import React, {
    useState,
    useRef,
    ChangeEvent,
    FormEvent,
    useEffect,
    useCallback,
} from "react";
import {
    Paperclip,
    Send,
    ChevronDown,
    X,
    Loader2,
    Settings,
    Key,
    Trash2,
    BookMarked,
    Zap,
    ArrowLeft,
    Copy,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Textarea from "react-textarea-autosize";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Agent } from "@/action/agentActions";
import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { generateAiContent, type AiResponse } from "@/action/aiResponse";
import {
    getAgentChatHistoryAction,
    saveUserChatHistoryAction,
    deleteAgentChatHistoryAction,
} from "@/action/chatActions";
import { MODELS } from "@/constant/models";
import { useRouter } from "next/navigation";

// Define message structure for display
interface ChatMessageProps {
    id: string;
    sender: "user" | "ai";
    text: string;
    model?: string;
    fileName?: string;
    createdAt: Date | string;
}

// Define message structure for server save payload
interface MessagePayload {
    role: "user" | "model";
    content: string;
    fileMetadata?: { name: string; mimeType: string };
}

// Define message structure for server history response (needed for mapping)
interface HistoryMessage {
    role: "user" | "model";
    content: string;
    fileName?: string;
    createdAt: Date | string;
}

// Component Props
interface AIChatInterfaceProps {
    agent: Agent;
}

// --- Main Chat Interface Component ---
export default function AIChatInterface({ agent }: AIChatInterfaceProps) {
    // --- Initialization ---
    const router = useRouter();

    // --- State and Refs ---
    const [messages, setMessages] = useState<ChatMessageProps[]>([]);
    const [inputText, setInputText] = useState("");
    const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messagesLeft = 10;
    const canSendMessage = messagesLeft > 0;

    // Function to handle fetching and setting messages
    const fetchAndSetHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const history: HistoryMessage[] = await getAgentChatHistoryAction(
                agent.id
            );

            const loadedMessages: ChatMessageProps[] = history.map(
                (msg, index) => ({
                    id: `${msg.role}-${index}-${Date.now()}`,
                    sender: msg.role === "user" ? "user" : "ai",
                    text: msg.content,
                    fileName: msg.fileName,
                    createdAt: msg.createdAt,
                })
            );

            setMessages(loadedMessages);
        } catch (error) {
            console.error("Failed to load chat history:", error);
            setMessages([]);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [agent.id]);

    // --- History Loading Effect ---
    useEffect(() => {
        fetchAndSetHistory();
    }, [fetchAndSetHistory]);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- Handlers ---
    const handleModelChange = (value: string) => setSelectedModel(value);
    const handleFileAttachClick = () => fileInputRef.current?.click();
    const handleRemoveFile = () => setAttachedFile(null);
    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
        setInputText(event.target.value);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setAttachedFile(event.target.files[0]);
        }
        event.target.value = "";
    };

    const handleSendMessage = async (
        event?: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
    ) => {
        event?.preventDefault();

        const trimmedInput = inputText.trim();
        if (
            !canSendMessage ||
            (!trimmedInput && !attachedFile) ||
            isSending ||
            isLoadingHistory
        )
            return;

        setIsSending(true);

        const fileToSend = attachedFile;
        const sendTime = new Date();

        // 1. Prepare message payloads for temporary UI and final save
        const userMessage: ChatMessageProps = {
            id: `user-${Date.now()}`,
            sender: "user",
            text: trimmedInput,
            fileName: fileToSend?.name,
            createdAt: sendTime,
        };

        const userMessagePayload: MessagePayload = {
            role: "user",
            content: trimmedInput,
            fileMetadata: fileToSend
                ? { name: fileToSend.name, mimeType: fileToSend.type }
                : undefined,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setAttachedFile(null);

        try {
            // 2. Call generateAiContent
            const result: AiResponse = await generateAiContent(
                undefined,
                agent.id,
                trimmedInput,
                agent.systemInstructions,
                userMessage.fileName ? fileToSend : null
            );

            if (!result.success) {
                throw new Error(
                    result.error ||
                        "Server action failed without a specific error."
                );
            }

            const aiResponseText = result.text || "No response received.";
            const aiResponseTime = new Date();

            // 3. Prepare AI response payloads
            const aiMessagePayload: MessagePayload = {
                role: "model",
                content: aiResponseText,
            };

            const aiResponse: ChatMessageProps = {
                id: `ai-${Date.now()}`,
                sender: "ai",
                text: aiResponseText,
                model: selectedModel,
                createdAt: aiResponseTime,
            };

            // 4. Save the entire turn to the new user-centric history
            const saveResult = await saveUserChatHistoryAction({
                agentId: agent.id,
                userMessage: userMessagePayload,
                aiMessage: aiMessagePayload,
            });

            if (!saveResult.success) {
                console.warn("Failed to save chat history:", saveResult.error);
            }

            // 5. Update the UI with the final AI response
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error: any) {
            console.error("Chat failure:", error);
            const errorMsg: ChatMessageProps = {
                id: `error-${Date.now()}`,
                sender: "ai",
                text: `Error: ${
                    error.message ||
                    "An unexpected error occurred during processing."
                }`,
                model: selectedModel,
                createdAt: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsSending(false);
        }
    };

    const selectedModelName =
        MODELS.find((m) => m.id === selectedModel)?.name || "Select Model";

    const { data: session } = useSession();
    if (!session?.user || !agent) {
        if (!agent) {
            return (
                <div className='flex items-center justify-center h-full'>
                    <p className='text-zinc-400'>Agent data not found.</p>
                </div>
            );
        }
        return (
            <div className='flex items-center justify-center h-full'>
                <p className='text-zinc-400'>
                    Please log in to access the chat.
                </p>
            </div>
        );
    }

    // --- Helper Component: Chat Settings Modal (unchanged) ---
    const ChatSettingsModal = () => {
        const [isDeleting, setIsDeleting] = useState(false);
        const [apiKey, setApiKey] = useState("");
        const [showConfirmation, setShowConfirmation] = useState(false);

        const handleDeleteHistory = async () => {
            setIsDeleting(true);
            try {
                const result = await deleteAgentChatHistoryAction(agent.id);
                if (result.success) {
                    setMessages([]);
                    setIsSettingsModalOpen(false);
                    setShowConfirmation(false);
                    await fetchAndSetHistory();
                } else {
                    alert(`Failed to delete history: ${result.error}`);
                }
            } catch (error) {
                alert("An error occurred during history deletion.");
            } finally {
                setIsDeleting(false);
            }
        };

        return (
            <Dialog
                open={isSettingsModalOpen}
                onOpenChange={(open) => {
                    setIsSettingsModalOpen(open);
                    if (!open) setShowConfirmation(false);
                }}
            >
                <DialogContent className='sm:max-w-[450px]'>
                    <DialogHeader>
                        <DialogTitle>Agent Settings: {agent.name}</DialogTitle>
                        <DialogDescription>
                            Configure chat options and history management for
                            this agent.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-6 py-4'>
                        {!showConfirmation && (
                            <>
                                <div className='space-y-2'>
                                    <label className='text-sm font-medium flex items-center gap-2'>
                                        <Key className='h-4 w-4 text-primary' />{" "}
                                        Set API Key (Local)
                                    </label>
                                    <Input
                                        type='password'
                                        placeholder='sk-...'
                                        value={apiKey}
                                        onChange={(e) =>
                                            setApiKey(e.target.value)
                                        }
                                    />
                                    <p className='text-xs text-muted-foreground'>
                                        This is a placeholder for local API key
                                        storage.
                                    </p>
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium flex items-center gap-2'>
                                        <Zap className='h-4 w-4 text-primary' />{" "}
                                        Change Model
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant='outline'
                                                className='w-full justify-between'
                                                disabled={isSending}
                                            >
                                                {selectedModelName}
                                                <ChevronDown className='h-4 w-4 opacity-50' />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='w-[420px]'>
                                            <DropdownMenuRadioGroup
                                                value={selectedModel}
                                                onValueChange={
                                                    handleModelChange
                                                }
                                            >
                                                {MODELS.map((model) => (
                                                    <DropdownMenuRadioItem
                                                        key={model.id}
                                                        value={model.id}
                                                    >
                                                        {model.name}
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className='border p-4 rounded-lg bg-muted/30 flex items-center justify-between'>
                                    <span className='font-medium text-sm flex items-center gap-2'>
                                        <BookMarked className='h-4 w-4 text-primary' />{" "}
                                        Save Current Prompts
                                    </span>
                                    <Button
                                        variant='secondary'
                                        size='sm'
                                        disabled
                                    >
                                        Save (Coming Soon)
                                    </Button>
                                </div>

                                <div className='border border-destructive/50 p-4 rounded-lg bg-destructive/10'>
                                    <h4 className='font-semibold text-sm text-destructive flex items-center gap-2 mb-4'>
                                        <Trash2 className='h-4 w-4' /> Delete
                                        Chat History
                                    </h4>
                                    <Button
                                        variant='destructive'
                                        onClick={() =>
                                            setShowConfirmation(true)
                                        }
                                        className='w-full'
                                    >
                                        Delete All History
                                    </Button>
                                </div>
                            </>
                        )}

                        {showConfirmation && (
                            <div className='space-y-4 pt-4'>
                                <h4 className='text-lg font-bold text-destructive flex items-center gap-2'>
                                    <Trash2 className='h-5 w-5' /> Are you sure?
                                </h4>
                                <p className='text-sm text-muted-foreground'>
                                    This action cannot be undone. All **
                                    {messages.length}** messages with **
                                    {agent.name}** will be permanently removed
                                    from the database.
                                </p>
                                <div className='flex justify-end gap-2 pt-4'>
                                    <Button
                                        variant='outline'
                                        onClick={() =>
                                            setShowConfirmation(false)
                                        }
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant='destructive'
                                        onClick={handleDeleteHistory}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className='h-4 w-4 animate-spin mr-2' />{" "}
                                                Deleting...
                                            </>
                                        ) : (
                                            "Confirm Delete"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {!showConfirmation && (
                            <DialogClose asChild>
                                <Button variant='outline'>Close</Button>
                            </DialogClose>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // --- JSX Rendering ---
    return (
        <div className='relative flex flex-col h-[90vh] bg-zinc-950 text-zinc-300 font-sans overflow-hidden'>
            <Button
                variant='ghost'
                onClick={() => router.back()}
                className='text-zinc-400 hover:text-white -ml-2 justify-start absolute top-0 left-0' // Removed -ml-2 if it causes issues, but kept justify-start
                disabled={isSending || isLoadingHistory}
            >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Agents
            </Button>
            {/* 1. Render the Modal */}
            <ChatSettingsModal />

            {/* Message List */}
            <div
                className='flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-2xl mx-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent 
                               md:scrollbar-default md:scrollbar-thumb-zinc-700 md:scrollbar-track-zinc-900'
                style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
                {/* Conditional Rendering: Loading, Welcome, or History */}
                {isLoadingHistory ? (
                    <div className='flex h-full items-center justify-center text-zinc-500'>
                        <Loader2 className='h-6 w-6 animate-spin mr-2' />{" "}
                        Loading conversation...
                    </div>
                ) : messages.length === 0 ? (
                    <div className='flex h-full flex-col items-center justify-center text-center p-8'>
                        <Image
                            src={agent.avatarUrl || "/placeholder-avatar.png"}
                            alt={agent.name}
                            width={80}
                            height={80}
                            className='rounded-full object-cover mb-4 opacity-75'
                        />
                        <h2 className='text-xl font-semibold text-white mb-2'>
                            Meet {agent.name}, {agent.title}
                        </h2>
                        <p className='text-zinc-400 max-w-sm'>
                            Ask your first question or upload a document to
                            begin a new chat session.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            agent={agent}
                            session={session}
                        />
                    ))
                )}

                {isSending && (
                    <div className='flex justify-start gap-3'>
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden`}
                        >
                            <Image
                                src={
                                    agent.avatarUrl || "/placeholder-avatar.png"
                                }
                                alt={agent.name}
                                width={32}
                                height={32}
                                className='object-cover'
                            />
                        </div>
                        <div
                            className={`p-3 rounded-lg shadow-sm bg-zinc-800 border border-zinc-700 rounded-bl-none`}
                        >
                            <Loader2 className='h-4 w-4 animate-spin text-zinc-400' />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area Container */}
            <div className='w-full px-4 pb-4 pt-2 flex-shrink-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/0'>
                <div className='max-w-2xl mx-auto'>
                    <div className='group relative'>
                        <form onSubmit={handleSendMessage} className='relative'>
                            <input
                                type='file'
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className='hidden'
                                accept='.pdf,.doc,.docx,.txt,.csv,.json,.xml,.xlsx,.pptx,.html'
                                multiple={false}
                                disabled={
                                    !canSendMessage ||
                                    isSending ||
                                    isLoadingHistory
                                }
                            />
                            <div className='flex flex-col bg-zinc-800 border border-zinc-700 rounded-xl focus-within:ring-1 focus-within:ring-zinc-500 transition-all duration-300 shadow-lg overflow-hidden'>
                                <Textarea
                                    value={inputText}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e as any);
                                        }
                                    }}
                                    placeholder={
                                        canSendMessage && !isLoadingHistory
                                            ? `Ask ${agent.name}...`
                                            : "Message limit reached or loading chat."
                                    }
                                    className='w-full bg-transparent text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm min-h-[60px] max-h-[150px]'
                                    rows={1}
                                    maxRows={6}
                                    disabled={
                                        !canSendMessage ||
                                        isSending ||
                                        isLoadingHistory
                                    }
                                />
                                {attachedFile && (
                                    <div className='mb-2 mt-1 mx-3 p-1.5 px-2 border border-dashed border-zinc-600 rounded-md flex items-center justify-between bg-zinc-700/50 text-xs shadow-sm'>
                                        <div className='flex items-center gap-2 overflow-hidden'>
                                            <Paperclip className='h-3 w-3 flex-shrink-0 text-zinc-400' />
                                            <span className='truncate text-zinc-300'>
                                                {attachedFile.name}
                                            </span>
                                            <span className='text-zinc-500 text-xs flex-shrink-0'>
                                                (
                                                {(
                                                    attachedFile.size / 1024
                                                ).toFixed(1)}{" "}
                                                KB)
                                            </span>
                                        </div>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-5 w-5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-600/50'
                                            onClick={handleRemoveFile}
                                            aria-label='Remove attached file'
                                            disabled={
                                                isSending || isLoadingHistory
                                            }
                                        >
                                            <X className='h-3 w-3' />
                                        </Button>
                                    </div>
                                )}
                                <div className='flex items-center justify-between p-2 border-t border-zinc-700/60'>
                                    <div className='flex items-center gap-1'>
                                        {/* Settings Button */}
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='icon'
                                            className='rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 h-8 w-8 flex-shrink-0 transition-colors'
                                            onClick={() =>
                                                setIsSettingsModalOpen(true)
                                            }
                                            disabled={
                                                isSending || isLoadingHistory
                                            }
                                            aria-label='Chat settings'
                                        >
                                            <Settings className='h-4 w-4' />
                                        </Button>

                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='icon'
                                            className='rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 h-8 w-8 flex-shrink-0 transition-colors'
                                            onClick={handleFileAttachClick}
                                            disabled={
                                                !canSendMessage ||
                                                isSending ||
                                                isLoadingHistory
                                            }
                                            aria-label='Attach file'
                                        >
                                            <Paperclip className='h-4 w-4' />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    className='flex-shrink-0 flex items-center gap-1 text-xs font-medium text-zinc-400 p-1 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-zinc-700/50 hover:text-zinc-100 rounded-md'
                                                    disabled={
                                                        isSending ||
                                                        isLoadingHistory
                                                    }
                                                >
                                                    <span className='truncate max-w-[80px]'>
                                                        {selectedModelName}
                                                    </span>
                                                    <ChevronDown className='h-3 w-3 flex-shrink-0' />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align='start'
                                                sideOffset={8}
                                                className='w-48 bg-zinc-900 border-zinc-700 text-zinc-200'
                                            >
                                                <DropdownMenuRadioGroup
                                                    value={selectedModel}
                                                    onValueChange={
                                                        handleModelChange
                                                    }
                                                >
                                                    {MODELS.map((model) => (
                                                        <DropdownMenuRadioItem
                                                            key={model.id}
                                                            value={model.id}
                                                            className='focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer'
                                                        >
                                                            {model.name}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <Button
                                        type='submit'
                                        className='bg-zinc-700 hover:bg-zinc-600 text-zinc-50 rounded-lg w-8 h-8 flex items-center justify-center transition-opacity shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
                                        disabled={
                                            (!inputText.trim() &&
                                                !attachedFile) ||
                                            !canSendMessage ||
                                            isSending ||
                                            isLoadingHistory
                                        }
                                        aria-label='Send message'
                                    >
                                        {isSending ? (
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                        ) : (
                                            <Send className='h-4 w-4' />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- ChatMessage Component (Updated Copy Button and Time Position) ---
function ChatMessage({
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

    // Format the time
    const timeString = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Copy function
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
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
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

            {/* Message Bubble */}
            <div
                className={`max-w-[70%] md:max-w-[65%] p-3 rounded-lg shadow-sm relative ${
                    isUser
                        ? "bg-zinc-600 text-zinc-50 rounded-br-none order-1"
                        : "bg-zinc-800 border border-zinc-700 rounded-bl-none order-2"
                }`}
            >
                {!isUser && (
                    <p className='text-xs font-medium text-zinc-500 mb-1'>
                        {agentName} {modelInfo && `(${modelInfo})`}
                    </p>
                )}

                {message.text && (
                    <p className='whitespace-pre-wrap break-words text-sm text-zinc-100'>
                        {message.text}
                    </p>
                )}
                {message.fileName && (
                    <div
                        className={`mt-2 text-xs opacity-80 flex items-center gap-1 border-t pt-1 ${
                            isUser ? "border-zinc-500/50" : "border-zinc-700"
                        }`}
                    >
                        <Paperclip className='h-3 w-3' /> {message.fileName}
                    </div>
                )}

                {/* Actions and Timing Row (BOTTOM OF MSG) */}
                <div
                    className={`mt-1 flex items-center gap-1.5 ${
                        isUser ? "justify-end" : "justify-start"
                    }`}
                >
                    {/* Message Timing */}
                    <p className={`text-[10px] text-zinc-500`}>{timeString}</p>

                    {/* Copy Button */}
                    {message.text && (
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={handleCopy}
                            // Styled to be subtle and inline at the bottom
                            className='text-zinc-500 hover:text-zinc-100 h-5 w-5 p-0 transition-colors'
                            aria-label='Copy message'
                        >
                            <Copy className='h-3 w-3' />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
