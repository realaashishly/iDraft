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
      <div className="**h-full flex min-h-[12rem]** items-center justify-center">
        <p className="text-sm text-zinc-500">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="**h-full w-full**">
      <Textarea
        className="h-full min-h-48 w-full resize-none border-zinc-700 bg-zinc-800 text-zinc-100"
        onChange={(e) => setNote(e.target.value)}
        placeholder="Type your notes here... They are saved automatically."
        value={note}
      />
    </div>
  );
}
