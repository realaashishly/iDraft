"use client";

import {
  ArrowLeft,
  BookMarked,
  ChevronDown,
  Key,
  Loader2,
  Paperclip,
  Send,
  Settings,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Textarea from "react-textarea-autosize";
import {
  generateAiContent,
  generateAiContentByUserAPI,
} from "@/action/aiResponse";
import {
  deleteAgentChatHistoryAction,
  getAgentChatHistoryAction,
  saveUserChatHistoryAction,
} from "@/action/chatActions";
import {
  decrementMessagesLeftAction,
  updateUserGeminiApiKeyAction,
} from "@/action/userActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import type {
  AIChatInterfaceProps,
  AiResponse,
  ChatMessageProps,
  HistoryMessage,
  MessagePayload,
} from "@/type/types";
import ChatMessage from "./ChatMessage";
import { MODELS } from "@/contants";

// --- Main Chat Interface Component ---
export default function AIChatInterface({ agent }: AIChatInterfaceProps) {
  // --- Initialization ---
  const router = useRouter();
  const { data: session } = useSession();

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
  // @ts-expect-error
  const userApiKey = session?.user.geminiApiKey;

  // --- Client-side state for reactive UI ---
  const [apiKeyExists, setApiKeyExists] = useState(
    userApiKey && userApiKey.trim() !== ""
  );
  const [currentMessagesLeft, setCurrentMessagesLeft] = useState(
    // @ts-expect-error
    session?.user?.messagesLeft ?? 0
  );

  // This state holds the *saved* key for display
  const [savedApiKey, setSavedApiKey] = useState(
    // @ts-expect-error
    session?.user.geminiApiKey || ""
  );

  useEffect(() => {
    if (session) {
      // @ts-expect-error
      const key = session.user.geminiApiKey;
      setApiKeyExists(key && key.trim() !== "");
      // @ts-expect-error
      setCurrentMessagesLeft(session.user.messagesLeft ?? 0);
      setSavedApiKey(key || "");
    }
  }, [session]);

  const canSendMessage = currentMessagesLeft > 0 || apiKeyExists;

  // Function to handle fetching and setting messages
  const fetchAndSetHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history: HistoryMessage[] = await getAgentChatHistoryAction(
        agent.id
      );

      const loadedMessages: ChatMessageProps[] = history.map((msg, index) => ({
        id: `${msg.role}-${index}-${Date.now()}`,
        sender: msg.role === "user" ? "user" : "ai",
        text: msg.content,
        fileName: msg.fileName,
        createdAt: msg.createdAt,
      }));

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
      !(canSendMessage && (trimmedInput || attachedFile)) ||
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
      let result: AiResponse;

      if (apiKeyExists) {
        // User has their own key. Do NOT decrement messages.
        console.log("Using user's API key.");
        result = await generateAiContentByUserAPI(
          trimmedInput,
          agent.systemInstructions,
          userMessage.fileName ? fileToSend : null
        );
      } else {
        // User does NOT have a key. Use the system key and plan to decrement.
        console.log("Using system API key.");
        result = await generateAiContent(
          trimmedInput,
          agent.systemInstructions,
          userMessage.fileName ? fileToSend : null
        );
      }

      // 3. Check for AI call failure
      if (!result.success) {
        throw new Error(
          result.error || "Server action failed without a specific error."
        );
      }

      // 4. AI call was SUCCESSFUL. Now decrement *only if* needed.
      if (!apiKeyExists) {
        console.log("AI success, decrementing message count.");
        const decrementResult = await decrementMessagesLeftAction();

        if (decrementResult.success) {
          setCurrentMessagesLeft((prevCount: number) => prevCount - 1);
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
          error.message || "An unexpected error occurred during processing."
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
  if (!(session?.user && agent)) {
    if (!agent) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-zinc-400">Agent data not found.</p>
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Please log in to access the chat.</p>
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
        const result = await updateUserGeminiApiKeyAction(trimmedApiKey);

        if (result.success) {
          setKeyStatus("✅ " + result.message);
          // --- Update client state ---
          setApiKeyExists(trimmedApiKey !== "");
          setSavedApiKey(trimmedApiKey);
          setApiKeyInput("");
        } else {
          setKeyStatus("❌ " + (result.message || "Failed to update key."));
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
        onOpenChange={(open) => {
          setIsSettingsModalOpen(open);
          if (!open) {
            setShowConfirmation(false);
            setKeyStatus(""); // Clear status when closing modal
            setApiKeyInput(""); // Clear input field on close
          }
        }}
        open={isSettingsModalOpen}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Agent Settings: {agent.name}</DialogTitle>
            <DialogDescription>
              Configure chat options and history management for this agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!showConfirmation && (
              <>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">
                    <Key className="h-4 w-4 text-blue-400" /> Set Gemini API Key
                  </label>
                  <div className="flex gap-2">
                    <Input
                      disabled={isUpdatingKey} // <-- Kept as password
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter new key (or blank to remove)" // <-- Use new input state
                      type="password"
                      value={apiKeyInput}
                    />
                    <Button
                      disabled={isUpdatingKey}
                      onClick={handleUpdateApiKey}
                    >
                      {isUpdatingKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>

                  {/* --- THIS IS THE NEWLY ADDED PART --- */}
                  {savedApiKey ? (
                    <p className="mt-2 text-xs text-zinc-400">
                      Current key:{" "}
                      <span className="font-mono">{savedApiKey}</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
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

                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">
                    <Zap className="h-4 w-4 text-primary" /> Change Model
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="w-full justify-between"
                        disabled={isSending}
                        variant="outline"
                      >
                        {selectedModelName}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[420px]">
                      <DropdownMenuRadioGroup
                        onValueChange={handleModelChange}
                        value={selectedModel}
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

                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <BookMarked className="h-4 w-4 text-primary" /> Save Current
                    Prompts
                  </span>
                  <Button disabled size="sm" variant="secondary">
                    Save (Coming Soon)
                  </Button>
                </div>

                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <h4 className="mb-4 flex items-center gap-2 font-semibold text-destructive text-sm">
                    <Trash2 className="h-4 w-4" /> Delete Chat History
                  </h4>
                  <Button
                    className="w-full"
                    onClick={() => setShowConfirmation(true)}
                    variant="destructive"
                  >
                    Delete All History
                  </Button>
                </div>
              </>
            )}

            {showConfirmation && (
              <div className="space-y-4 pt-4">
                <h4 className="flex items-center gap-2 font-bold text-destructive text-lg">
                  <Trash2 className="h-5 w-5" /> Are you sure?
                </h4>
                <p className="text-muted-foreground text-sm">
                  This action cannot be undone. All **
                  {messages.length}** messages with **
                  {agent.name}** will be permanently removed from the database.
                </p>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    disabled={isDeleting}
                    onClick={() => setShowConfirmation(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isDeleting}
                    onClick={handleDeleteHistory}
                    variant="destructive"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
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
                <Button variant="outline">Close</Button>
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
    <div className="relative flex h-[90vh] flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-300">
      <Button
        className="-ml-2 absolute top-0 left-0 justify-start text-zinc-400 hover:text-white"
        disabled={isSending || isLoadingHistory}
        onClick={() => router.back()}
        variant="ghost"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Agents
      </Button>
      {/* 1. Render the Modal */}
      <ChatSettingsModal />

      {/* Message List */}
      <div
        className="scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent md:scrollbar-default md:scrollbar-thumb-zinc-700 md:scrollbar-track-zinc-900 mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto p-4"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {/* Conditional Rendering: Loading, Welcome, or History */}
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading
            conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full opacity-75">
              <Image
                alt={agent.name}
                className="object-cover"
                layout="fill"
                src={agent.avatarUrl || "/placeholder-avatar.png"}
              />
            </div>

            <h2 className="mb-2 font-semibold text-white text-xl">
              Meet {agent.name}, {agent.title}
            </h2>
            <p className="max-w-xl text-zinc-400">{agent.description}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              agent={agent}
              key={msg.id}
              message={msg}
              session={session}
            />
          ))
        )}

        {isSending && (
          <div className="flex justify-start gap-3">
            <div
              className={
                "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
              }
            >
              <Image
                alt={agent.name}
                className="object-cover"
                height={32}
                src={agent.avatarUrl || "/placeholder-avatar.png"}
                width={32}
              />
            </div>
            <div
              className={
                "rounded-lg rounded-bl-none border border-zinc-700 bg-zinc-800 p-3 shadow-sm"
              }
            >
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area Container */}
      <div className="w-full shrink-0 bg-linear-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/0 px-4 pt-2 pb-4">
        <div className="mx-auto max-w-2xl">
          <div className="group relative">
            <form className="relative" onSubmit={handleSendMessage}>
              <input
                accept=".pdf,.doc,.docx,.txt,.csv,.json,.xml,.xlsx,.pptx,.html"
                className="hidden"
                disabled={!canSendMessage || isSending || isLoadingHistory}
                multiple={false}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
              <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-lg transition-all duration-300 focus-within:ring-1 focus-within:ring-zinc-500">
                <Textarea
                  className="max-h-[150px] min-h-[60px] w-full resize-none bg-transparent p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={!canSendMessage || isSending || isLoadingHistory}
                  maxRows={6}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder={getPlaceholderText()}
                  rows={1}
                  value={inputText}
                />
                {attachedFile && (
                  <div className="mx-3 mt-1 mb-2 flex items-center justify-between rounded-md border border-zinc-600 border-dashed bg-zinc-700/50 p-1.5 px-2 text-xs shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="h-3 w-3 shrink-0 text-zinc-400" />
                      <span className="truncate text-zinc-300">
                        {attachedFile.name}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        ({(attachedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      aria-label="Remove attached file"
                      className="h-5 w-5 rounded-full text-zinc-500 hover:bg-zinc-600/50 hover:text-red-400"
                      disabled={isSending || isLoadingHistory}
                      onClick={handleRemoveFile}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between border-zinc-700/60 border-t p-2">
                  <div className="flex items-center gap-1">
                    {/* Settings Button */}
                    <Button
                      aria-label="Chat settings"
                      className="h-8 w-8 shrink-0 rounded-full text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                      disabled={isSending || isLoadingHistory}
                      onClick={() => setIsSettingsModalOpen(true)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      aria-label="Attach file"
                      className="h-8 w-8 shrink-0 rounded-full text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                      disabled={
                        !canSendMessage || isSending || isLoadingHistory
                      }
                      onClick={handleFileAttachClick}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="flex h-8 shrink-0 items-center gap-1 rounded-md p-1 font-medium text-xs text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-100 focus-visible:ring-0 focus-visible:ring-offset-0"
                          disabled={isSending || isLoadingHistory}
                          variant="ghost"
                        >
                          <span className="max-w-20 truncate">
                            {selectedModelName}
                          </span>
                          <ChevronDown className="h-3 w-3 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-48 border-zinc-700 bg-zinc-900 text-zinc-200"
                        sideOffset={8}
                      >
                        <DropdownMenuRadioGroup
                          onValueChange={handleModelChange}
                          value={selectedModel}
                        >
                          {MODELS.map((model) => (
                            <DropdownMenuRadioItem
                              className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
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

                  {/* --- Add message count and Send button --- */}
                  <div className="flex items-center gap-2">
                    {/* Only show count if user does NOT have an API key */}
                    {!apiKeyExists && (
                      <span className="text-xs text-zinc-500">
                        {currentMessagesLeft} left
                      </span>
                    )}
                    <Button
                      aria-label="Send message"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-50 transition-opacity hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        !(
                          (inputText.trim() || attachedFile) &&
                          canSendMessage
                        ) ||
                        isSending ||
                        isLoadingHistory
                      }
                      type="submit"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
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
