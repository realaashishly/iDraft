// components/dashboard/_components/NotesWidget.tsx
"use client";

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

const LOCAL_STORAGE_KEY = "dashboardNote";

export default function NotesWidget() {
    const [note, setNote] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // 1. Load the saved note from localStorage (Unchanged)
    useEffect(() => {
        const savedNote = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedNote) {
            setNote(savedNote);
        }
        setIsLoading(false);
    }, []);

    // 2. Debounce and save the note to localStorage (Unchanged)
    useEffect(() => {
        if (isLoading) return;

        const saveTimer = setTimeout(() => {
            localStorage.setItem(LOCAL_STORAGE_KEY, note);
        }, 500);

        return () => {
            clearTimeout(saveTimer);
        };
    }, [note, isLoading]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center **h-full min-h-[12rem]**">
                <p className="text-zinc-500 text-sm">Loading notes...</p>
            </div>
        );
    }

    return (
        <div className="**h-full w-full**">
            <Textarea
                placeholder="Type your notes here... They are saved automatically."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-full w-full min-h-68 bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
            />
        </div>
    );
}