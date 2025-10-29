"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, File as FileIcon, X, UserCircle } from 'lucide-react';
import Image from "next/image"; // Import Image

// Updated interface to include title
interface NewAgentData {
    name: string;
    title: string; // <-- Added title
    description: string;
    systemInstructions: string;
    profileImage?: File | null;
    files?: File[];
}

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewAgentData) => Promise<void>;
}

export function CreateAgentModal({ isOpen, onClose, onSubmit }: CreateAgentModalProps) {
    const [name, setName] = useState("");
    const [title, setTitle] = useState(""); // <-- Added title state
    const [description, setDescription] = useState("");
    const [systemInstructions, setSystemInstructions] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const filesInputRef = useRef<HTMLInputElement>(null);

    const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
         event.target.value = '';
    };

     const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
         event.target.value = '';
    };

    const removeFile = (fileName: string) => {
        setFiles(prev => prev.filter(f => f.name !== fileName));
    }

    const clearForm = () => {
        setName("");
        setTitle(""); // <-- Clear title
        setDescription("");
        setSystemInstructions("");
        setProfileImage(null);
        setProfilePreview(null);
        setFiles([]);
        setError(null);
        setIsSubmitting(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData: NewAgentData = {
            name,
            title, // <-- Include title in form data
            description,
            systemInstructions,
            profileImage,
            files
        };

        try {
            await onSubmit(formData);
            clearForm();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create agent.");
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); clearForm(); } }}>
            <DialogContent className="sm:max-w-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create New Agent</DialogTitle>
                    <DialogDescription>
                        Fill in the details for your new AI agent.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="pr-1 pl-1 space-y-4 overflow-y-auto max-h-[70vh]"> {/* Added scroll for form */}
                     {/* Profile Image Upload */}
                    <div className="flex flex-col items-center gap-2 pt-2"> {/* Added pt-2 */}
                        <Label htmlFor="profile-image-upload">Profile Image</Label>
                        <div /* ... Profile Image Div ... */ onClick={() => profileInputRef.current?.click()} className="w-24 h-24 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/20 relative overflow-hidden group">
                            {profilePreview ? ( <Image src={profilePreview} alt="Profile preview" layout="fill" objectFit="cover" /> ) : ( <UserCircle className="w-12 h-12 text-muted-foreground" /> )}
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"> Change </div>
                        </div>
                        <input id="profile-image-upload" ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden"/>
                    </div>

                    {/* Agent Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="agent-name">Agent Name</Label>
                        <Input
                            id="agent-name" value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Marketing Assistant" required disabled={isSubmitting}
                        />
                    </div>

                    {/* --- Agent Title --- */}
                    <div className="space-y-1.5">
                        <Label htmlFor="agent-title">Title / Role</Label>
                        <Input
                            id="agent-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Content Strategist" // Example placeholder
                            required // Decide if title is required
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* --- End Agent Title --- */}


                    {/* Agent Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="agent-description">Description</Label>
                        <Textarea
                            id="agent-description" value={description} onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this agent do?" rows={3} required disabled={isSubmitting}
                        />
                    </div>

                    {/* System Instructions */}
                    <div className="space-y-1.5">
                        <Label htmlFor="system-instructions">System Instructions</Label>
                        <Textarea
                            id="system-instructions" value={systemInstructions} onChange={(e) => setSystemInstructions(e.target.value)}
                            placeholder="Provide guidelines, context, or rules for the AI..." rows={6} required disabled={isSubmitting}
                        />
                    </div>

                     {/* Optional File Upload */}
                     <div className="space-y-1.5">
                         <Label htmlFor="agent-files">Attach Files (Optional)</Label>
                         <div /* ... File Upload Div ... */ onClick={() => filesInputRef.current?.click()} className="border border-dashed border-muted-foreground/50 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/20" >
                             <UploadCloud className="w-8 h-8 text-muted-foreground mb-2"/>
                             <p className="text-sm text-muted-foreground">Click or drag files here</p>
                             <input id="agent-files" ref={filesInputRef} type="file" multiple onChange={handleFilesChange} className="hidden"/>
                         </div>
                         {files.length > 0 && (
                             <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                 {files.map(file => (
                                     <div key={file.name} className="text-xs p-1 px-2 border border-border rounded flex items-center justify-between bg-muted/50">
                                         <span className="truncate mr-2">{file.name}</span>
                                         <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file.name)}>
                                             <X className="h-3 w-3" />
                                         </Button>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                </form>

                <DialogFooter className="pt-4 flex-shrink-0">
                    <DialogClose asChild>
                        <Button variant="outline" onClick={clearForm} disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    {/* Trigger form submit via onClick */}
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !name || !title}> {/* Added title check */}
                        {isSubmitting ? "Creating..." : "Create Agent"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}