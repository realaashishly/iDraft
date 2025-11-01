import DashboardBentoGrid from "@/components/dashboard/bentoGrid";




/**
 * This is the page component that holds the bento grid.
 * It's responsible for the overall page layout.
 */
export default function DashboardPage() {
  return (
    // 1. Main container: full screen height, no scroll, flex layout
    <main className="flex h-screen w-full flex-col overflow-hidden">
      {/* You could add a header here, e.g., <DashboardHeader /> */}
      
      {/* 2. Grid container: tells the grid to take up all remaining space */}
      <div className="flex-1 overflow-hidden">
        {/* 3. The Bento Grid: h-full makes it fill its parent */}
        <DashboardBentoGrid />
      </div>
    </main>
  );
}