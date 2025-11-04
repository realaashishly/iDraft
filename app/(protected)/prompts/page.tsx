"use client";

import { Edit, Loader2, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type Agent,
  deleteAgentAction,
  getAgentsAction,
} from "@/action/agentActions";
import ProfileCard from "@/components/Agents/ProfileCard";
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
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";

export default function AgentsPage() {
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [agentToStagedForDeletion, setAgentStagedForDeletion] = useState<
    string | null
  >(null);

  const { data: session, isPending: isSessionLoading } = useSession();
  // @ts-expect-error
  const isAdmin = session?.user?.role === "admin";

  // Fetch Initial Agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        const result = await getAgentsAction();
        if (result.success) {
          // Default sort: newest first
          const sortedData = result.data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllAgents(sortedData);
          setFilteredAgents(sortedData);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Failed to load agents. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  // Filter & Sort Agents
  useEffect(() => {
    let processedAgents = [...allAgents];

    if (searchTerm) {
      processedAgents = processedAgents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (sortOrder) {
      case "newest":
        processedAgents.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        processedAgents.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "asc":
        processedAgents.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "desc":
        processedAgents.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredAgents(processedAgents);
  }, [searchTerm, sortOrder, allAgents]);

  const handleConfirmDelete = async () => {
    if (!agentToStagedForDeletion) return;

    setIsDeleting(agentToStagedForDeletion);
    setError(null);

    try {
      const result = await deleteAgentAction(agentToStagedForDeletion);
      if (result.success) {
        // Optimistically update UI
        setAllAgents((prev) =>
          prev.filter((agent) => agent.id !== agentToStagedForDeletion)
        );
        setFilteredAgents((prev) =>
          prev.filter((agent) => agent.id !== agentToStagedForDeletion)
        );
      } else {
        setError(result.error || "Failed to delete agent.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during deletion.");
    } finally {
      setIsDeleting(null);
      setAgentStagedForDeletion(null); // Close the dialog
    }
  };

  return (
    <div className="p-4 md:p-8">
      <AlertDialog
        onOpenChange={(open) => {
          // Reset state if dialog is closed externally (e.g., overlay click)
          if (!open) {
            setAgentStagedForDeletion(null);
          }
        }}
        open={!!agentToStagedForDeletion}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent and all associated chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!isDeleting}
              onClick={() => setAgentStagedForDeletion(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Agent"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Collapsible>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h1 className="font-bold text-3xl">Meet the Team</h1>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button size="icon" variant="outline">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            {/* Admin Only: Create Agent Button */}
            {!isSessionLoading && isAdmin && (
              <Link href="/prompts/create" passHref>
                <Button className="cursor-pointer">Create Agent</Button>
              </Link>
            )}
          </div>
        </div>
        <CollapsibleContent>
          <div className="fade-in-0 slide-in-from-top-4 mb-8 flex animate-in flex-col gap-4 duration-300 md:flex-row">
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agents..."
                value={searchTerm}
              />
            </div>
            <Select onValueChange={setSortOrder} value={sortOrder}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="asc">Name (A-Z)</SelectItem>
                <SelectItem value="desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {isLoading && (
        <p className="col-span-full text-center text-muted-foreground">
          Loading agents...
        </p>
      )}

      {error && (
        <p className="col-span-full text-center font-medium text-red-500">
          Error: {error}
        </p>
      )}

      {!(isLoading || error) && (
        <div>
          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAgents.map((agent) => (
                <div className="group relative" key={agent.id}>
                  {/* Admin Controls */}
                  {!isSessionLoading && isAdmin && (
                    <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/prompts/edit/${agent.id}`}
                        onClick={(e) => e.stopPropagation()}
                        passHref
                      >
                        <Button
                          className="h-8 w-8 cursor-pointer"
                          size="icon"
                          variant="secondary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Delete Button (Triggers Dialog) */}
                      <Button
                        className="h-8 w-8 cursor-pointer"
                        // Disable all delete buttons if one is pending
                        disabled={!!isDeleting}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAgentStagedForDeletion(agent.id);
                        }}
                        size="icon"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <Link href={`/prompts/${agent.id}`}>
                    <ProfileCard
                      avatarUrl={agent.avatarUrl || ""}
                      description={agent.description}
                      handle={agent.name.toLowerCase().replace(/\s+/g, "")}
                      name={agent.name}
                      status="Online"
                      title={agent.title}
                    />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
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
