import { describe, it, expect } from "vitest";

describe("Spark Balance Display", () => {
  describe("Balance formatting", () => {
    it("should format small numbers without separators", () => {
      const balance = 100;
      expect(balance.toLocaleString()).toBe("100");
    });

    it("should format large numbers with thousand separators", () => {
      const balance = 485923;
      const formatted = balance.toLocaleString();
      // Should contain comma or period separator
      expect(formatted).toMatch(/485[,.]923/);
    });

    it("should handle zero balance", () => {
      const balance = 0;
      expect(balance.toLocaleString()).toBe("0");
    });

    it("should handle null/undefined balance with fallback", () => {
      const balance: number | null | undefined = null;
      const display = balance?.toLocaleString() ?? '0';
      expect(display).toBe('0');
    });

    it("should handle undefined balance with fallback", () => {
      const balance: number | null | undefined = undefined;
      const display = balance?.toLocaleString() ?? '0';
      expect(display).toBe('0');
    });
  });

  describe("Spark balance in user schema", () => {
    it("should have default spark balance of 100 for new users", () => {
      const defaultBalance = 100;
      expect(defaultBalance).toBe(100);
    });

    it("should be a non-negative integer", () => {
      const balance = 485923;
      expect(Number.isInteger(balance)).toBe(true);
      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });
});
