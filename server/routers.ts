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
  createOrGetSubscription, updateSubscription, getUsageSummary, checkMessageLimit, incrementMessageCount,
  // Team operations
  getTeamById, getTeamByOwnerId, getTeamsByUserId, createTeam, updateTeam, deleteTeam,
  getTeamMembers, getTeamMemberById, getTeamMemberByUserAndTeam, inviteTeamMember, acceptTeamInvitation, updateTeamMember, removeTeamMember, getTeamMemberCount,
  getTeamKnowledgeByTeamId, getTeamKnowledgeById, createTeamKnowledge, updateTeamKnowledge, deleteTeamKnowledge, getAccessibleTeamKnowledge, getTeamKnowledgeContent,
  getTeamStats,
  // Customer memory operations
  getOrCreateCustomer, getCustomerById, getCustomersByPersonaId, updateCustomer, deleteCustomer, incrementCustomerMessageCount,
  addCustomerMemory, getCustomerMemories, getCustomerMemoryContext, deleteCustomerMemory,
  addConversationSummary, getCustomerConversationSummaries, getRecentConversationContext, getCustomerStats
} from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
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
        systemPrompt: z.string().optional().nullable(),
        primaryColor: z.string().optional(),
        layoutStyle: z.enum(["minimal", "professional", "custom"]).optional(),
        backgroundImageUrl: z.string().optional().nullable(),
        profilePhotoUrl: z.string().optional().nullable(),
        tagline: z.string().optional().nullable(),
        suggestedQuestions: z.string().optional().nullable(),
        showQuickButtons: z.boolean().optional(),
        buttonDisplayMode: z.enum(["full", "compact", "icon"]).optional(),
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
          primaryColor: persona.primaryColor,
          layoutStyle: persona.layoutStyle,
          backgroundImageUrl: persona.backgroundImageUrl,
          profilePhotoUrl: persona.profilePhotoUrl,
          tagline: persona.tagline,
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

        systemPrompt += `

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
});

export type AppRouter = typeof appRouter;
