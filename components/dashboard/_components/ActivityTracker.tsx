// components/dashboard/_components/ActivityTracker.tsx
"use client";

import { useActivity } from '@/contexts/ActivityContext';
// 1. Remove useState and useEffect imports
import { Clock, MousePointerClick, Keyboard } from 'lucide-react';
// 2. Import your new useActivity hook

// Helper to format seconds into HH:MM:SS (unchanged)
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
};

export default function ActivityTracker() {
  // 3. Get all the state from your global context
  const { timeSpent, clickCount, keyPressCount } = useActivity();

  // 4. All useState and useEffect logic is GONE from this file!

  // 5. The render logic is exactly the same
  return (
    <div className="flex flex-col space-y-4">
      {/* Time Spent */}
      <div className="flex items-center">
        <Clock className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
        <div>
          <div 
            className="font-mono text-xl font-bold text-zinc-100"
            style={{ fontFeatureSettings: "'tnum' 1" }}
          >
            {formatTime(timeSpent)}
          </div>
          <p className="text-xs text-zinc-400">Time on Page</p>
        </div>
      </div>

      {/* Click Count */}
      <div className="flex items-center">
        <MousePointerClick className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
        <div>
          <div className="font-mono text-xl font-bold text-zinc-100">
            {clickCount}
          </div>
          <p className="text-xs text-zinc-400">Total Clicks</p>
        </div>
      </div>

      {/* Key Press Count */}
      <div className="flex items-center">
        <Keyboard className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
        <div>
          <div className="font-mono text-xl font-bold text-zinc-100">
            {keyPressCount}
          </div>
          <p className="text-xs text-zinc-400">Keystrokes</p>
        </div>
      </div>
    </div>
  );
}