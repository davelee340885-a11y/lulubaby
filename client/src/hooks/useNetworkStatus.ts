import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to monitor network connectivity status
 * Shows toast notifications when connection is lost or restored
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      toast.success("網絡連接已恢復", {
        description: "您現在可以繼續使用所有功能",
        duration: 3000,
      });
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    toast.error("網絡連接已斷開", {
      description: "部分功能可能無法正常使用",
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}

/**
 * Hook to handle API errors with user-friendly messages
 */
export function useErrorHandler() {
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error("Error:", error);

    let message = customMessage || "操作失敗，請稍後重試";

    if (error instanceof Error) {
      // Network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch")
      ) {
        message = "網絡連接問題，請檢查您的網絡連接";
      }
      // Timeout errors
      else if (error.message.includes("timeout")) {
        message = "請求超時，請稍後重試";
      }
      // Authentication errors
      else if (
        error.message.includes("unauthorized") ||
        error.message.includes("UNAUTHORIZED")
      ) {
        message = "登入已過期，請重新登入";
      }
      // Permission errors
      else if (
        error.message.includes("forbidden") ||
        error.message.includes("FORBIDDEN")
      ) {
        message = "您沒有權限執行此操作";
      }
      // Not found errors
      else if (
        error.message.includes("not found") ||
        error.message.includes("NOT_FOUND")
      ) {
        message = "找不到請求的資源";
      }
      // Validation errors
      else if (
        error.message.includes("validation") ||
        error.message.includes("invalid")
      ) {
        message = "輸入資料格式不正確，請檢查後重試";
      }
      // Rate limit errors
      else if (
        error.message.includes("rate limit") ||
        error.message.includes("too many")
      ) {
        message = "請求過於頻繁，請稍後重試";
      }
    }

    toast.error(message);
    return message;
  }, []);

  return { handleError };
}

/**
 * Hook to show loading states with minimum duration
 * Prevents flash of loading state for fast operations
 */
export function useMinimumLoadingTime(minDuration: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setStartTime(Date.now());
  }, []);

  const stopLoading = useCallback(() => {
    if (startTime) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        setIsLoading(false);
        setStartTime(null);
      }, remaining);
    } else {
      setIsLoading(false);
    }
  }, [startTime, minDuration]);

  return { isLoading, startLoading, stopLoading };
}
