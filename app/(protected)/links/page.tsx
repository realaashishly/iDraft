"use client";

import {
    ArrowUpRight,
    Loader2,
    PlusCircle,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

import {
    getLinksAction,
    deleteLinkAction,
    type Link as LinkType,
} from "@/action/linkActions";
// --- MODIFICATION: Added session import ---
import { useSession } from "@/lib/auth-client"; // Assuming this is your auth hook path

// --- UI Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { AddLinkModal } from "@/components/test/AddTestModal";
import Link from "next/link";

export default function Page() {
    // --- State Management ---
    const [allLinks, setAllLinks] = useState<LinkType[]>([]);
    const [filteredLinks, setFilteredLinks] = useState<LinkType[]>([]);

    // List loading/error state
    const [isListLoading, setIsListLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Header state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState("newest");

    // --- MODIFICATION: Added session state ---
    const { data: session, isPending: isSessionLoading } = useSession();
    // @ts-expect-error - Assuming session.user.role might not be in the base type
    const isAdmin = session?.user?.role === "admin";

    // --- Data Loading ---
    const loadSavedLinks = useCallback(async () => {
        setIsListLoading(true);
        setListError(null);
        const result = await getLinksAction();
        if (result.success) {
            const sortedData = result.data.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );
            setAllLinks(sortedData);
            setFilteredLinks(sortedData);
        } else {
            setListError(result.error);
        }
        setIsListLoading(false);
    }, []);

    useEffect(() => {
        loadSavedLinks();
    }, [loadSavedLinks]);

    // --- Filter AND Sort links ---
    useEffect(() => {
        let processedLinks = [...allLinks];

        // 1. Apply Search Filter
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            processedLinks = processedLinks.filter(
                (link) =>
                    link.title.toLowerCase().includes(lowerCaseSearch) ||
                    link.description?.toLowerCase().includes(lowerCaseSearch) ||
                    link.url.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // 2. Apply Sorting
        switch (sortOrder) {
            case "newest":
                processedLinks.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
                break;
            case "oldest":
                processedLinks.sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                );
                break;
            case "asc":
                processedLinks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "desc":
                processedLinks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                break;
        }

        setFilteredLinks(processedLinks);
    }, [searchTerm, sortOrder, allLinks]);

    // --- Handlers ---
    const handleDeleteLink = async (id: string) => {
        setIsDeleting(id);
        setListError(null);
        const result = await deleteLinkAction(id);
        if (result.success) {
            await loadSavedLinks(); // Refresh the list
        } else {
            setListError(result.error);
        }
        setIsDeleting(null);
    };

    // --- Render ---
    return (
        <div className='w-full space-y-8 p-4 md:p-8 mx-auto'>
            {/* --- 1. MODIFIED HEADER (Now Collapsible) --- */}
            <Collapsible open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <header className='pb-4'>
                    {/* Header Row: Title and Action Buttons */}
                    <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
                        <h1 className='text-3xl font-bold'>Your Links</h1>

                        <div className='flex w-full md:w-auto items-center gap-2'>
                            {/* Filter/Sort Trigger */}
                            <CollapsibleTrigger asChild>
                                <Button variant='outline' size='icon'>
                                    <SlidersHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>
                                        Toggle Filters
                                    </span>
                                </Button>
                            </CollapsibleTrigger>

                            {/* --- MODIFICATION: Admin-Only Add Link Button --- */}
                            {!isSessionLoading && isAdmin && (
                                <Button onClick={() => setIsModalOpen(true)}>
                                    <PlusCircle className='mr-2 h-4 w-4' />
                                    Add Link
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Collapsible Content (Search and Sort) */}
                    <CollapsibleContent className='mt-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'>
                        <div className='flex flex-col md:flex-row gap-4'>
                            {/* Search Input */}
                            <div className='relative flex-1'>
                                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                <Input
                                    placeholder='Search links...'
                                    className='pl-10'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                            {/* Sort Dropdown */}
                            <Select
                                onValueChange={setSortOrder}
                                value={sortOrder}
                            >
                                <SelectTrigger className='w-full md:w-[200px]'>
                                    <SelectValue placeholder='Sort by' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='newest'>
                                        Newest
                                    </SelectItem>
                                    <SelectItem value='oldest'>
                                        Oldest
                                    </SelectItem>
                                    <SelectItem value='asc'>
                                        Title (A-Z)
                                    </SelectItem>
                                    <SelectItem value='desc'>
                                        Title (Z-A)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CollapsibleContent>
                </header>
            </Collapsible>

            {/* --- 2. ADD LINK MODAL (Unchanged) --- */}
            <AddLinkModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onLinkSaved={loadSavedLinks}
            />

            {/* --- 3. SAVED LINKS LIST --- */}
            <div className='space-y-4'>
                {isListLoading && (
                    <div className='flex items-center justify-center py-8 text-muted-foreground'>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Loading saved links...
                    </div>
                )}
                {listError && (
                    <p className='text-sm text-red-500'>{listError}</p>
                )}
                {!isListLoading && !listError && filteredLinks.length === 0 && (
                    <p className='text-muted-foreground text-center py-8'>
                        {allLinks.length === 0
                            ? "No links saved yet." // Simplified for non-admins
                            : "No links found matching your filters."}
                    </p>
                )}
                {/* --- The Grid --- */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {filteredLinks.map((link) => (
                        <div
                            key={link.id}
                            className='space-y-4 rounded-md border p-4 flex flex-col justify-between'
                        >
                            {/* Card Content... (omitted for brevity) */}
                            <div className='space-y-2'>
                                {link.imageUrl && (
                                    <div className='relative h-48 w-full overflow-hidden rounded-md'>
                                        <Image
                                            src={link.imageUrl}
                                            alt={`${link.title} Thumbnail`}
                                            layout='fill'
                                            objectFit='cover'
                                        />
                                    </div>
                                )}
                                <div className='flex justify-between items-center'>
                                    <div>
                                        <h4 className='font-semibold'>Title</h4>
                                        <p className='text-muted-foreground truncate'>
                                            {link.title}
                                        </p>
                                    </div>
                                    <Link href={link.url}>
                                        <ArrowUpRight className='h-5 w-5 text-zinc-500' />
                                    </Link>
                                </div>
                                <div>
                                    <h4 className='font-semibold'>
                                        Description
                                    </h4>
                                    <p className='text-muted-foreground text-sm line-clamp-3'>
                                        {link.description ||
                                            "No description found."}
                                    </p>
                                </div>
                                {/* <div>
                                    <h4 className='font-semibold'>Link</h4>
                                    <a
                                        href={link.url}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-blue-500 hover:underline break-all text-sm'
                                    >
                                        {link.url}
                                    </a>
                                </div> */}
                            </div>

                            {/* --- MODIFICATION: Admin-Only Delete Button --- */}
                            {!isSessionLoading && isAdmin && (
                                <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={() => handleDeleteLink(link.id)}
                                    disabled={isDeleting === link.id}
                                    className='w-full sm:w-auto mt-4'
                                >
                                    {isDeleting === link.id ? (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    ) : null}
                                    Delete
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
