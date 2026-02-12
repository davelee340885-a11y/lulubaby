import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Widget Feature", () => {
  describe("widget_settings schema", () => {
    it("should have widget_settings table defined in schema", async () => {
      const schemaContent = fs.readFileSync(
        path.resolve(__dirname, "../drizzle/schema.ts"),
        "utf-8"
      );
      expect(schemaContent).toContain("widgetSettings");
      expect(schemaContent).toContain("widget_settings");
      expect(schemaContent).toContain("personaId");
      expect(schemaContent).toContain("widgetEnabled");
      expect(schemaContent).toContain("position");
      expect(schemaContent).toContain("bubbleSize");
      expect(schemaContent).toContain("showBubbleText");
      expect(schemaContent).toContain("bubbleText");
      expect(schemaContent).toContain("autoOpen");
      expect(schemaContent).toContain("autoOpenDelay");
    });

    it("should export WidgetSetting and InsertWidgetSetting types", async () => {
      const schemaContent = fs.readFileSync(
        path.resolve(__dirname, "../drizzle/schema.ts"),
        "utf-8"
      );
      expect(schemaContent).toContain("WidgetSetting");
      expect(schemaContent).toContain("InsertWidgetSetting");
    });
  });

  describe("widgetRouter", () => {
    it("should exist and export widgetRouter", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain("export const widgetRouter");
      expect(routerContent).toContain("router({");
    });

    it("should have get, save, and getPublicConfig procedures", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain("get:");
      expect(routerContent).toContain("save:");
      expect(routerContent).toContain("getPublicConfig:");
    });

    it("get should be a protected procedure", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain("get: protectedProcedure");
    });

    it("save should be a protected procedure with input validation", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain("save: protectedProcedure");
      expect(routerContent).toContain(".input(z.object(");
      expect(routerContent).toContain(".mutation(");
    });

    it("getPublicConfig should be a public procedure", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain("getPublicConfig: publicProcedure");
    });

    it("save should validate position enum values", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain("bottom-right");
      expect(routerContent).toContain("bottom-left");
      expect(routerContent).toContain("top-right");
      expect(routerContent).toContain("top-left");
    });

    it("save should validate size enum values", async () => {
      const routerContent = fs.readFileSync(
        path.resolve(__dirname, "./widgetRouter.ts"),
        "utf-8"
      );
      expect(routerContent).toContain('"small"');
      expect(routerContent).toContain('"medium"');
      expect(routerContent).toContain('"large"');
    });
  });

  describe("widget.js embed script", () => {
    it("should exist in client/public/", async () => {
      const widgetPath = path.resolve(__dirname, "../client/public/widget.js");
      expect(fs.existsSync(widgetPath)).toBe(true);
    });

    it("should contain init command handler", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/public/widget.js"),
        "utf-8"
      );
      expect(content).toContain("'init'");
      expect(content).toContain("agentId");
    });

    it("should fetch config from tRPC endpoint", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/public/widget.js"),
        "utf-8"
      );
      expect(content).toContain("widget.getPublicConfig");
      expect(content).toContain("/api/trpc/");
    });

    it("should create iframe pointing to /widget-client", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/public/widget.js"),
        "utf-8"
      );
      expect(content).toContain("/widget-client");
      expect(content).toContain("iframe");
    });

    it("should support open, close, toggle, and destroy commands", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/public/widget.js"),
        "utf-8"
      );
      expect(content).toContain("'open'");
      expect(content).toContain("'close'");
      expect(content).toContain("'toggle'");
      expect(content).toContain("'destroy'");
    });

    it("should use lulubaby.xyz as base URL", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/public/widget.js"),
        "utf-8"
      );
      expect(content).toContain("https://lulubaby.xyz");
    });
  });

  describe("WidgetClient page", () => {
    it("should exist as a page component", async () => {
      const widgetClientPath = path.resolve(__dirname, "../client/src/pages/WidgetClient.tsx");
      expect(fs.existsSync(widgetClientPath)).toBe(true);
    });

    it("should import CustomerChatClient", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/WidgetClient.tsx"),
        "utf-8"
      );
      expect(content).toContain("CustomerChatClient");
    });

    it("should extract agentId from URL query params", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/WidgetClient.tsx"),
        "utf-8"
      );
      expect(content).toContain("agentId");
      expect(content).toContain("URLSearchParams");
    });

    it("should handle missing agentId gracefully", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/WidgetClient.tsx"),
        "utf-8"
      );
      expect(content).toContain("Widget 配置錯誤");
    });
  });

  describe("Widget.tsx settings page", () => {
    it("should use trpc.widget.get for loading settings", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/Widget.tsx"),
        "utf-8"
      );
      expect(content).toContain("trpc.widget.get.useQuery");
    });

    it("should use trpc.widget.save for saving settings", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/Widget.tsx"),
        "utf-8"
      );
      expect(content).toContain("trpc.widget.save.useMutation");
    });

    it("should have tabs for overview, settings, and code", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/Widget.tsx"),
        "utf-8"
      );
      expect(content).toContain('"overview"');
      expect(content).toContain('"settings"');
      expect(content).toContain('"code"');
    });

    it("should generate embed code with agentId", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/Widget.tsx"),
        "utf-8"
      );
      expect(content).toContain("generateEmbedCode");
      expect(content).toContain("agentId");
      expect(content).toContain("widget.js");
    });

    it("should have a live preview section", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/pages/Widget.tsx"),
        "utf-8"
      );
      expect(content).toContain("即時預覽");
      expect(content).toContain("previewOpen");
    });
  });

  describe("routers.ts integration", () => {
    it("should import and mount widgetRouter", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "./routers.ts"),
        "utf-8"
      );
      expect(content).toContain('import { widgetRouter }');
      expect(content).toContain("widget: widgetRouter");
    });
  });

  describe("App.tsx routing", () => {
    it("should have /widget-client route", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain('/widget-client');
      expect(content).toContain("WidgetClient");
    });
  });

  describe("db.ts widget helpers", () => {
    it("should export getWidgetSettings function", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "./db.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function getWidgetSettings");
    });

    it("should export upsertWidgetSettings function", async () => {
      const content = fs.readFileSync(
        path.resolve(__dirname, "./db.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function upsertWidgetSettings");
    });
  });
});
