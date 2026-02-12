/**
 * BackgroundTaskContext - 全局背景任務管理器
 * 
 * 管理所有異步任務（YouTube 字幕提取、知識庫處理等），
 * 確保頁面切換時任務不會中斷或丟失。
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export type TaskStatus = "pending" | "running" | "success" | "error";

export interface BackgroundTask {
  id: string;
  type: "youtube-extract" | "knowledge-process" | "llm-fallback" | "other";
  label: string;
  status: TaskStatus;
  progress?: number; // 0-100
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface BackgroundTaskContextType {
  tasks: BackgroundTask[];
  addTask: (task: Omit<BackgroundTask, "createdAt">) => void;
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void;
  removeTask: (id: string) => void;
  getTask: (id: string) => BackgroundTask | undefined;
  getRunningTasks: () => BackgroundTask[];
  clearCompleted: () => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType | null>(null);

export function BackgroundTaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const tasksRef = useRef<BackgroundTask[]>([]);

  // Keep ref in sync for callbacks that capture stale closures
  tasksRef.current = tasks;

  const addTask = useCallback((task: Omit<BackgroundTask, "createdAt">) => {
    const newTask: BackgroundTask = {
      ...task,
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<BackgroundTask>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              ...(updates.status === "success" || updates.status === "error"
                ? { completedAt: new Date() }
                : {}),
            }
          : t
      )
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTask = useCallback(
    (id: string) => {
      return tasksRef.current.find((t) => t.id === id);
    },
    []
  );

  const getRunningTasks = useCallback(() => {
    return tasksRef.current.filter((t) => t.status === "running" || t.status === "pending");
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === "running" || t.status === "pending"));
  }, []);

  return (
    <BackgroundTaskContext.Provider
      value={{ tasks, addTask, updateTask, removeTask, getTask, getRunningTasks, clearCompleted }}
    >
      {children}
    </BackgroundTaskContext.Provider>
  );
}

export function useBackgroundTasks() {
  const ctx = useContext(BackgroundTaskContext);
  if (!ctx) throw new Error("useBackgroundTasks must be used within BackgroundTaskProvider");
  return ctx;
}
