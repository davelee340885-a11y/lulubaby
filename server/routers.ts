import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getPersonaByUserId, upsertPersona, getPersonaById,
  getKnowledgeBasesByUserId, createKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, getKnowledgeContentByUserId,
  getQuickButtonsByUserId, createQuickButton, updateQuickButton, deleteQuickButton,
  getConversationsBySession, createConversation, getUserById,
  getAnalyticsStats, getDailyStats, getPopularQuestions, getRecentConversations,
  getTrainingByUserId, upsertTraining,
  getSuperpowersByUserId, upsertSuperpowers,
  createOrGetSubscription, updateSubscription, getUsageSummary, checkMessageLimit, incrementMessageCount
} from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // AI Persona management
  persona: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getPersonaByUserId(ctx.user.id);
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        agentName: z.string().min(1).max(100),
        avatarUrl: z.string().optional().nullable(),
        welcomeMessage: z.string().optional().nullable(),
        systemPrompt: z.string().optional().nullable(),
        primaryColor: z.string().optional(),
        layoutStyle: z.enum(["minimal", "professional", "custom"]).optional(),
        backgroundImageUrl: z.string().optional().nullable(),
        profilePhotoUrl: z.string().optional().nullable(),
        tagline: z.string().optional().nullable(),
        suggestedQuestions: z.string().optional().nullable(),
        showQuickButtons: z.boolean().optional(),
        chatPlaceholder: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertPersona({
          userId: ctx.user.id,
          agentName: input.agentName,
          avatarUrl: input.avatarUrl ?? undefined,
          welcomeMessage: input.welcomeMessage ?? undefined,
          systemPrompt: input.systemPrompt ?? undefined,
          primaryColor: input.primaryColor,
          layoutStyle: input.layoutStyle,
          backgroundImageUrl: input.backgroundImageUrl ?? undefined,
          profilePhotoUrl: input.profilePhotoUrl ?? undefined,
          tagline: input.tagline ?? undefined,
          suggestedQuestions: input.suggestedQuestions ?? undefined,
          showQuickButtons: input.showQuickButtons,
          chatPlaceholder: input.chatPlaceholder ?? undefined,
        });
      }),
      
    getPublic: publicProcedure
      .input(z.object({ personaId: z.number() }))
      .query(async ({ input }) => {
        const persona = await getPersonaById(input.personaId);
        if (!persona) return null;
        
        const buttons = await getQuickButtonsByUserId(persona.userId);
        const activeButtons = buttons.filter(b => b.isActive);
        
        // Parse suggested questions from JSON string
        let suggestedQuestions: string[] = [];
        if (persona.suggestedQuestions) {
          try {
            suggestedQuestions = JSON.parse(persona.suggestedQuestions);
          } catch (e) {
            suggestedQuestions = [];
          }
        }
        
        return {
          id: persona.id,
          agentName: persona.agentName,
          avatarUrl: persona.avatarUrl,
          welcomeMessage: persona.welcomeMessage || "您好！我是您的專屬AI助手，請問有什麼可以幫您？",
          primaryColor: persona.primaryColor,
          layoutStyle: persona.layoutStyle,
          backgroundImageUrl: persona.backgroundImageUrl,
          profilePhotoUrl: persona.profilePhotoUrl,
          tagline: persona.tagline,
          suggestedQuestions,
          showQuickButtons: persona.showQuickButtons,
          chatPlaceholder: persona.chatPlaceholder,
          quickButtons: persona.showQuickButtons ? activeButtons.map(b => ({
            id: b.id,
            label: b.label,
            icon: b.icon,
            actionType: b.actionType as string,
            actionValue: b.actionValue,
          })) : [],
        };
      }),
  }),

  // Knowledge base management
  knowledge: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getKnowledgeBasesByUserId(ctx.user.id);
    }),
    
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileBuffer = Buffer.from(input.fileContent, "base64");
        const fileKey = `knowledge/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          fileSize: fileBuffer.length,
          mimeType: input.mimeType,
          status: "ready",
          content: fileBuffer.toString("utf-8").substring(0, 50000), // Store first 50k chars
        });
        
        return kb;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteKnowledgeBase(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Quick buttons management
  quickButtons: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getQuickButtonsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        label: z.string().min(1).max(100),
        icon: z.string().optional(),
        actionType: z.enum(["query", "link", "booking", "product", "profile", "company", "catalog", "contact", "faq", "custom"]),
        actionValue: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createQuickButton({
          userId: ctx.user.id,
          label: input.label,
          icon: input.icon ?? undefined,
          actionType: input.actionType,
          actionValue: input.actionValue ?? undefined,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().min(1).max(100).optional(),
        icon: z.string().optional(),
        actionType: z.enum(["query", "link", "booking", "product", "profile", "company", "catalog", "contact", "faq", "custom"]).optional(),
        actionValue: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateQuickButton(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteQuickButton(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Chat functionality
  chat: router({
    send: publicProcedure
      .input(z.object({
        personaId: z.number(),
        sessionId: z.string(),
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const persona = await getPersonaById(input.personaId);
        if (!persona) {
          throw new Error("Persona not found");
        }
        
        // Check message limit for the persona owner
        const limitCheck = await checkMessageLimit(persona.userId);
        if (!limitCheck.allowed) {
          const errorMessages: Record<string, string> = {
            daily_limit: "您今日的對話次數已達上限，請明天再試或升級您的計劃。",
            monthly_limit: "您本月的對話次數已達上限，請升級您的計劃以獲得更多對話次數。",
            storage_limit: "知識庫存儲空間已達上限。",
            file_count_limit: "知識庫文件數量已達上限。",
          };
          throw new Error(errorMessages[limitCheck.reason!] || "對話次數已達上限");
        }
        
        // Increment message count for usage tracking
        await incrementMessageCount(persona.userId, 500); // Estimate 500 tokens per message
        
        // Save user message
        await createConversation({
          personaId: input.personaId,
          sessionId: input.sessionId,
          role: "user",
          content: input.message,
        });
        
        // Get conversation history
        const history = await getConversationsBySession(input.personaId, input.sessionId);
        
        // Get knowledge base content
        const knowledgeContent = await getKnowledgeContentByUserId(persona.userId);
        
        // Build system prompt
        const systemPrompt = `你是${persona.agentName}，一個專業的AI助手。
