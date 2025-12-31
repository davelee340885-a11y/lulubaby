import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-training",
    email: "training@example.com",
    name: "Training Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Training API", () => {
  describe("training.get", () => {
    it("should return training settings for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.training.get();
      
      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
    });

    it("should have default level values", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.training.get();
      
      expect(result).toBeDefined();
      // Check that level fields exist and have default values
      expect(result?.humorLevel).toBeDefined();
      expect(result?.friendlinessLevel).toBeDefined();
      expect(result?.formalityLevel).toBeDefined();
    });
  });

  describe("training.update", () => {
    it("should update training settings", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.training.update({
        humorLevel: 4,
        friendlinessLevel: 5,
        formalityLevel: 2,
        enthusiasmLevel: 4,
      });
      
      expect(result).toBeDefined();
      expect(result?.humorLevel).toBe(4);
      expect(result?.friendlinessLevel).toBe(5);
      expect(result?.formalityLevel).toBe(2);
      expect(result?.enthusiasmLevel).toBe(4);
    });

    it("should update custom instructions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.training.update({
        behaviorInstructions: "Always be helpful and friendly",
        prohibitedActions: "Never be rude",
      });
      
      expect(result).toBeDefined();
      expect(result?.behaviorInstructions).toBe("Always be helpful and friendly");
      expect(result?.prohibitedActions).toBe("Never be rude");
    });

    it("should update sales style settings", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.training.update({
        pushIntensity: 3,
        closingIntensity: 4,
        urgencyCreation: 2,
      });
      
      expect(result).toBeDefined();
      expect(result?.pushIntensity).toBe(3);
      expect(result?.closingIntensity).toBe(4);
      expect(result?.urgencyCreation).toBe(2);
    });
  });
});

describe("Superpowers API", () => {
  describe("superpowers.get", () => {
    it("should return superpowers settings for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.superpowers.get();
      
      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
    });

    it("should have default boolean values", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.superpowers.get();
      
      expect(result).toBeDefined();
      // Check that boolean fields exist
      expect(typeof result?.cloneAbility).toBe("boolean");
      expect(typeof result?.perfectMemory).toBe("boolean");
      expect(typeof result?.alwaysOnline).toBe("boolean");
    });
  });

  describe("superpowers.update", () => {
    it("should update superpower toggles", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.superpowers.update({
        instantResearch: true,
        globalComparison: true,
        needsPrediction: true,
      });
      
      expect(result).toBeDefined();
      expect(result?.instantResearch).toBe(true);
      expect(result?.globalComparison).toBe(true);
      expect(result?.needsPrediction).toBe(true);
    });

    it("should update superpower settings", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.superpowers.update({
        researchDepth: "deep",
        followUpIntensity: 4,
        persuasionStyle: "aggressive",
      });
      
      expect(result).toBeDefined();
      expect(result?.researchDepth).toBe("deep");
      expect(result?.followUpIntensity).toBe(4);
      expect(result?.persuasionStyle).toBe("aggressive");
    });

    it("should toggle superpowers on and off", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // Turn on
      let result = await caller.superpowers.update({
        emotionSense: true,
      });
      expect(result?.emotionSense).toBe(true);
      
      // Turn off
      result = await caller.superpowers.update({
        emotionSense: false,
      });
      expect(result?.emotionSense).toBe(false);
    });

    it("should update multiple categories at once", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.superpowers.update({
        // 超級大腦
        instantResearch: true,
        legalInterpretation: true,
        // 時間掌控
        cloneAbility: true,
        perfectMemory: true,
        // 預知未來
        riskWarning: true,
        // 全球視野
        multiLanguage: true,
        // 讀心術
        persuasionMaster: true,
      });
      
      expect(result).toBeDefined();
      expect(result?.instantResearch).toBe(true);
      expect(result?.legalInterpretation).toBe(true);
      expect(result?.cloneAbility).toBe(true);
      expect(result?.perfectMemory).toBe(true);
      expect(result?.riskWarning).toBe(true);
      expect(result?.multiLanguage).toBe(true);
      expect(result?.persuasionMaster).toBe(true);
    });
  });
});
