"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    getAgentsAction,
    deleteAgentAction,
    type Agent,
} from "@/action/agentActions";
import ProfileCard from "@/components/Agents/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
// --- 1. IMPORT ALERT DIALOG ---
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// ---
import {
    PlusCircle,
    Search,
    SlidersHorizontal,
    Edit,
    Trash2,
    Loader2,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function AgentsPage() {
    const [allAgents, setAllAgents] = useState<Agent[]>([]);
    const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    // --- 2. NEW STATE FOR DIALOG ---
    const [agentToStagedForDeletion, setAgentStagedForDeletion] = useState<
        string | null
    >(null);

    const { data: session, isPending: isSessionLoading } = useSession();
    const isAdmin = session?.user?.role === "admin";

    // --- Data Fetching (Unchanged) ---
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                setIsLoading(true);
                const result = await getAgentsAction();
                if (result.success) {
                    const sortedData = result.data.sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    );
                    setAllAgents(sortedData);
                    setFilteredAgents(sortedData);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load agents. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAgents();
    }, []);

    // --- Filtering and Sorting Logic (Unchanged) ---
    useEffect(() => {
        let processedAgents = [...allAgents];
        // ... (filter logic)
        setFilteredAgents(processedAgents);
    }, [searchTerm, sortOrder, allAgents]);

    // --- 3. RENAMED & UPDATED: Delete Handler ---
    // This is now called by the Dialog's "Confirm" button
    const handleConfirmDelete = async () => {
        if (!agentToStagedForDeletion) return;

        setIsDeleting(agentToStagedForDeletion); // Show loader
        setError(null);

        try {
            const result = await deleteAgentAction(agentToStagedForDeletion);
            if (result.success) {
                // Remove agent from state immediately
                setAllAgents((prev) =>
                    prev.filter(
                        (agent) => agent.id !== agentToStagedForDeletion
                    )
                );
                setFilteredAgents((prev) =>
                    prev.filter(
                        (agent) => agent.id !== agentToStagedForDeletion
                    )
                );
            } else {
                setError(result.error || "Failed to delete agent.");
            }
        } catch (err: any) {
            setError(
                err.message || "An unexpected error occurred during deletion."
            );
        } finally {
            setIsDeleting(null); // Hide loader
            setAgentStagedForDeletion(null); // Close the dialog
        }
    };

    return (
        <div className='p-4 md:p-8'>
            {/* --- 4. ADD THE ALERT DIALOG COMPONENT --- */}
            <AlertDialog
                open={!!agentToStagedForDeletion}
                onOpenChange={(open) => {
                    if (!open) {
                        setAgentStagedForDeletion(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the agent and all associated chat history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setAgentStagedForDeletion(null)}
                            disabled={!!isDeleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={!!isDeleting}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Agent"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* --- END ALERT DIALOG --- */}

            <Collapsible>
                {/* ... (Collapsible Header and Content for filters - Unchanged) ... */}
                <div className='mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
                    <h1 className='text-3xl font-bold'>Meet the Team</h1>
                    <div className='flex items-center gap-2'>
                        <CollapsibleTrigger asChild>
                            <Button variant='outline' size='icon'>
                                <SlidersHorizontal className='h-4 w-4' />
                            </Button>
                        </CollapsibleTrigger>
                        {!isSessionLoading && isAdmin && (
                            <Link href='/prompts/create' passHref>
                                <Button className='cursor-pointer'>
                                    Create Agent
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
                <CollapsibleContent>
                    <div className='mb-8 flex flex-col gap-4 md:flex-row animate-in fade-in-0 slide-in-from-top-4 duration-300'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                            <Input
                                placeholder='Search agents...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pl-10'
                            />
                        </div>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className='w-full md:w-[200px]'>
                                <SelectValue placeholder='Sort by' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='newest'>Newest</SelectItem>
                                <SelectItem value='oldest'>Oldest</SelectItem>
                                <SelectItem value='asc'>Name (A-Z)</SelectItem>
                                <SelectItem value='desc'>Name (Z-A)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* --- Agent Grid --- */}
            {isLoading && (
                <p className='col-span-full text-center text-muted-foreground'>
                    Loading agents...
                </p>
            )}

            {error && (
                <p className='col-span-full text-center text-red-500 font-medium'>
                    Error: {error}
                </p>
            )}

            {!isLoading && !error && (
                <div>
                    {filteredAgents.length > 0 ? (
                        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                            {filteredAgents.map((agent) => (
                                <div key={agent.id} className='relative group'>
                                    {!isSessionLoading && isAdmin && (
                                        <div className='absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            {/* Edit Button (Unchanged) */}
                                            <Link
                                                href={`/prompts/edit/${agent.id}`}
                                                passHref
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Button
                                                    size='icon'
                                                    variant='secondary'
                                                    className='h-8 w-8 cursor-pointer'
                                                >
                                                    <Edit className='h-4 w-4' />
                                                </Button>
                                            </Link>

                                            {/* --- 5. MODIFIED DELETE BUTTON --- */}
                                            <Button
                                                size='icon'
                                                variant='destructive'
                                                className='h-8 w-8 cursor-pointer'
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setAgentStagedForDeletion(
                                                        agent.id
                                                    ); // Open dialog
                                                }}
                                                disabled={!!isDeleting} // Disable all delete buttons if one is pending
                                            >
                                                {/* Loader removed from here */}
                                                <Trash2 className='h-4 w-4' />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Original Card Link */}
                                    <Link href={`/prompts/${agent.id}`}>
                                        <ProfileCard
                                            handle={agent.name
                                                .toLowerCase()
                                                .replace(/\s+/g, "")}
                                            status='Online'
                                            name={agent.name}
                                            title={agent.title}
                                            avatarUrl={agent.avatarUrl || ""}
                                            description={agent.description}
                                        />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-center text-muted-foreground col-span-full py-12'>
                            {allAgents.length === 0 ? (
                                <p>No agents have been created yet.</p>
                            ) : (
                                <p>No agents found matching your search.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
