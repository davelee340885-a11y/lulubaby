import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getWidgetSettings, upsertWidgetSettings, getPersonaByUserId, getPersonaById } from "./db";

export const widgetRouter = router({
  /** Get widget settings for the current user's persona */
  get: protectedProcedure.query(async ({ ctx }) => {
    const persona = await getPersonaByUserId(ctx.user.id);
    if (!persona) return null;
    const settings = await getWidgetSettings(persona.id);
    return settings || {
      personaId: persona.id,
      widgetEnabled: true,
      position: "bottom-right",
      size: "medium",
      bubbleSize: 60,
      showBubbleText: true,
      bubbleText: "需要幫助嗎？",
      autoOpen: false,
      autoOpenDelay: 5,
    };
  }),

  /** Save widget settings */
  save: protectedProcedure
    .input(z.object({
      widgetEnabled: z.boolean().optional(),
      position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).optional(),
      size: z.enum(["small", "medium", "large"]).optional(),
      bubbleSize: z.number().min(40).max(80).optional(),
      showBubbleText: z.boolean().optional(),
      bubbleText: z.string().max(50).optional(),
      autoOpen: z.boolean().optional(),
      autoOpenDelay: z.number().min(1).max(30).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const persona = await getPersonaByUserId(ctx.user.id);
      if (!persona) throw new Error("Persona not found");

      const result = await upsertWidgetSettings({
        personaId: persona.id,
        ...input,
      });
      return result;
    }),

  /** Public endpoint: get widget config by personaId (for widget.js to fetch) */
  getPublicConfig: publicProcedure
    .input(z.object({ personaId: z.number() }))
    .query(async ({ input }) => {
      const persona = await getPersonaById(input.personaId);
      if (!persona) return null;

      const settings = await getWidgetSettings(input.personaId);

      // Return merged config with persona styling info
      return {
        widgetEnabled: settings?.widgetEnabled ?? true,
        position: settings?.position ?? "bottom-right",
        size: settings?.size ?? "medium",
        bubbleSize: settings?.bubbleSize ?? 60,
        showBubbleText: settings?.showBubbleText ?? true,
        bubbleText: settings?.bubbleText ?? "需要幫助嗎？",
        autoOpen: settings?.autoOpen ?? false,
        autoOpenDelay: settings?.autoOpenDelay ?? 5,
        // Persona info for styling
        primaryColor: persona.primaryColor || "#3B82F6",
        agentName: persona.agentName || "AI助手",
        welcomeMessage: persona.welcomeMessage || "您好！有什麼可以幫您？",
      };
    }),
});
