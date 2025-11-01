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
import {
    getAgentChatHistoryAction,
    saveUserChatHistoryAction,
    deleteAgentChatHistoryAction,
} from "@/action/chatActions";
import { MODELS } from "@/constant/models";
import { useRouter } from "next/navigation";
import ChatMessage from "./ChatMessage";
import {
    AiResponse,
    generateAiContent,
    generateAiContentByUserAPI,
} from "@/action/aiResponse";
import {
    updateUserGeminiApiKeyAction,
    decrementMessagesLeftAction,
} from "@/action/userActions";

// Define message structure for display
export interface ChatMessageProps {
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
    const { data: session } = useSession(); // Get session data

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

    // --- (2) USE SESSION FOR MESSAGES LEFT ---
    const userApiKey = session?.user.geminiApiKey;

    // --- Client-side state for reactive UI ---
    const [apiKeyExists, setApiKeyExists] = useState(
        userApiKey && userApiKey.trim() !== ""
    );
    const [currentMessagesLeft, setCurrentMessagesLeft] = useState(
        session?.user?.messagesLeft ?? 0
    );
    // --- THIS IS NEW ---
    // This state holds the *saved* key for display
    const [savedApiKey, setSavedApiKey] = useState(
        session?.user.geminiApiKey || ""
    );

    // --- Syncs client state with the session when it loads or updates ---
    useEffect(() => {
        if (session) {
            const key = session.user.geminiApiKey;
            setApiKeyExists(key && key.trim() !== "");
            setCurrentMessagesLeft(session.user.messagesLeft ?? 0);
            setSavedApiKey(key || ""); // --- ADDED THIS LINE ---
        }
    }, [session]); // Re-run this logic ANY time the session object changes

    // User can send if they have messages OR if they have their own API key
    const canSendMessage = currentMessagesLeft > 0 || apiKeyExists;

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

    // --- (3) MODIFIED SEND MESSAGE HANDLER ---
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
            // 2. CHECK WHICH AI FUNCTION TO CALL
            let result: AiResponse; // Declare result variable

            if (apiKeyExists) {
                // User has their own key. Do NOT decrement messages.
                console.log("Using user's API key.");
                result = await generateAiContentByUserAPI(
                    agent.id,
                    trimmedInput,
                    agent.systemInstructions,
                    userMessage.fileName ? fileToSend : null
                );
            } else {
                // User does NOT have a key. Use the system key and plan to decrement.
                console.log("Using system API key.");
                result = await generateAiContent(
                    agent.id,
                    trimmedInput,
                    agent.systemInstructions,
                    userMessage.fileName ? fileToSend : null
                );
            }

            // 3. Check for AI call failure
            if (!result.success) {
                throw new Error(
                    result.error ||
                        "Server action failed without a specific error."
                );
            }

            // 4. AI call was SUCCESSFUL. Now decrement *only if* needed.
            if (!apiKeyExists) {
                console.log("AI success, decrementing message count.");
                const decrementResult = await decrementMessagesLeftAction();

                if (decrementResult.success) {
                    // --- Manually update client state ---
                    setCurrentMessagesLeft((prevCount) => prevCount - 1);
                } else {
                    console.error(
                        "Failed to decrement message count:",
                        decrementResult.message
                    );
                }
            }

            // 5. Prepare AI response payloads (common logic)
            const aiResponseText = result.text || "No response received.";
            const aiResponseTime = new Date();

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

            // 6. Save the entire turn (common logic)
            const saveResult = await saveUserChatHistoryAction({
                agentId: agent.id,
                userMessage: userMessagePayload,
                aiMessage: aiMessagePayload,
            });

            if (!saveResult.success) {
                console.warn("Failed to save chat history:", saveResult.error);
            }

            // 7. Update the UI (common logic)
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

