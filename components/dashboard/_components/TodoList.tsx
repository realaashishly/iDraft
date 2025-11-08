// components/dashboard/_components/TodoList.tsx
"use client";

import { CheckCircle2, Circle, ListTodo, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// Define the Task type
interface Task {
  id: number;
  text: string;
  isCompleted: boolean;
}

// --- localStorage and Default Setup ---
const LOCAL_STORAGE_KEY = "dashboardUserTodos";

// Define default tasks (used for SSR and if no localStorage data exists)
const defaultTasks: Task[] = [
  { id: 1, text: "Review recent assets", isCompleted: false },
  { id: 2, text: "Check prompt usage stats", isCompleted: true },
  { id: 3, text: "Plan next sprint tasks", isCompleted: false },
];
// ---

export default function TodoList() {
  const MAX_TASKS = 5;

  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [newTask, setNewTask] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // --- localStorage Effects ---

  // Effect 1: Load tasks from localStorage on component mount
  useEffect(() => {
    // This code only runs on the client, after hydration
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTasks) {
      try {
        // If tasks are found, parse and set them as the state
        setTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error("Error parsing tasks from localStorage", e);
        // If parsing fails, the defaultTasks state remains
      }
    }
    // Mark the component as mounted
    setIsMounted(true);
  }, []); // Empty dependency array [] means this runs only ONCE on mount

  // Effect 2: Save tasks to localStorage whenever 'tasks' state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isMounted]); // Dependency array: run this effect when 'tasks' or 'isMounted' changes

  // --- Task Handlers (Logic is unchanged) ---

  const addTask = () => {
    if (newTask.trim() !== "" && tasks.length < MAX_TASKS) {
      const task: Task = {
        id: Date.now(),
        text: newTask.trim(),
        isCompleted: false,
      };
      setTasks([...tasks, task]); // This state update will trigger Effect 2
      setNewTask("");
    }
  };

  const toggleComplete = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    ); // This state update will trigger Effect 2
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id)); // This state update will trigger Effect 2
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  // --- Render Logic (Unchanged) ---

  const pendingTasks = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <h3 className="mb-4 flex items-center text-lg font-semibold text-zinc-900 dark:text-white">
        <ListTodo className="mr-2 h-5 w-5 text-indigo-500 dark:text-indigo-400" />{" "}
        Daily Focus ({pendingTasks}/{MAX_TASKS})
      </h3>

      {/* Task Input */}
      <div className="mb-4 flex space-x-2">
        <input
          className="flex-1 rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
          disabled={tasks.length >= MAX_TASKS}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            tasks.length < MAX_TASKS
              ? "Add a new task..."
              : "Maximum tasks reached"
          }
          type="text"
          value={newTask}
        />
        <button
          className="rounded-lg border border-zinc-300 bg-white p-2 text-indigo-500 transition-colors hover:bg-zinc-100 hover:text-indigo-600 disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-400 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
          disabled={tasks.length >= MAX_TASKS || newTask.trim() === ""}
          onClick={addTask}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Task List */}
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <li
            className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            key={task.id}
          >
            {/* Make the main task area clickable for toggling */}
            <div
              className="flex min-w-0 flex-1 cursor-pointer items-center"
              onClick={() => toggleComplete(task.id)}
            >
              {/* Checkbox Icon */}
              {task.isCompleted ? (
                <CheckCircle2 className="mr-3 h-5 w-5 shrink-0 text-indigo-500 dark:text-indigo-400" />
              ) : (
                <Circle className="mr-3 h-5 w-5 shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
              )}

              {/* Task Text */}
              <span
                className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                  task.isCompleted
                    ? "text-zinc-400 line-through dark:text-zinc-500"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {task.text}
              </span>
            </div>

            {/* Delete Button */}
            <button
              className="ml-2 rounded-full p-1 text-zinc-400 opacity-0 transition-all hover:bg-zinc-200 hover:text-red-500 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-700"
              onClick={() => deleteTask(task.id)}
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <div className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No tasks for today.
          </div>
        )}
      </ul>
    </div>
  );
}