// components/dashboard/_components/TodoList.tsx
"use client";

import { useState } from "react";
import { 
    ListTodo, 
    Trash2, 
    Plus, 
    Circle, // Import for incomplete state
    CheckCircle2 // Import for complete state
} from "lucide-react";

// Define the Task type
interface Task {
    id: number;
    text: string;
    isCompleted: boolean;
}

export default function TodoList() {
    const MAX_TASKS = 5;
    
    // Initialize with some default tasks (optional)
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, text: "Review recent assets", isCompleted: false },
        { id: 2, text: "Check prompt usage stats", isCompleted: true },
        { id: 3, text: "Plan next sprint tasks", isCompleted: false },
    ]);
    const [newTask, setNewTask] = useState("");

    // --- Task Handlers (Logic is unchanged) ---

    const addTask = () => {
        if (newTask.trim() !== "" && tasks.length < MAX_TASKS) {
            const task: Task = {
                id: Date.now(),
                text: newTask.trim(),
                isCompleted: false,
            };
            setTasks([...tasks, task]);
            setNewTask("");
        }
    };

    const toggleComplete = (id: number) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
        ));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            addTask();
        }
    };
    
    // --- Render Logic ---

    const pendingTasks = tasks.filter(t => !t.isCompleted).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header: Unchanged */}
            <h3 className="flex items-center text-lg font-semibold text-white mb-4">
                <ListTodo className="h-5 w-5 mr-2 text-indigo-400" /> Daily Focus ({pendingTasks}/{MAX_TASKS})
            </h3>

            {/* Task Input: Restyled for a cleaner look */}
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={tasks.length < MAX_TASKS ? "Add a new task..." : "Maximum tasks reached"}
                    disabled={tasks.length >= MAX_TASKS}
                    // Use a subtle border, and a blue ring on focus
                    className="flex-1 p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                    onClick={addTask}
                    disabled={tasks.length >= MAX_TASKS || newTask.trim() === ""}
                    // Button is now subtle, matching the input field
                    className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-indigo-400 hover:bg-zinc-700 hover:text-indigo-300 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>
            
            {/* Task List: Removed padding and using space-y-2 for tighter spacing */}
            <ul className="space-y-2 overflow-y-auto flex-1">
                {tasks.map(task => (
                    <li
                        key={task.id}
                        // 'group' utility to show delete button on hover
                        // Removed border, using hover background for feedback
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        {/* Make the main task area clickable for toggling */}
                        <div 
                            className="flex items-center flex-1 cursor-pointer min-w-0"
                            onClick={() => toggleComplete(task.id)}
                        >
                            {/* New Checkbox Icon */}
                            {task.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 mr-3 text-indigo-400 flex-shrink-0" />
                            ) : (
                                <Circle className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                            )}
                            
                            {/* Task Text */}
                            <span 
                                className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                                task.isCompleted 
                                    ? 'text-zinc-500 line-through' 
                                    : 'text-zinc-100'
                            }`}
                            >
                                {task.text}
                            </span>
                        </div>
                        
                        {/* Delete Button: Now hidden until parent 'group' is hovered */}
                        <button
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                            // Starts invisible (opacity-0), becomes visible on group-hover
                            className="p-1 rounded-full text-zinc-500 hover:text-red-500 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all ml-2"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </li>
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-4 text-zinc-500 text-sm">
                        No tasks for today.
                    </div>
                )}
            </ul>
        </div>
    );
}