            // No re-credit logic needed, as we only decrement on success.
        } finally {
            setIsSending(false);
        }
    };

    const selectedModelName =
        MODELS.find((m) => m.id === selectedModel)?.name || "Select Model";

    // const { data: session } = useSession(); // Already defined above
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

    // --- Helper Component: Chat Settings Modal ---
    const ChatSettingsModal = () => {
        const [isDeleting, setIsDeleting] = useState(false);
        const [showConfirmation, setShowConfirmation] = useState(false);

        // --- (4) POPULATE API KEY FROM SESSION ---
        // This state is for the *input field*
        const [apiKeyInput, setApiKeyInput] = useState(""); 
        const [isUpdatingKey, setIsUpdatingKey] = useState(false);
        const [keyStatus, setKeyStatus] = useState<string>("");

        const handleUpdateApiKey = async () => {
            setKeyStatus("");
            const trimmedApiKey = apiKeyInput.trim();

            setIsUpdatingKey(true);
            try {
                // 1. Call the Server Action with the input's value
                const result = await updateUserGeminiApiKeyAction(
                    trimmedApiKey
                );

                if (result.success) {
                    setKeyStatus("✅ " + result.message);
                    // --- Update client state ---
                    setApiKeyExists(trimmedApiKey !== "");
                    setSavedApiKey(trimmedApiKey); // Update the displayed key
                    setApiKeyInput(""); // Clear the input field
                } else {
                    setKeyStatus(
                        "❌ " + (result.message || "Failed to update key.")
                    );
                }
            } catch (error) {
                console.error("API Key update error:", error);
                setKeyStatus("❌ An unexpected error occurred.");
            } finally {
                setIsUpdatingKey(false);
            }
        };

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
                    if (!open) {
                        setShowConfirmation(false);
                        setKeyStatus(""); // Clear status when closing modal
                        setApiKeyInput(""); // Clear input field on close
                    }
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
                                        <Key className='h-4 w-4 text-blue-400' />{" "}
                                        Set Gemini API Key
                                    </label>
                                    <div className='flex gap-2'>
                                        <Input
                                            type='password' // <-- Kept as password
                                            placeholder='Enter new key (or blank to remove)'
                                            value={apiKeyInput} // <-- Use new input state
                                            onChange={(e) =>
                                                setApiKeyInput(e.target.value)
                                            }
                                            disabled={isUpdatingKey}
                                        />
                                        <Button
                                            onClick={handleUpdateApiKey}
                                            disabled={isUpdatingKey}
                                        >
                                            {isUpdatingKey ? (
                                                <Loader2 className='h-4 w-4 animate-spin' />
                                            ) : (
                                                "Save"
                                            )}
                                        </Button>
                                    </div>

                                    {/* --- THIS IS THE NEWLY ADDED PART --- */}
                                    {savedApiKey ? (
                                        <p className="text-xs text-zinc-400 mt-2">
                                            Current key: <span className="font-mono">{savedApiKey}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-zinc-500 mt-2">
                                            No API key is currently saved.
                                        </p>
                                    )}
                                    {/* --- END OF NEW PART --- */}
                                    
                                    {keyStatus && (
                                        <p
                                            className={`text-xs ${
                                                keyStatus.startsWith("✅")
                                                    ? "text-green-500"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {keyStatus}
                                        </p>
                                    )}
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
    // Helper function to get placeholder text
    const getPlaceholderText = () => {
        if (isLoadingHistory) return "Loading chat...";
        // Use client state
        if (apiKeyExists) return `Ask ${agent.name}... (Using your API key)`;
        // Use client state
        if (canSendMessage) 
            return `Ask ${agent.name}... (${currentMessagesLeft} left)`;
        return "Message limit reached.";
    };

    return (
        <div className='relative flex flex-col h-[90vh] bg-zinc-950 text-zinc-300 font-sans overflow-hidden'>
            <Button
                variant='ghost'
                onClick={() => router.back()}
                className='text-zinc-400 hover:text-white -ml-2 justify-start absolute top-0 left-0'
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
                        <div className='relative w-20 h-20 rounded-full overflow-hidden mb-4 opacity-75'>
                            <Image
                                src={
                                    agent.avatarUrl || "/placeholder-avatar.png"
                                }
                                alt={agent.name}
                                layout='fill'
                                className='object-cover'
                            />
                        </div>

                        <h2 className='text-xl font-semibold text-white mb-2'>
                            Meet {agent.name}, {agent.title}
                        </h2>
                        <p className='text-zinc-400 max-w-xl'>
                            {agent.description}
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
                                    placeholder={getPlaceholderText()}
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

                                    {/* --- Add message count and Send button --- */}
                                    <div className="flex items-center gap-2">
                                        {/* Only show count if user does NOT have an API key */}
                                        {!apiKeyExists && (
                                            <span className="text-xs text-zinc-500">
                                                {currentMessagesLeft} left
                                            </span>
                                        )}
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
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}