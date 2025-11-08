"use client";

import { useState, useEffect } from "react";

// The key for accessing the note in local storage
const LOCAL_STORAGE_KEY = "dashboardNote";

export default function SavedNoteDisplay() {
  // State to store the note content, starting as null (loading)
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs on the client after the component mounts.
    // We check for 'window' to ensure localStorage is available (it's client-side only).
    if (typeof window !== "undefined") {
      
      // 1. Set the initial note on component load
      const savedNote = localStorage.getItem(LOCAL_STORAGE_KEY);
      // Updated default text
      setNote(savedNote || "Your saved notes shown here."); 

      // 2. Define the handler for storage changes
      const handleStorageChange = (event: StorageEvent) => {
        // Check if the change was for the key we care about
        if (event.key === LOCAL_STORAGE_KEY) {
          // Update the state with the new value
          // If newValue is null (e.g., item removed), show the default text.
          // Updated default text
          setNote(event.newValue || "Your saved notes shown here.");
        }
      };

      // 3. Add the event listener to listen for real-time changes
      window.addEventListener("storage", handleStorageChange);

      // 4. Return a cleanup function to remove the listener when the component unmounts
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Display a loading message while the note is being fetched (note === null)
  if (note === null) {
    return (
      <div className="p-4">
        <p className="text-zinc-500 dark:text-zinc-400">Loading note...</p>
      </div>
    );
  }

  // Render the saved note
  return (
    <div className="flex h-full flex-col">
      <div className="h-full overflow-y-auto rounded-md px-3">
        {/* Using 'whitespace-pre-wrap' preserves any line breaks from the saved note */}
        <p className="text-sm text-zinc-700 whitespace-pre-wrap dark:text-zinc-300">
          {note}
        </p>
      </div>
    </div>
  );
}