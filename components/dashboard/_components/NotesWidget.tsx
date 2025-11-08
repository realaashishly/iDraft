// components/dashboard/_components/NotesWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="flex h-full min-h-[12rem] items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Textarea
        className="h-full min-h-48 w-full resize-none border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus-visible:ring-indigo-500"
        onChange={(e) => setNote(e.target.value)}
        placeholder="Type your notes here... They are saved automatically."
        value={note}
      />
    </div>
  );
}