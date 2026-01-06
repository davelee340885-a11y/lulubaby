import { describe, it, expect, vi } from "vitest";

/**
 * Error Handling Tests
 * Tests for error handling utilities and patterns used in the application
 */

describe("Error Handling Utilities", () => {
  describe("Error Message Mapping", () => {
    // Helper function to map error messages (mirrors client-side logic)
    function mapErrorMessage(error: Error): string {
      const message = error.message.toLowerCase();
      
      if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
        return "網絡連接問題，請檢查您的網絡連接";
      }
      if (message.includes("timeout")) {
        return "請求超時，請稍後重試";
      }
      if (message.includes("unauthorized")) {
        return "登入已過期，請重新登入";
      }
      if (message.includes("forbidden")) {
        return "您沒有權限執行此操作";
      }
      if (message.includes("not found")) {
        return "找不到請求的資源";
      }
      if (message.includes("validation") || message.includes("invalid")) {
        return "輸入資料格式不正確，請檢查後重試";
      }
      if (message.includes("rate limit") || message.includes("too many")) {
        return "請求過於頻繁，請稍後重試";
      }
      
      return "操作失敗，請稍後重試";
    }

    it("should map network errors correctly", () => {
      const error = new Error("Failed to fetch");
      expect(mapErrorMessage(error)).toBe("網絡連接問題，請檢查您的網絡連接");
    });

    it("should map timeout errors correctly", () => {
      const error = new Error("Request timeout");
      expect(mapErrorMessage(error)).toBe("請求超時，請稍後重試");
    });

    it("should map unauthorized errors correctly", () => {
      const error = new Error("UNAUTHORIZED");
      expect(mapErrorMessage(error)).toBe("登入已過期，請重新登入");
    });

    it("should map forbidden errors correctly", () => {
      const error = new Error("FORBIDDEN");
      expect(mapErrorMessage(error)).toBe("您沒有權限執行此操作");
    });

    it("should map not found errors correctly", () => {
      const error = new Error("Resource not found");
      expect(mapErrorMessage(error)).toBe("找不到請求的資源");
    });

    it("should map validation errors correctly", () => {
      const error = new Error("Validation failed");
      expect(mapErrorMessage(error)).toBe("輸入資料格式不正確，請檢查後重試");
    });

    it("should map rate limit errors correctly", () => {
      const error = new Error("Too many requests");
      expect(mapErrorMessage(error)).toBe("請求過於頻繁，請稍後重試");
    });

    it("should return default message for unknown errors", () => {
      const error = new Error("Some unknown error");
      expect(mapErrorMessage(error)).toBe("操作失敗，請稍後重試");
    });
  });

  describe("Network Error Detection", () => {
    function isNetworkError(error: Error): boolean {
      return (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Network") ||
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      );
    }

    it("should detect fetch errors", () => {
      const error = new Error("Failed to fetch");
      expect(isNetworkError(error)).toBe(true);
    });

    it("should detect network errors", () => {
      const error = new Error("Network error occurred");
      expect(isNetworkError(error)).toBe(true);
    });

    it("should detect TypeError (common for network issues)", () => {
      const error = new TypeError("Cannot read property");
      expect(isNetworkError(error)).toBe(true);
    });

    it("should not detect regular errors as network errors", () => {
      const error = new Error("Some other error");
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("Error Retry Logic", () => {
    it("should retry failed operations", async () => {
      let attempts = 0;
      const maxRetries = 3;
      
      async function retryOperation<T>(
        operation: () => Promise<T>,
        retries: number = maxRetries
      ): Promise<T> {
        try {
          return await operation();
        } catch (error) {
          if (retries > 0) {
            return retryOperation(operation, retries - 1);
          }
          throw error;
        }
      }

      const failingOperation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return Promise.resolve("success");
      });

      const result = await retryOperation(failingOperation);
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should throw after max retries exceeded", async () => {
      const maxRetries = 3;
      
      async function retryOperation<T>(
        operation: () => Promise<T>,
        retries: number = maxRetries
      ): Promise<T> {
        try {
          return await operation();
        } catch (error) {
          if (retries > 0) {
            return retryOperation(operation, retries - 1);
          }
          throw error;
        }
      }

      const alwaysFailingOperation = vi.fn().mockRejectedValue(new Error("Permanent failure"));

      await expect(retryOperation(alwaysFailingOperation)).rejects.toThrow("Permanent failure");
      expect(alwaysFailingOperation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });
  });
});

describe("API Error Response Handling", () => {
  describe("tRPC Error Codes", () => {
    const errorCodeMessages: Record<string, string> = {
      UNAUTHORIZED: "請先登入",
      FORBIDDEN: "沒有權限",
      NOT_FOUND: "找不到資源",
      BAD_REQUEST: "請求格式錯誤",
      INTERNAL_SERVER_ERROR: "伺服器錯誤",
      TIMEOUT: "請求超時",
      TOO_MANY_REQUESTS: "請求過於頻繁",
    };

    it("should have appropriate messages for all error codes", () => {
      expect(Object.keys(errorCodeMessages).length).toBeGreaterThan(0);
      
      Object.values(errorCodeMessages).forEach(message => {
        expect(message).toBeTruthy();
        expect(typeof message).toBe("string");
      });
    });

    it("should map UNAUTHORIZED correctly", () => {
      expect(errorCodeMessages["UNAUTHORIZED"]).toBe("請先登入");
    });

    it("should map FORBIDDEN correctly", () => {
      expect(errorCodeMessages["FORBIDDEN"]).toBe("沒有權限");
    });
  });
});

describe("Form Validation Error Handling", () => {
  describe("Field Validation", () => {
    function validateField(value: string, rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    }): string | null {
      if (rules.required && !value.trim()) {
        return "此欄位為必填";
      }
      if (rules.minLength && value.length < rules.minLength) {
        return `最少需要 ${rules.minLength} 個字元`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `最多只能 ${rules.maxLength} 個字元`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return "格式不正確";
      }
      return null;
    }

    it("should validate required fields", () => {
      expect(validateField("", { required: true })).toBe("此欄位為必填");
      expect(validateField("  ", { required: true })).toBe("此欄位為必填");
      expect(validateField("value", { required: true })).toBeNull();
    });

    it("should validate minimum length", () => {
      expect(validateField("ab", { minLength: 3 })).toBe("最少需要 3 個字元");
      expect(validateField("abc", { minLength: 3 })).toBeNull();
    });

    it("should validate maximum length", () => {
      expect(validateField("abcdef", { maxLength: 5 })).toBe("最多只能 5 個字元");
      expect(validateField("abcde", { maxLength: 5 })).toBeNull();
    });

    it("should validate pattern", () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(validateField("invalid", { pattern: emailPattern })).toBe("格式不正確");
      expect(validateField("test@example.com", { pattern: emailPattern })).toBeNull();
    });
  });
});
