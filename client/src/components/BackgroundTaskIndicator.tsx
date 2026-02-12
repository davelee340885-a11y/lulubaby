/**
 * BackgroundTaskIndicator - 全局背景任務狀態指示器
 * 
 * 在頁面頂部顯示正在運行或已完成的背景任務，
 * 讓用戶在任何頁面都能看到任務狀態。
 */

import { useBackgroundTasks, type BackgroundTask } from "@/contexts/BackgroundTaskContext";
import { Loader2, CheckCircle, XCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

function TaskBadge({ task, onDismiss }: { task: BackgroundTask; onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss completed/error tasks after 8 seconds
  useEffect(() => {
    if (task.status === "success" || task.status === "error") {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Wait for fade animation
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [task.status, onDismiss]);

  if (!visible) return null;

  const statusConfig = {
    pending: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-300",
    },
    running: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-300",
    },
    success: {
      icon: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
      bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
      text: "text-green-700 dark:text-green-300",
    },
    error: {
      icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-300",
    },
  };

  const config = statusConfig[task.status];
  const statusLabel = {
    pending: "等待中",
    running: "運作中",
    success: "已完成",
    error: "失敗",
  }[task.status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 ${config.bg} ${config.text} ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {config.icon}
      <span className="truncate max-w-[200px]">{task.label}</span>
      <span className="opacity-70">· {statusLabel}</span>
      {(task.status === "success" || task.status === "error") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-0.5 hover:opacity-100 opacity-60 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function BackgroundTaskIndicator() {
  const { tasks, removeTask, clearCompleted } = useBackgroundTasks();

  // Only show tasks that are running, pending, or recently completed
  const visibleTasks = tasks.filter(
    (t) =>
      t.status === "running" ||
      t.status === "pending" ||
      t.status === "success" ||
      t.status === "error"
  );

  if (visibleTasks.length === 0) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] flex flex-wrap items-center gap-2 justify-center max-w-[90vw]">
      {visibleTasks.map((task) => (
        <TaskBadge
          key={task.id}
          task={task}
          onDismiss={() => removeTask(task.id)}
        />
      ))}
    </div>
  );
}