${persona.systemPrompt || "請用友善、專業的方式回答用戶的問題。"}

${knowledgeContent ? `以下是你的專業知識庫內容，請優先根據這些內容回答問題：
---
${knowledgeContent.substring(0, 10000)}
---` : ""}

請用繁體中文回答，保持專業但親切的語氣。`;

        // Build messages for LLM
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
        ];
        
        // Add conversation history (last 10 messages)
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
        
        // Call LLM
        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0]?.message?.content;
        const aiMessage = typeof rawContent === 'string' ? rawContent : "抱歉，我暫時無法回答您的問題。";
        
        // Save AI response
        await createConversation({
          personaId: input.personaId,
          sessionId: input.sessionId,
          role: "assistant",
          content: aiMessage,
        });
        
        return { message: aiMessage };
      }),
    
    history: publicProcedure
      .input(z.object({
        personaId: z.number(),
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        return getConversationsBySession(input.personaId, input.sessionId);
      }),
  }),

  // AI Training management
  training: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const existing = await getTrainingByUserId(ctx.user.id);
      if (existing) return existing;
      // Create default training settings
      return upsertTraining({ userId: ctx.user.id });
    }),
    
    update: protectedProcedure
      .input(z.object({
        activePersonaTemplate: z.string().optional().nullable(),
        // 說話風格
        humorLevel: z.number().min(1).max(5).optional(),
        friendlinessLevel: z.number().min(1).max(5).optional(),
        formalityLevel: z.number().min(1).max(5).optional(),
        enthusiasmLevel: z.number().min(1).max(5).optional(),
        patienceLevel: z.number().min(1).max(5).optional(),
        empathyLevel: z.number().min(1).max(5).optional(),
        // 回應方式
        responseLength: z.number().min(1).max(5).optional(),
        responseDepth: z.number().min(1).max(5).optional(),
        exampleUsage: z.number().min(1).max(5).optional(),
        dataUsage: z.number().min(1).max(5).optional(),
        metaphorUsage: z.number().min(1).max(5).optional(),
        structuredResponse: z.number().min(1).max(5).optional(),
        // 溝通態度
        proactiveness: z.number().min(1).max(5).optional(),
        questioningStyle: z.number().min(1).max(5).optional(),
        suggestionFrequency: z.number().min(1).max(5).optional(),
        humilityLevel: z.number().min(1).max(5).optional(),
        persistenceLevel: z.number().min(1).max(5).optional(),
        careLevel: z.number().min(1).max(5).optional(),
        // 銷售風格
        pushIntensity: z.number().min(1).max(5).optional(),
        urgencyCreation: z.number().min(1).max(5).optional(),
        priceSensitivity: z.number().min(1).max(5).optional(),
        comparisonUsage: z.number().min(1).max(5).optional(),
        closingIntensity: z.number().min(1).max(5).optional(),
        followUpFrequency: z.number().min(1).max(5).optional(),
        // 專業表現
        terminologyUsage: z.number().min(1).max(5).optional(),
        regulationAwareness: z.number().min(1).max(5).optional(),
        riskWarningLevel: z.number().min(1).max(5).optional(),
        caseStudyUsage: z.number().min(1).max(5).optional(),
        marketAnalysis: z.number().min(1).max(5).optional(),
        educationalContent: z.number().min(1).max(5).optional(),
        // 情緒處理
        soothingAbility: z.number().min(1).max(5).optional(),
        praiseFrequency: z.number().min(1).max(5).optional(),
        encouragementLevel: z.number().min(1).max(5).optional(),
        negativeHandling: z.number().min(1).max(5).optional(),
        optimismLevel: z.number().min(1).max(5).optional(),
        humorInTension: z.number().min(1).max(5).optional(),
        // 語言習慣
        emojiUsage: z.number().min(1).max(5).optional(),
        colloquialLevel: z.number().min(1).max(5).optional(),
        cantoneseUsage: z.number().min(1).max(5).optional(),
        englishMixing: z.number().min(1).max(5).optional(),
        exclamationUsage: z.number().min(1).max(5).optional(),
        addressingStyle: z.number().min(1).max(5).optional(),
        // 服務邊界
        topicRange: z.number().min(1).max(5).optional(),
        privacyAwareness: z.number().min(1).max(5).optional(),
        promiseCaution: z.number().min(1).max(5).optional(),
        referralWillingness: z.number().min(1).max(5).optional(),
        uncertaintyHandling: z.number().min(1).max(5).optional(),
        complaintHandling: z.number().min(1).max(5).optional(),
        // 自訂指令
        behaviorInstructions: z.string().optional().nullable(),
        prohibitedActions: z.string().optional().nullable(),
        customGreeting: z.string().optional().nullable(),
        customClosing: z.string().optional().nullable(),
        customPhrases: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertTraining({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  // Superpowers management
  superpowers: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const existing = await getSuperpowersByUserId(ctx.user.id);
      if (existing) return existing;
      // Create default superpowers settings
      return upsertSuperpowers({ userId: ctx.user.id });
    }),
    
    update: protectedProcedure
      .input(z.object({
        // 超級大腦
        instantResearch: z.boolean().optional(),
        globalComparison: z.boolean().optional(),
        legalInterpretation: z.boolean().optional(),
        caseSearch: z.boolean().optional(),
        // 時間掌控
        cloneAbility: z.boolean().optional(),
        perfectMemory: z.boolean().optional(),
        alwaysOnline: z.boolean().optional(),
        instantReply: z.boolean().optional(),
        // 預知未來
        needsPrediction: z.boolean().optional(),
        riskWarning: z.boolean().optional(),
        bestTiming: z.boolean().optional(),
        // 全球視野
        marketRadar: z.boolean().optional(),
        multiLanguage: z.boolean().optional(),
        globalInfo: z.boolean().optional(),
        // 讀心術
        emotionSense: z.boolean().optional(),
        persuasionMaster: z.boolean().optional(),
        styleAdaptation: z.boolean().optional(),
        // 設定
        researchDepth: z.enum(["quick", "standard", "deep"]).optional(),
        followUpIntensity: z.number().min(1).max(5).optional(),
        persuasionStyle: z.enum(["gentle", "balanced", "aggressive"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertSuperpowers({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  // Subscription management
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return createOrGetSubscription(ctx.user.id);
    }),
    
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      return getUsageSummary(ctx.user.id);
    }),
    
    checkLimit: protectedProcedure.query(async ({ ctx }) => {
      return checkMessageLimit(ctx.user.id);
    }),
    
    // Note: Actual plan upgrade will be handled by Stripe webhook
    // This is just for testing/admin purposes
    updatePlan: protectedProcedure
      .input(z.object({
        plan: z.enum(["free", "basic", "premium"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return updateSubscription(ctx.user.id, {
          plan: input.plan,
          status: "active",
        });
      }),
  }),

  // Analytics
  analytics: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const persona = await getPersonaByUserId(ctx.user.id);
      if (!persona) {
        return {
          totalConversations: 0,
          totalSessions: 0,
          todayConversations: 0,
          weekConversations: 0,
        };
      }
      return getAnalyticsStats(persona.id);
    }),

    dailyStats: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(30).optional() }))
      .query(async ({ ctx, input }) => {
        const persona = await getPersonaByUserId(ctx.user.id);
        if (!persona) return [];
        return getDailyStats(persona.id, input.days || 7);
      }),

    popularQuestions: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional() }))
      .query(async ({ ctx, input }) => {
        const persona = await getPersonaByUserId(ctx.user.id);
        if (!persona) return [];
        return getPopularQuestions(persona.id, input.limit || 10);
      }),

    recentConversations: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional() }))
      .query(async ({ ctx, input }) => {
        const persona = await getPersonaByUserId(ctx.user.id);
        if (!persona) return [];
        return getRecentConversations(persona.id, input.limit || 10);
      }),
  }),
});

export type AppRouter = typeof appRouter;
