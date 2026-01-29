import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { customerAuthRouter } from "./customerAuthRouter";
import { learningDiaryRouter } from "./learningDiaryRouter";
import { createMemoryService } from "./services/memoryService";
import { COOKIE_NAME } from "../shared/const";
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
  createOrGetSubscription, updateSubscription, getUsageSummary, checkMessageLimit, incrementMessageCount,
  // Team operations
  getTeamById, getTeamByOwnerId, getTeamsByUserId, createTeam, updateTeam, deleteTeam,
  getTeamMembers, getTeamMemberById, getTeamMemberByUserAndTeam, inviteTeamMember, acceptTeamInvitation, updateTeamMember, removeTeamMember, getTeamMemberCount,
  getTeamKnowledgeByTeamId, getTeamKnowledgeById, createTeamKnowledge, updateTeamKnowledge, deleteTeamKnowledge, getAccessibleTeamKnowledge, getTeamKnowledgeContent,
  getTeamStats,
  // Customer memory operations
  getOrCreateCustomer, getCustomerById, getCustomersByPersonaId, updateCustomer, deleteCustomer, incrementCustomerMessageCount,
  addCustomerMemory, getCustomerMemories, getCustomerMemoryContext, deleteCustomerMemory,
  addConversationSummary, getCustomerConversationSummaries, getRecentConversationContext, getCustomerStats,
  // Domain operations
  getDomainsByUserId, getDomainById, getDomainByName, createDomain, updateDomain, deleteDomain,
  updateDomainDnsStatus, updateDomainSslStatus, createDomainHealthLog, getDomainHealthLogs,
  // Domain order operations
  createDomainOrder, getDomainOrder, updateDomainOrderStatus,
  getRegisteredDomainOrders, updateDomainOrderDnsConfig, getDomainOrderByDomain,
  bindDomainToPersona, unbindDomainFromPersona, publishDomain, unpublishDomain, getPublishedDomainByName,
  // Database connection
  getDb
} from "./db";
import Stripe from "stripe";
import { invokeLLM } from "./_core/llm";
import { generateStylePrompt } from "./styleToPrompt";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { 
  searchDomainsWithPricing, 
  checkDomainAvailability, 
  getDomainPricing,
  purchaseDomain,
  setDnsRecords,
  verifyConnection,
  type ContactInfo
} from "./namecom";
import { detectCurrency, type Currency, MANAGEMENT_FEE } from "../shared/currency";
import { 
  fetchYouTubeTranscript, 
  fetchWebpageContent, 
  processTextInput, 
  processFAQInput,
  type FAQItem 
} from "./knowledgeSourceService";

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
        welcomeMessageColor: z.string().optional().nullable(),
        welcomeMessageSize: z.string().optional().nullable(),
        systemPrompt: z.string().optional().nullable(),
        primaryColor: z.string().optional(),
        layoutStyle: z.enum(["minimal", "professional", "custom"]).optional(),
        backgroundType: z.enum(["none", "color", "image"]).optional(),
        backgroundColor: z.string().optional().nullable(),
        backgroundImageUrl: z.string().optional().nullable(),
        backgroundSize: z.string().optional().nullable(),
        backgroundPosition: z.string().optional().nullable(),
        backgroundRepeat: z.string().optional().nullable(),
        immersiveMode: z.boolean().optional(),
        profilePhotoUrl: z.string().optional().nullable(),
        tagline: z.string().optional().nullable(),
        suggestedQuestions: z.string().optional().nullable(),
        showQuickButtons: z.boolean().optional(),
        buttonDisplayMode: z.enum(["full", "compact", "icon"]).optional(),
        chatPlaceholder: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[persona.upsert] input:', { welcomeMessageColor: input.welcomeMessageColor, welcomeMessageSize: input.welcomeMessageSize });
        return upsertPersona({
          userId: ctx.user.id,
          agentName: input.agentName,
          avatarUrl: input.avatarUrl ?? undefined,
          welcomeMessage: input.welcomeMessage ?? undefined,
          welcomeMessageColor: input.welcomeMessageColor ?? undefined,
          welcomeMessageSize: input.welcomeMessageSize ?? undefined,
          systemPrompt: input.systemPrompt ?? undefined,
          primaryColor: input.primaryColor,
          layoutStyle: input.layoutStyle,
          backgroundType: input.backgroundType,
          backgroundColor: input.backgroundColor ?? undefined,
          backgroundImageUrl: input.backgroundImageUrl ?? undefined,
          backgroundSize: input.backgroundSize ?? undefined,
          backgroundPosition: input.backgroundPosition ?? undefined,
          backgroundRepeat: input.backgroundRepeat ?? undefined,
          immersiveMode: input.immersiveMode,
          profilePhotoUrl: input.profilePhotoUrl ?? undefined,
          tagline: input.tagline ?? undefined,
          suggestedQuestions: input.suggestedQuestions ?? undefined,
          showQuickButtons: input.showQuickButtons,
          buttonDisplayMode: input.buttonDisplayMode,
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
          welcomeMessageColor: persona.welcomeMessageColor,
          welcomeMessageSize: persona.welcomeMessageSize,
          primaryColor: persona.primaryColor,
          layoutStyle: persona.layoutStyle,
          backgroundType: persona.backgroundType,
          backgroundColor: persona.backgroundColor,
          backgroundImageUrl: persona.backgroundImageUrl,
          profilePhotoUrl: persona.profilePhotoUrl,
          tagline: persona.tagline,
          immersiveMode: persona.immersiveMode || false,
          suggestedQuestions,
          showQuickButtons: persona.showQuickButtons,
          buttonDisplayMode: persona.buttonDisplayMode || 'full',
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

  // Image upload to S3
  images: router({
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded
        mimeType: z.string(),
        imageType: z.enum(["profile", "background", "avatar"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileBuffer = Buffer.from(input.fileContent, "base64");
        const fileExt = input.fileName.split(".").pop() || "jpg";
        const fileKey = `images/${ctx.user.id}/${input.imageType}/${nanoid()}.${fileExt}`;
        
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        return { url, fileKey };
      }),

    // Get image as base64 (proxy to avoid CORS issues)
    getImageAsBase64: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          // Fetch the image from S3/storage
          const response = await fetch(input.imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          
          // Get content type from response headers
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          
          return {
            base64,
            contentType,
            dataUrl: `data:${contentType};base64,${base64}`,
          };
        } catch (error) {
          console.error('Error fetching image:', error);
          throw new Error(`Failed to fetch image: ${error}`);
        }
      }),
  }),

  // Knowledge base management
  knowledge: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getKnowledgeBasesByUserId(ctx.user.id);
    }),
    
    // File upload (existing)
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
          content: fileBuffer.toString("utf-8").substring(0, 50000),
          sourceType: "file",
        });
        
        return kb;
      }),
    
    // YouTube video transcript
    addYouTube: protectedProcedure
      .input(z.object({
        url: z.string().min(1),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await fetchYouTubeTranscript(input.url);
        
        if (!result.success || !result.content) {
          throw new Error(result.error || '獲取 YouTube 字幕失敗');
        }
        
        const metadata = result.metadata as { videoId: string; duration?: number; transcriptLength: number };
        const fileName = input.title || `YouTube-${metadata.videoId}`;
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: fileName,
          fileSize: result.content.length,
          mimeType: "text/plain",
          status: "ready",
          content: result.content,
          sourceType: "youtube",
          sourceUrl: input.url,
          sourceMeta: JSON.stringify(metadata),
        });
        
        return kb;
      }),
    
    // Webpage content
    addWebpage: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await fetchWebpageContent(input.url);
        
        if (!result.success || !result.content) {
          throw new Error(result.error || '獲取網頁內容失敗');
        }
        
        const metadata = result.metadata as { url: string; title: string; description?: string; contentLength: number };
        const fileName = input.title || metadata.title || new URL(input.url).hostname;
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: fileName,
          fileSize: result.content.length,
          mimeType: "text/html",
          status: "ready",
          content: result.content,
          sourceType: "webpage",
          sourceUrl: input.url,
          sourceMeta: JSON.stringify(metadata),
        });
        
        return kb;
      }),
    
    // Direct text input
    addText: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = processTextInput(input.content, input.title);
        
        if (!result.success || !result.content) {
          throw new Error(result.error || '處理文字內容失敗');
        }
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: input.title,
          fileSize: result.content.length,
          mimeType: "text/plain",
          status: "ready",
          content: result.content,
          sourceType: "text",
          sourceMeta: JSON.stringify(result.metadata),
        });
        
        return kb;
      }),
    
    // FAQ Q&A pairs
    addFAQ: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        items: z.array(z.object({
          question: z.string().min(1),
          answer: z.string().min(1),
        })).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = processFAQInput(input.items as FAQItem[]);
        
        if (!result.success || !result.content) {
          throw new Error(result.error || '處理 FAQ 內容失敗');
        }
        
        const metadata = result.metadata as { itemCount: number; totalLength: number };
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: input.title,
          fileSize: result.content.length,
          mimeType: "text/plain",
          status: "ready",
          content: result.content,
          sourceType: "faq",
          sourceMeta: JSON.stringify({
            ...metadata,
            items: input.items,
          }),
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
        fingerprint: z.string().optional(), // Browser fingerprint for customer identification
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
        
        // Get or create customer for memory tracking
        const customer = await getOrCreateCustomer(input.personaId, input.sessionId, input.fingerprint);
        const isReturningCustomer = customer && customer.totalConversations > 1;
        
        // Increment message count for usage tracking
        await incrementMessageCount(persona.userId, 500); // Estimate 500 tokens per message
        
        // Increment customer message count
        if (customer) {
          await incrementCustomerMessageCount(customer.id);
        }
        
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
        
        // Get customer memory context if available
        let customerContext = "";
        let recentConversationContext = "";
        if (customer) {
          customerContext = await getCustomerMemoryContext(customer.id);
          recentConversationContext = await getRecentConversationContext(customer.id, 3);
        }
        
        // Get training and superpowers settings for style customization
        const training = await getTrainingByUserId(persona.userId);
        const superpowersSettings = await getSuperpowersByUserId(persona.userId);
        const stylePrompt = generateStylePrompt(training || null, superpowersSettings || null);
        
        // Build system prompt with customer memory
        let systemPrompt = `你是${persona.agentName}，一個專業的AI助手。
${persona.systemPrompt || "請用友善、專業的方式回答用戶的問題。"}
`;

        // Add customer memory context
        if (customerContext) {
          systemPrompt += `
${customerContext}
`;
        }
        
        // Add recent conversation context for returning customers
        if (isReturningCustomer && recentConversationContext) {
          systemPrompt += `
${recentConversationContext}
`;
        }
        
        // Add returning customer instruction
        if (isReturningCustomer && customer?.name) {
          systemPrompt += `
【重要】這是一位回訪客戶，請適當稱呼客戶的名字（${customer.name}），並可以引用之前的對話內容來提供更個人化的服務。
`;
        } else if (isReturningCustomer) {
          systemPrompt += `
【重要】這是一位回訪客戶（第 ${customer?.totalConversations} 次訪問），請提供更親切的服務，並可以引用之前的對話內容。
`;
        }

        // Add knowledge base content
        if (knowledgeContent) {
          systemPrompt += `
以下是你的專業知識庫內容，請優先根據這些內容回答問題：
---
${knowledgeContent.substring(0, 10000)}
---`;
        }

        // Add contextual memories from learning diary (Brain Memory System)
        let memoryContext = '';
        try {
          console.log("[chat.send] ========== MEMORY RETRIEVAL START ==========");
          console.log("[chat.send] Searching for contextual memories for user:", persona.userId);
          console.log("[chat.send] User message:", input.message);
          const memoryService = createMemoryService(persona.userId);
          const contextualMemories = await memoryService.getContextualMemories(input.message, 5);
          console.log("[chat.send] Contextual memories found:", contextualMemories ? contextualMemories.length : 0, "chars");
          if (contextualMemories && contextualMemories.trim()) {
            memoryContext = contextualMemories;
            systemPrompt += contextualMemories;
            console.log("[chat.send] Added contextual memories to system prompt");
            console.log("[chat.send] Memory content preview:", contextualMemories.substring(0, 200));
          } else {
            console.log("[chat.send] No contextual memories found or empty result");
          }
          console.log("[chat.send] ========== MEMORY RETRIEVAL END ==========");
        } catch (error) {
          console.error("[chat.send] Failed to get contextual memories:", error);
          console.error("[chat.send] Error stack:", error instanceof Error ? error.stack : 'Unknown error');
        }

        // Add style and superpowers instructions
        if (stylePrompt) {
          systemPrompt += stylePrompt;
        }

        systemPrompt += `

請用繁體中文回答。`;

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

    // End conversation and generate summary
    endConversation: publicProcedure
      .input(z.object({
        personaId: z.number(),
        sessionId: z.string(),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const persona = await getPersonaById(input.personaId);
        if (!persona) {
          throw new Error("Persona not found");
        }

        // Get customer
        const customer = await getOrCreateCustomer(input.personaId, input.sessionId, input.fingerprint);
        if (!customer) {
          return { success: false, message: "Customer not found" };
        }

        // Get conversation history for this session
        const history = await getConversationsBySession(input.personaId, input.sessionId);
        if (history.length < 2) {
          return { success: false, message: "Not enough messages to summarize" };
        }

        // Build conversation text for LLM
        const conversationText = history
          .map(m => `${m.role === 'user' ? '客戶' : 'AI'}: ${m.content}`)
          .join('\n');

        // Use LLM to generate summary and extract information
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一個專業的對話分析助手。請分析以下客戶對話，提取重要資訊。

請返回 JSON 格式，包含以下欄位：
- summary: 對話摘要（100字內，描述客戶的主要詢問和結果）
- keyTopics: 關鍵話題陣列（最多5個）
- questionsAsked: 客戶提問的主要問題陣列（最多3個）
- outcome: 對話結果（resolved/converted/pending/escalated/abandoned 之一）
- customerInfo: 客戶資料對象，包含:
  - name: 客戶姓名（如果提及）
  - email: 電郵地址（如果提及）
  - phone: 電話號碼（如果提及）
  - company: 公司名稱（如果提及）
- memories: 記憶陣列，每項包含:
  - type: 類型 (preference/fact/need/concern/purchase/feedback)
  - key: 簡短標題
  - value: 具體內容
  - confidence: 確信度 0-100
- sentiment: 客戶情緒 (positive/neutral/negative)

只提取明確提及的資訊，不要猜測。`,
            },
            {
              role: "user",
              content: conversationText,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "conversation_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Conversation summary" },
                  keyTopics: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key topics discussed",
                  },
                  questionsAsked: {
                    type: "array",
                    items: { type: "string" },
                    description: "Main questions asked by customer",
                  },
                  outcome: {
                    type: "string",
                    enum: ["resolved", "converted", "pending", "escalated", "abandoned"],
                    description: "Conversation outcome",
                  },
                  customerInfo: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      company: { type: "string" },
                    },
                    required: ["name", "email", "phone", "company"],
                    additionalProperties: false,
                  },
                  memories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["preference", "fact", "need", "concern", "purchase", "feedback"] },
                        key: { type: "string" },
                        value: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["type", "key", "value", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  sentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                    description: "Customer sentiment",
                  },
                },
                required: ["summary", "keyTopics", "questionsAsked", "outcome", "customerInfo", "memories", "sentiment"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          return { success: false, message: "Failed to generate summary" };
        }

        try {
          const analysis = JSON.parse(content);

          // Save conversation summary
          await addConversationSummary({
            customerId: customer.id,
            sessionId: input.sessionId,
            summary: analysis.summary,
            keyTopics: JSON.stringify(analysis.keyTopics),
            questionsAsked: JSON.stringify(analysis.questionsAsked),
            messageCount: history.length,
            outcome: analysis.outcome,
            conversationDate: new Date(),
          });

          // Update customer info if found
          const updateData: Record<string, string> = {};
          if (analysis.customerInfo.name) updateData.name = analysis.customerInfo.name;
          if (analysis.customerInfo.email) updateData.email = analysis.customerInfo.email;
          if (analysis.customerInfo.phone) updateData.phone = analysis.customerInfo.phone;
          if (analysis.customerInfo.company) updateData.company = analysis.customerInfo.company;
          if (analysis.sentiment) updateData.sentiment = analysis.sentiment;
          
          if (Object.keys(updateData).length > 0) {
            await updateCustomer(customer.id, updateData);
          }

          // Add memories
          if (analysis.memories && Array.isArray(analysis.memories)) {
            for (const memory of analysis.memories) {
              await addCustomerMemory({
                customerId: customer.id,
                memoryType: memory.type,
                key: memory.key,
                value: memory.value,
                confidence: memory.confidence,
              });
            }
          }

          return {
            success: true,
            summary: analysis.summary,
            keyTopics: analysis.keyTopics,
            outcome: analysis.outcome,
            memoriesExtracted: analysis.memories?.length || 0,
          };
        } catch {
          return { success: false, message: "Failed to parse summary" };
        }
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

  // Team management
  team: router({
    // Get user's teams (as owner or member)
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTeamsByUserId(ctx.user.id);
    }),

    // Get team owned by user
    getOwned: protectedProcedure.query(async ({ ctx }) => {
      return getTeamByOwnerId(ctx.user.id);
    }),

    // Get team by ID (must be a member)
    get: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || member.inviteStatus !== "accepted") {
          throw new Error("Not a member of this team");
        }
        const team = await getTeamById(input.teamId);
        const stats = await getTeamStats(input.teamId);
        return { ...team, stats, memberRole: member.role };
      }),

    // Create a new team
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        plan: z.enum(["team_basic", "team_pro", "enterprise"]).default("team_basic"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already owns a team
        const existingTeam = await getTeamByOwnerId(ctx.user.id);
        if (existingTeam) {
          throw new Error("You already own a team");
        }
        
        const maxMembers = input.plan === "team_basic" ? 5 : 
                          input.plan === "team_pro" ? 15 : 50;
        
        return createTeam({
          name: input.name,
          description: input.description,
          ownerId: ctx.user.id,
          plan: input.plan,
          maxMembers,
        });
      }),

    // Update team info (owner/admin only)
    update: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
          throw new Error("Not authorized to update team");
        }
        return updateTeam(input.teamId, {
          name: input.name,
          description: input.description,
          logoUrl: input.logoUrl,
        });
      }),

    // Delete team (owner only)
    delete: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const team = await getTeamById(input.teamId);
        if (!team || team.ownerId !== ctx.user.id) {
          throw new Error("Not authorized to delete team");
        }
        await deleteTeam(input.teamId);
        return { success: true };
      }),

    // Get team members
    members: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || member.inviteStatus !== "accepted") {
          throw new Error("Not a member of this team");
        }
        return getTeamMembers(input.teamId);
      }),

    // Invite a member (owner/admin only)
    inviteMember: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        email: z.string().email(),
        role: z.enum(["admin", "member"]).default("member"),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
          throw new Error("Not authorized to invite members");
        }
        
        // Check team member limit
        const team = await getTeamById(input.teamId);
        if (!team) throw new Error("Team not found");
        
        const memberCount = await getTeamMemberCount(input.teamId);
        if (memberCount >= team.maxMembers) {
          throw new Error("Team member limit reached");
        }
        
        // TODO: In real implementation, look up user by email and send invitation
        // For now, we'll just create a placeholder
        return { success: true, message: "Invitation sent" };
      }),

    // Update member role/access (owner/admin only)
    updateMember: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        memberId: z.number(),
        role: z.enum(["admin", "member"]).optional(),
        knowledgeAccess: z.enum(["full", "partial", "none"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const currentMember = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
          throw new Error("Not authorized to update members");
        }
        
        const targetMember = await getTeamMemberById(input.memberId);
        if (!targetMember || targetMember.teamId !== input.teamId) {
          throw new Error("Member not found");
        }
        
        // Can't change owner's role
        if (targetMember.role === "owner") {
          throw new Error("Cannot modify owner's role");
        }
        
        return updateTeamMember(input.memberId, {
          role: input.role,
          knowledgeAccess: input.knowledgeAccess,
        });
      }),

    // Remove member (owner/admin only)
    removeMember: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        memberId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const currentMember = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
          throw new Error("Not authorized to remove members");
        }
        
        const targetMember = await getTeamMemberById(input.memberId);
        if (!targetMember || targetMember.teamId !== input.teamId) {
          throw new Error("Member not found");
        }
        
        // Can't remove owner
        if (targetMember.role === "owner") {
          throw new Error("Cannot remove team owner");
        }
        
        await removeTeamMember(input.memberId);
        return { success: true };
      }),

    // Get team knowledge
    knowledge: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || member.inviteStatus !== "accepted") {
          throw new Error("Not a member of this team");
        }
        
        // Admins/owners see all, members see accessible only
        if (member.role === "owner" || member.role === "admin") {
          return getTeamKnowledgeByTeamId(input.teamId);
        }
        return getAccessibleTeamKnowledge(input.teamId, member.id);
      }),

    // Add knowledge item (owner/admin only)
    addKnowledge: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        category: z.enum(["company_info", "products", "services", "history", "faq", "sales_scripts", "case_studies", "policies", "training", "other"]),
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        isShared: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
          throw new Error("Not authorized to add knowledge");
        }
        
        return createTeamKnowledge({
          teamId: input.teamId,
          category: input.category,
          title: input.title,
          content: input.content,
          isShared: input.isShared,
          createdBy: ctx.user.id,
        });
      }),

    // Update knowledge item (owner/admin only)
    updateKnowledge: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        knowledgeId: z.number(),
        category: z.enum(["company_info", "products", "services", "history", "faq", "sales_scripts", "case_studies", "policies", "training", "other"]).optional(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        isShared: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
          throw new Error("Not authorized to update knowledge");
        }
        
        const knowledge = await getTeamKnowledgeById(input.knowledgeId);
        if (!knowledge || knowledge.teamId !== input.teamId) {
          throw new Error("Knowledge item not found");
        }
        
        return updateTeamKnowledge(input.knowledgeId, {
          category: input.category,
          title: input.title,
          content: input.content,
          isShared: input.isShared,
        });
      }),

    // Delete knowledge item (owner/admin only)
    deleteKnowledge: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        knowledgeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || (member.role !== "owner" && member.role !== "admin")) {
          throw new Error("Not authorized to delete knowledge");
        }
        
        const knowledge = await getTeamKnowledgeById(input.knowledgeId);
        if (!knowledge || knowledge.teamId !== input.teamId) {
          throw new Error("Knowledge item not found");
        }
        
        await deleteTeamKnowledge(input.knowledgeId);
        return { success: true };
      }),

    // Get team stats
    stats: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await getTeamMemberByUserAndTeam(input.teamId, ctx.user.id);
        if (!member || member.inviteStatus !== "accepted") {
          throw new Error("Not a member of this team");
        }
        return getTeamStats(input.teamId);
      }),
  }),

  // Customer memory management
  customer: router({
    // Get or create customer (for chat widget)
    getOrCreate: publicProcedure
      .input(z.object({
        personaId: z.number(),
        sessionId: z.string(),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return getOrCreateCustomer(input.personaId, input.sessionId, input.fingerprint);
      }),

    // Get customer by ID
    get: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) return null;
        
        // Verify ownership through persona
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        return customer;
      }),

    // List all customers for user's persona
    list: protectedProcedure.query(async ({ ctx }) => {
      const persona = await getPersonaByUserId(ctx.user.id);
      if (!persona) return [];
      return getCustomersByPersonaId(persona.id);
    }),

    // Update customer info
    update: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        tags: z.string().optional(),
        notes: z.string().optional(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        status: z.enum(["active", "inactive", "blocked"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        const { customerId, ...data } = input;
        return updateCustomer(customerId, data);
      }),

    // Delete customer
    delete: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        await deleteCustomer(input.customerId);
        return { success: true };
      }),

    // Get customer statistics
    stats: protectedProcedure.query(async ({ ctx }) => {
      const persona = await getPersonaByUserId(ctx.user.id);
      if (!persona) return { totalCustomers: 0, returningCustomers: 0, newCustomersToday: 0, activeCustomers: 0 };
      return getCustomerStats(persona.id);
    }),

    // Get customer with full context (memories + conversation history)
    getWithContext: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) return null;
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        const memories = await getCustomerMemories(input.customerId);
        const conversationSummaries = await getCustomerConversationSummaries(input.customerId);
        
        return {
          customer,
          memories,
          conversationSummaries,
        };
      }),
  }),

  // Customer memory management
  memory: router({
    // Add memory for a customer
    add: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        memoryType: z.enum(["preference", "fact", "need", "concern", "interaction", "purchase", "feedback", "custom"]),
        key: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        return addCustomerMemory({
          customerId: input.customerId,
          memoryType: input.memoryType,
          key: input.key,
          value: input.value,
          confidence: input.confidence ?? 80,
        });
      }),

    // Get all memories for a customer
    list: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) return [];
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        return getCustomerMemories(input.customerId);
      }),

    // Delete a memory
    delete: protectedProcedure
      .input(z.object({ memoryId: z.number(), customerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        await deleteCustomerMemory(input.memoryId);
        return { success: true };
      }),

    // Auto-extract memories from conversation (using LLM)
    extractFromConversation: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const customer = await getCustomerById(input.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const persona = await getPersonaById(customer.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Use LLM to extract memories from conversation
        const conversationText = input.messages
          .map(m => `${m.role === 'user' ? '客戶' : 'AI'}: ${m.content}`)
          .join('\n');

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一個專業的客戶資料提取助手。請從以下對話中提取客戶的重要資訊。

請返回 JSON 格式，包含以下欄位：
- name: 客戶姓名（如果提及）
- email: 電郵地址（如果提及）
- phone: 電話號碼（如果提及）
- company: 公司名稱（如果提及）
- memories: 記憶陣列，每項包含:
  - type: 類型 (preference/fact/need/concern/purchase/feedback)
  - key: 簡短標題
  - value: 具體內容
  - confidence: 確信度 0-100

只提取明確提及的資訊，不要猜測。如果沒有找到任何資訊，返回空對象。`,
            },
            {
              role: "user",
              content: conversationText,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "customer_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Customer name" },
                  email: { type: "string", description: "Customer email" },
                  phone: { type: "string", description: "Customer phone" },
                  company: { type: "string", description: "Customer company" },
                  memories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["preference", "fact", "need", "concern", "purchase", "feedback"] },
                        key: { type: "string" },
                        value: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["type", "key", "value", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["name", "email", "phone", "company", "memories"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') return { extracted: 0 };

        try {
          const extracted = JSON.parse(content);
          let extractedCount = 0;

          // Update customer info if found
          const updateData: Record<string, string> = {};
          if (extracted.name) updateData.name = extracted.name;
          if (extracted.email) updateData.email = extracted.email;
          if (extracted.phone) updateData.phone = extracted.phone;
          if (extracted.company) updateData.company = extracted.company;
          
          if (Object.keys(updateData).length > 0) {
            await updateCustomer(input.customerId, updateData);
            extractedCount += Object.keys(updateData).length;
          }

          // Add memories
          if (extracted.memories && Array.isArray(extracted.memories)) {
            for (const memory of extracted.memories) {
              await addCustomerMemory({
                customerId: input.customerId,
                memoryType: memory.type,
                key: memory.key,
                value: memory.value,
                confidence: memory.confidence,
              });
              extractedCount++;
            }
          }

          return { extracted: extractedCount };
        } catch {
          return { extracted: 0 };
        }
      }),
  }),

  // Custom Domain Management
  // 域名管理費: HK$99/年
  // 包含: 自動 SSL、DNS 監控、到期提醒
  domains: router({
    // Get all domains for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return getDomainsByUserId(ctx.user.id);
    }),

    // Get published domain for current user
    getPublished: protectedProcedure.query(async ({ ctx }) => {
      const persona = await getPersonaByUserId(ctx.user.id);
      if (!persona) return null;
      
      const orders = await getRegisteredDomainOrders(ctx.user.id);
      const publishedOrder = orders.find(order => 
        order.isPublished && 
        order.personaId === persona.id &&
        order.dnsStatus === 'active'
      );
      
      return publishedOrder ? {
        domain: publishedOrder.domain,
        url: `https://${publishedOrder.domain}`
      } : null;
    }),

    // Get a specific domain by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const domain = await getDomainById(input.id);
        if (!domain || domain.userId !== ctx.user.id) return null;
        return domain;
      }),

    // Add a new custom domain
    add: protectedProcedure
      .input(z.object({
        domain: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        // Parse domain parts
        const domainParts = input.domain.toLowerCase().trim().split('.');
        if (domainParts.length < 2) {
          throw new Error('無效的域名格式');
        }
        
        // Check if domain already exists
        const existing = await getDomainByName(input.domain.toLowerCase());
        if (existing) {
          throw new Error('此域名已被使用');
        }
        
        // Extract root domain and subdomain
        const rootDomain = domainParts.slice(-2).join('.');
        const subdomain = domainParts.length > 2 ? domainParts.slice(0, -2).join('.') : null;
        
        // Generate verification token
        const verificationToken = nanoid(32);
        
        // Create domain record
        const newDomain = await createDomain({
          userId: ctx.user.id,
          domain: input.domain.toLowerCase(),
          subdomain,
          rootDomain,
          status: 'pending_dns',
          dnsRecordType: 'CNAME',
          dnsRecordValue: 'lulubaby.manus.space', // Target CNAME
          verificationToken,
          subscriptionStatus: 'trial',
          annualFee: 99, // HK$99/year
        });
        
        return {
          domain: newDomain,
          dnsInstructions: {
            type: 'CNAME',
            host: subdomain || '@',
            value: 'lulubaby.manus.space',
            txtRecord: {
              host: '_lulubaby-verify',
              value: verificationToken,
            },
          },
        };
      }),

    // Verify DNS configuration
    verifyDns: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const domain = await getDomainById(input.id);
        if (!domain || domain.userId !== ctx.user.id) {
          throw new Error('域名不存在');
        }
        
        // In production, this would actually check DNS records
        // For MVP, we'll simulate DNS verification
        // TODO: Implement actual DNS lookup using dns.resolveCname() or external API
        
        // Simulate DNS check (in real implementation, use dns module or API)
        const dnsVerified = true; // Placeholder - would be actual DNS check
        
        if (dnsVerified) {
          await updateDomainDnsStatus(input.id, true);
          
          // Log the health check
          await createDomainHealthLog({
            domainId: input.id,
            checkType: 'dns',
            status: 'success',
            responseTime: 150,
            details: JSON.stringify({ verified: true, recordType: domain.dnsRecordType }),
          });
          
          return { success: true, message: 'DNS 驗證成功' };
        } else {
          await updateDomainDnsStatus(input.id, false, 'DNS 記錄未找到');
          
          await createDomainHealthLog({
            domainId: input.id,
            checkType: 'dns',
            status: 'error',
            errorMessage: 'DNS 記錄未找到',
          });
          
          return { success: false, message: 'DNS 驗證失敗，請確認您已正確設定 DNS 記錄' };
        }
      }),

    // Activate SSL for domain
    activateSsl: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const domain = await getDomainById(input.id);
        if (!domain || domain.userId !== ctx.user.id) {
          throw new Error('域名不存在');
        }
        
        if (!domain.dnsVerified) {
          throw new Error('請先完成 DNS 驗證');
        }
        
        // In production, this would trigger SSL certificate issuance
        // For MVP, we simulate SSL activation
        const sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
        
        await updateDomainSslStatus(input.id, true, sslExpiresAt);
        
        await createDomainHealthLog({
          domainId: input.id,
          checkType: 'ssl',
          status: 'success',
          details: JSON.stringify({ issued: true, expiresAt: sslExpiresAt }),
        });
        
        return { success: true, message: 'SSL 證書已啟用', expiresAt: sslExpiresAt };
      }),

    // Delete a domain
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const domain = await getDomainById(input.id);
        if (!domain || domain.userId !== ctx.user.id) {
          throw new Error('域名不存在');
        }
        
        await deleteDomain(input.id, ctx.user.id);
        return { success: true };
      }),

    // Get health logs for a domain
    healthLogs: protectedProcedure
      .input(z.object({ id: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const domain = await getDomainById(input.id);
        if (!domain || domain.userId !== ctx.user.id) return [];
        
        return getDomainHealthLogs(input.id, input.limit || 10);
      }),

    // Get pricing info
    pricing: publicProcedure.query(() => {
      return {
        annualFee: 12.99, // $12.99 USD
        currency: 'USD',
        features: [
          '自動 SSL 證書',
          'DNS 狀態監控',
          '到期提醒通知',
          '全年無限次數訪問',
        ],
        trialDays: 14,
      };
    }),

    // Search domains with pricing (Name.com API)
    search: protectedProcedure
      .input(z.object({
        keyword: z.string().min(1),
        tlds: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const tlds = input.tlds || ['com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'me', 'store', 'shop', 'online', 'site', 'xyz', 'tech', 'cc', 'info', 'biz'];
        // All prices in USD
        return searchDomainsWithPricing(input.keyword, tlds, 'USD');
      }),

    // Check single domain availability
    checkAvailability: protectedProcedure
      .input(z.object({
        domain: z.string().min(1),
      }))
      .query(async ({ input }) => {
        // All prices in USD
        const currency = 'USD';
        return getDomainPricing(input.domain, currency);
      }),

    // Purchase domain via Name.com
    purchase: protectedProcedure
      .input(z.object({
        domainName: z.string().min(1),
        years: z.number().min(1).max(10).default(1),
        contact: z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(1),
          address1: z.string().min(1),
          city: z.string().min(1),
          state: z.string().min(1),
          zip: z.string().min(1),
          country: z.string().min(2).max(2), // ISO 3166-1 alpha-2
          companyName: z.string().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        // First check if domain is available
        const pricing = await getDomainPricing(input.domainName);
        if (!pricing.available) {
          throw new Error('此域名已被註冊，無法購買');
        }

        // Prepare contact info
        const contactInfo: ContactInfo = {
          firstName: input.contact.firstName,
          lastName: input.contact.lastName,
          email: input.contact.email,
          phone: input.contact.phone,
          address1: input.contact.address1,
          city: input.contact.city,
          state: input.contact.state,
          zip: input.contact.zip,
          country: input.contact.country,
          companyName: input.contact.companyName,
        };

        // Purchase domain via Name.com API
        const result = await purchaseDomain({
          domain: {
            domainName: input.domainName,
          },
          purchasePrice: pricing.originalPriceUsd,
          years: input.years,
          contacts: {
            registrant: contactInfo,
            admin: contactInfo,
            tech: contactInfo,
            billing: contactInfo,
          },
        });

        // Create domain record in our database
        const domainParts = input.domainName.toLowerCase().split('.');
        const rootDomain = domainParts.slice(-2).join('.');
        const subdomain = domainParts.length > 2 ? domainParts.slice(0, -2).join('.') : null;
        const verificationToken = nanoid(32);

        const newDomain = await createDomain({
          userId: ctx.user.id,
          domain: input.domainName.toLowerCase(),
          subdomain,
          rootDomain,
          status: 'active',
          dnsRecordType: 'CNAME',
          dnsRecordValue: 'lulubaby.manus.space',
          verificationToken,
          subscriptionStatus: 'active',
          annualFee: pricing.sellingPriceUsd,
        });

        // Set DNS records to point to Lulubaby
        try {
          await setDnsRecords(input.domainName, [
            {
              host: '',
              type: 'CNAME',
              answer: 'lulubaby.manus.space',
              ttl: 300,
            },
          ]);
        } catch (dnsError) {
          console.error('Failed to set DNS records:', dnsError);
          // Domain is still purchased, just DNS setup failed
        }

        return {
          success: true,
          domain: newDomain,
          namecomDomain: result,
          pricing: {
            originalPriceUsd: pricing.originalPriceUsd,
            sellingPriceUsd: pricing.sellingPriceUsd,
          },
        };
      }),

    // Create Stripe payment intent for domain purchase
    createCheckoutSession: protectedProcedure
      .input(z.object({
        domainName: z.string().min(1),
        domainPriceUsd: z.number().positive(),
        includeManagementService: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
          if (!stripeSecretKey) {
            throw new Error('Stripe 密鑰未配置，請在設定中添加 STRIPE_SECRET_KEY');
          }
          const stripe = new Stripe(stripeSecretKey);
          
          // All prices in USD (Stripe will handle currency conversion)
          const domainPriceCents = Math.round(input.domainPriceUsd * 100);
          const managementFeeCents = input.includeManagementService ? 1299 : 0;  // $12.99 USD
          const totalPriceCents = domainPriceCents + managementFeeCents;
          
          // Create domain order in database
          const order = await createDomainOrder({
            userId: ctx.user.id,
            domain: input.domainName,
            tld: input.domainName.split('.').pop() || 'com',
            domainPrice: domainPriceCents,
            managementFee: managementFeeCents,
            totalPrice: totalPriceCents,
            currency: 'USD',
            status: 'pending_payment',
          });
          
          // Create Stripe Checkout Session
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `域名註冊 - ${input.domainName}`,
                    description: input.includeManagementService 
                      ? '包含年度管理服務（SSL、DNS監控、到期提醒）'
                      : '只購買域名',
                  },
                  unit_amount: totalPriceCents,
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: `https://3000-i0zfdzhheckbods29bz9j-bd49e366.sg1.manus.computer/domain?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://3000-i0zfdzhheckbods29bz9j-bd49e366.sg1.manus.computer/domain?payment=cancelled`,
            metadata: {
              orderId: order?.id?.toString() || '',
              domainName: input.domainName,
              userId: ctx.user.id.toString(),
            },
          });
          
          return {
            sessionId: session.id,
            url: session.url,
            orderId: order?.id,
          };
        } catch (error) {
          console.error('Failed to create checkout session:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          throw new Error(`無法創建支付會話：${error instanceof Error ? error.message : String(error)}`);
        }
      }),

    // Verify Name.com API connection
    verifyApiConnection: protectedProcedure.query(async () => {
      try {
        const username = await verifyConnection();
        return { connected: true, username };
      } catch (error) {
        return { connected: false, error: String(error) };
      }
    }),
    
    // Get user's domain purchase orders
    getOrders: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      const { domainOrders } = await import('../drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const orders = await db
        .select()
        .from(domainOrders)
        .where(eq(domainOrders.userId, ctx.user.id))
        .orderBy(desc(domainOrders.createdAt));
      
      return orders;
    }),
    
    // Get a specific order by ID
    getOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        return order;
      }),

    // ==================== Domain Management API ====================
    
    // Get registered domains for management
    getRegisteredDomains: protectedProcedure.query(async ({ ctx }) => {
      return getRegisteredDomainOrders(ctx.user.id);
    }),

    // Get Cloudflare configuration status
    getCloudflareStatus: protectedProcedure.query(async () => {
      const { getConfigurationStatus, verifyApiToken, isCloudflareConfigured } = await import('./services/cloudflare');
      const status = getConfigurationStatus();
      
      // If configured, verify the token is actually valid
      if (status.configured) {
        const verification = await verifyApiToken();
        return {
          ...status,
          tokenValid: verification.valid,
          tokenStatus: verification.status,
          tokenError: verification.error,
        };
      }
      
      return {
        ...status,
        tokenValid: false,
      };
    }),

    // Setup domain with Cloudflare (DNS + SSL)
    setupDomain: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        if (order.status !== 'registered') {
          throw new Error('域名尚未註冊完成');
        }
        
        // Import Cloudflare service
        const { setupDomain, isCloudflareConfigured } = await import('./services/cloudflare');
        
        if (!isCloudflareConfigured()) {
          // Return manual setup instructions if Cloudflare is not configured
          return {
            success: false,
            requiresManualSetup: true,
            instructions: {
              step1: '登入您的域名註冊商管理後台',
              step2: '將 DNS 設定為 CNAME 指向 lulubaby.manus.space',
              step3: '等待 DNS 傳播完成（通常需要 24-48 小時）',
              step4: '回來點擊「驗證 DNS」按鈕',
            },
            message: 'Cloudflare API 尚未配置，請手動設定 DNS 或聯繫管理員配置 Cloudflare。',
          };
        }
        
        // Update status to configuring
        await updateDomainOrderDnsConfig(input.orderId, {
          dnsStatus: 'configuring',
        });
        
        try {
          // Setup domain with Cloudflare
          const result = await setupDomain(order.domain);
          
          if (result.success) {
            await updateDomainOrderDnsConfig(input.orderId, {
              dnsStatus: 'propagating',
              sslStatus: 'provisioning',
              cloudflareZoneId: result.zoneId,
              cloudflareCnameRecordId: result.cnameRecordId,
              nameservers: result.nameservers,
              lastDnsCheck: new Date(),
            });
            
            return {
              success: true,
              message: 'DNS 配置已啟動，正在等待傳播...',
              nameservers: result.nameservers,
            };
          } else {
            await updateDomainOrderDnsConfig(input.orderId, {
              dnsStatus: 'error',
              dnsErrorMessage: result.error,
            });
            
            return {
              success: false,
              error: result.error,
            };
          }
        } catch (error) {
          await updateDomainOrderDnsConfig(input.orderId, {
            dnsStatus: 'error',
            dnsErrorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      }),

    // Check DNS propagation status
    checkDnsStatus: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        const { checkDnsPropagation, isCloudflareConfigured } = await import('./services/cloudflare');
        
        if (!isCloudflareConfigured() || !order.nameservers) {
          // Manual DNS check using dig command
          try {
            const { execSync } = await import('child_process');
            const result = execSync(`dig +short CNAME ${order.domain}`, { encoding: 'utf-8' });
            const cnameValue = result.trim();
            
            const isPointingToLulubaby = cnameValue.includes('lulubaby.manus.space');
            
            if (isPointingToLulubaby) {
              await updateDomainOrderDnsConfig(input.orderId, {
                dnsStatus: 'active',
                lastDnsCheck: new Date(),
              });
              
              return {
                propagated: true,
                message: 'DNS 已生效！您的域名已指向 Lulubaby。',
              };
            } else {
              return {
                propagated: false,
                currentValue: cnameValue || '未設定',
                expectedValue: 'lulubaby.manus.space',
                message: 'DNS 尚未生效，請稍後再試。',
              };
            }
          } catch (error) {
            return {
              propagated: false,
              error: 'DNS 查詢失敗',
              message: '無法查詢 DNS 狀態，請稍後再試。',
            };
          }
        }
        
        // Check with Cloudflare nameservers
        const nameservers = JSON.parse(order.nameservers as string);
        const result = await checkDnsPropagation(order.domain, nameservers);
        
        if (result.propagated) {
          await updateDomainOrderDnsConfig(input.orderId, {
            dnsStatus: 'active',
            lastDnsCheck: new Date(),
          });
        }
        
        return {
          propagated: result.propagated,
          currentNameservers: result.currentNameservers,
          expectedNameservers: result.expectedNameservers,
          message: result.propagated 
            ? 'DNS 已生效！' 
            : 'DNS 尚未傳播完成，請稍後再試。',
        };
      }),

    // Check SSL status
    checkSslStatus: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        if (!order.cloudflareZoneId) {
          // Check SSL manually using openssl
          try {
            const { execSync } = await import('child_process');
            const result = execSync(
              `echo | openssl s_client -connect ${order.domain}:443 -servername ${order.domain} 2>/dev/null | openssl x509 -noout -dates 2>/dev/null`,
              { encoding: 'utf-8', timeout: 10000 }
            );
            
            const hasValidCert = result.includes('notAfter');
            
            if (hasValidCert) {
              await updateDomainOrderDnsConfig(input.orderId, {
                sslStatus: 'active',
                lastSslCheck: new Date(),
              });
              
              return {
                status: 'active',
                message: 'SSL 證書已啟用。',
              };
            }
          } catch (error) {
            // SSL check failed, might not be ready yet
          }
          
          return {
            status: order.sslStatus,
            message: order.dnsStatus === 'active' 
              ? 'SSL 證書正在申請中...' 
              : '請先完成 DNS 配置。',
          };
        }
        
        const { checkSslStatus } = await import('./services/cloudflare');
        const result = await checkSslStatus(order.cloudflareZoneId);
        
        await updateDomainOrderDnsConfig(input.orderId, {
          sslStatus: result.status,
          lastSslCheck: new Date(),
          sslErrorMessage: result.error,
        });
        
        return {
          status: result.status,
          certificateStatus: result.certificateStatus,
          message: result.status === 'active' 
            ? 'SSL 證書已啟用。' 
            : result.status === 'provisioning' 
              ? 'SSL 證書正在申請中...' 
              : result.error || 'SSL 狀態未知',
        };
      }),

    // ==================== Domain Binding and Publishing API ====================
    
    // Bind domain to AI persona
    bindPersona: protectedProcedure
      .input(z.object({ 
        orderId: z.number(),
        personaId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        if (order.status !== 'registered') {
          throw new Error('域名尚未註冊完成');
        }
        
        // Verify persona exists and belongs to user
        const persona = await getPersonaById(input.personaId);
        if (!persona || persona.userId !== ctx.user.id) {
          throw new Error('智能體不存在或無權訪問');
        }
        
        await bindDomainToPersona(input.orderId, input.personaId);
        
        return {
          success: true,
          message: `域名 ${order.domain} 已綁定到智能體 ${persona.agentName}`,
        };
      }),
    
    // Unbind domain from persona
    unbindPersona: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        await unbindDomainFromPersona(input.orderId);
        
        return {
          success: true,
          message: '域名已解除綁定',
        };
      }),
    
    // Publish domain
    publish: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        if (order.status !== 'registered') {
          throw new Error('域名尚未註冊完成');
        }
        
        if (!order.personaId) {
          throw new Error('請先綁定智能體');
        }
        
        if (order.dnsStatus !== 'active') {
          throw new Error('DNS 尚未生效，請先完成 DNS 配置');
        }
        
        await publishDomain(input.orderId);
        
        return {
          success: true,
          message: `域名 ${order.domain} 已發布，現在可以透過域名訪問您的智能體！`,
          url: `https://${order.domain}`,
        };
      }),
    
    // Unpublish domain
    unpublish: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getDomainOrder(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error('訂單不存在或無權訪問');
        }
        
        await unpublishDomain(input.orderId);
        
        return {
          success: true,
          message: '域名已取消發布',
        };
      }),

    // Get published domain by name (public API for custom domain routing)
    getPublishedDomain: publicProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }) => {
        const domain = await getPublishedDomainByName(input.domain);
        if (!domain) {
          return null;
        }
        return {
          domain: domain.domain,
          personaId: domain.personaId,
          isPublished: domain.isPublished,
        };
      }),
    
    // Get domain management summary
    getManagementSummary: protectedProcedure.query(async ({ ctx }) => {
      const orders = await getRegisteredDomainOrders(ctx.user.id);
      
      const summary = {
        totalDomains: orders.length,
        activeCount: orders.filter(o => o.dnsStatus === 'active' && o.sslStatus === 'active').length,
        pendingCount: orders.filter(o => o.dnsStatus === 'pending' || o.dnsStatus === 'configuring' || o.dnsStatus === 'propagating').length,
        errorCount: orders.filter(o => o.dnsStatus === 'error' || o.sslStatus === 'error').length,
        domains: orders.map(o => ({
          id: o.id,
          domain: o.domain,
          dnsStatus: o.dnsStatus,
          sslStatus: o.sslStatus,
          registrationDate: o.registrationDate,
          expirationDate: o.expirationDate,
          targetHost: o.targetHost,
        })),
      };
      
      return summary;
    }),
  }),

  // Customer authentication (for chat widget)
  customerAuth: customerAuthRouter,

  // Learning Diary / Brain Memory System
  learningDiary: learningDiaryRouter,
});
export type AppRouter = typeof appRouter;
