// app/contexts/ActivityContext.tsx
"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// 1. Define the shape of your context data
interface ActivityContextType {
  timeSpent: number;
  clickCount: number;
  keyPressCount: number;
}

// 2. Create the context
// We provide a default value for autocomplete, but it's not used
const ActivityContext = createContext<ActivityContextType>({
  timeSpent: 0,
  clickCount: 0,
  keyPressCount: 0,
});

// 3. Create the Provider component
// This component will wrap your whole app
export function ActivityProvider({ children }: { children: ReactNode }) {
  const [timeSpent, setTimeSpent] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [keyPressCount, setKeyPressCount] = useState(0);

  // Effect for time spent timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prevTime) => prevTime + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Runs once when the app loads

  // Effect for event listeners (clicks and keys)
  useEffect(() => {
    const handleClick = () => {
      setClickCount((prev) => prev + 1);
    };
    const handleKeyPress = () => {
      setKeyPressCount((prev) => prev + 1);
    };

    // Add global event listeners
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []); // Runs once when the app loads

  // The value that will be shared with all components
  const value = {
    timeSpent,
    clickCount,
    keyPressCount,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

// 4. Create a custom hook for easy access
// This lets components get the data without extra imports
export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}
