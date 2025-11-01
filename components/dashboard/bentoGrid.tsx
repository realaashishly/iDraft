"use client"
import { useSession } from "@/lib/auth-client";

// Note: React component names should start with a capital letter (BentoGrid vs bentoGrid)
export default function BentoGrid() {

  const {data: session} = useSession();
  return (
    <div className="">
      {/* This is one bento box item.
        - bg-zinc-100: A light zinc for light mode
        - dark:bg-zinc-900: The "dark zinc" you requested for dark mode
        - rounded-lg: Gives it the typical rounded corners
        - p-6: Adds some internal padding
      */}
      <div className="rounded-lg bg-zinc-100 p-6 shadow-md dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome {(session?.user.name)?.split(" ")[0]}!
        </h2>
        <p className="mt-2 text-zinc-700 dark:text-zinc-300">
          Here is your welcome message inside a bento grid item.
        </p>
      </div>

      
    </div>
  );
}