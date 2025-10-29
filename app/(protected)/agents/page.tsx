"use client";

import { useState, useEffect } from "react"; // Import useEffect
import Link from "next/link";
// import { agents as initialAgentsData } from "@/constant/agents"; // 1. Remove hardcoded data
import { getAgentsAction, type Agent } from "@/action/agentActions"; // 2. Import action and Agent type
import ProfileCard from "@/components/Agents/ProfileCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { useSession } from "@/lib/auth-client";

// 3. Remove local Agent interface (we imported the real one)
// interface Agent { id: string; ... }

export default function AgentsPage() {
    // 4. Update state to use fetched data
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true); // For data fetching
    const [error, setError] = useState<string | null>(null);
    
    const { data: session, isPending: isSessionLoading } = useSession();
    const isAdmin = session?.user?.role === 'admin';

    // 5. Add useEffect to fetch agents from the database
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                setIsLoading(true);
                const result = await getAgentsAction();

                if (result.success) {
                    setAgents(result.data);
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
    }, []); // Empty array means this runs once on component mount

    
    return (
        <div className='p-4'>
            <div className='mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
                <h1 className='text-3xl font-bold'>Meet the Team</h1>

                {/* Conditional Create Agent Link/Button */}
                {/* We use isSessionLoading here so the button doesn't flicker */}
                {!isSessionLoading && isAdmin && (
                    <Link href="/agents/create" passHref>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Agent
                        </Button>
                    </Link>
                )}
            </div>

            {/* 6. Update Agent Grid to use new loading/error states */}
            {isLoading && (
                <p className='col-span-full text-center text-muted-foreground'>Loading agents...</p>
            )}

            {error && (
                <p className='col-span-full text-center text-red-500 font-medium'>
                    Error: {error}
                </p>
            )}

            {!isLoading && !error && (
                <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {agents.length > 0 ? (
                        agents.map((agent) => (
                            <Link key={agent.id} href={`/agents/${agent.id}`}>
                                <ProfileCard
                                    handle={agent.name.toLowerCase().replace(/\s+/g, '')}
                                    status="Online" // You can update this later
                                    name={agent.name}
                                    title={agent.title}
                                    // Pass avatarUrl (or a fallback if it's null)
                                    avatarUrl={agent.avatarUrl || ""} 
                                    description={agent.description}
                                />
                            </Link>
                        ))
                    ) : (
                        <p className='col-span-full text-center text-muted-foreground'>
                            No agents have been created yet.
                        </p>
                    )}
                </div>
            )}
            
        </div>
    );
}