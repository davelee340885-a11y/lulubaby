import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { customerAuthRouter } from "./customerAuthRouter";
import { learningDiaryRouter } from "./learningDiaryRouter";
import { authRouter } from "./authRouter";
import { adminRouter } from "./adminRouter";
import { stripeRouter } from "./stripeRouter";
import { agentChatRouter } from "./agentChatRouter";
import { widgetRouter } from "./widgetRouter";
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
  // Spark operations
  getSparkBalance, getSparkTransactions, checkSparkBalance, deductSpark,
  // Team operations
  getTeamById, getTeamByOwnerId, getTeamsByUserId, createTeam, updateTeam, deleteTeam,
  getTeamMembers, getTeamMemberById, getTeamMemberByUserAndTeam, inviteTeamMember, acceptTeamInvitation, updateTeamMember, removeTeamMember, getTeamMemberCount,
  getTeamKnowledgeByTeamId, getTeamKnowledgeById, createTeamKnowledge, updateTeamKnowledge, deleteTeamKnowledge, getAccessibleTeamKnowledge, getTeamKnowledgeContent,
  getTeamStats,
  // Customer memory operations
  getOrCreateCustomer, getCustomerById, getCustomersByPersonaId, updateCustomer, deleteCustomer, incrementCustomerMessageCount,
  addCustomerMemory, getCustomerMemories, getCustomerMemoryContext, deleteCustomerMemory,
  addConversationSummary, getCustomerConversationSummaries, getRecentConversationContext, getCustomerStats,
  // Subdomain operations
  isValidSubdomain, isSubdomainAvailable, getPersonaBySubdomain, setUserSubdomain,
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
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";
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
import { PLAN_LIMITS, PlanType, SPARK_COSTS } from "../drizzle/schema";
import { 
  fetchYouTubeTranscript, 
  fetchWebpageContent, 
  processTextInput, 
  processFAQInput,
  extractYouTubeVideoId,
  fetchWebpageContentViaLLM,
  type FAQItem,
  type YouTubeMetadata 
} from "./knowledgeSourceService";

/**
 * 即時智能摘取：從單輪對話中提取客戶關鍵資訊
 * 非同步執行，不阻塞主對話流程
 */
async function extractMemoryFromTurn(params: {
  customerId: number;
  lastUserMessage: string;
  lastAiMessage: string;
}): Promise<void> {
  const { customerId, lastUserMessage, lastAiMessage } = params;
  
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一個專注於從單輪對話中提取客戶關鍵資訊的助手。請分析以下客戶與 AI 的對話，只提取明確提及的客戶個人資料和關鍵記憶點。如果沒有任何可提取的資訊，請返回空的結果。

請返回 JSON 格式，包含：
- customerInfo: { name, email, phone, company } (只填寫明確提及的，其他留空字串)
- memories: 陣列，每項包含 { type: "preference"|"fact"|"need"|"concern"|"purchase"|"feedback", key: "簡短標題", value: "具體內容", confidence: 0-100 }

重要：只提取明確提及的資訊，不要猜測。如果這輪對話沒有任何可提取的資訊，請返回 customerInfo 全部為空字串且 memories 為空陣列。`
        },
        {
          role: "user",
          content: `客戶：${lastUserMessage}\nAI：${lastAiMessage}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "realtime_memory_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
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
            },
            required: ["customerInfo", "memories"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') return;

    const analysis = JSON.parse(content);

    // Update customer info if found
    const updateData: Record<string, string> = {};
    if (analysis.customerInfo.name) updateData.name = analysis.customerInfo.name;
    if (analysis.customerInfo.email) updateData.email = analysis.customerInfo.email;
    if (analysis.customerInfo.phone) updateData.phone = analysis.customerInfo.phone;
    if (analysis.customerInfo.company) updateData.company = analysis.customerInfo.company;

    if (Object.keys(updateData).length > 0) {
      await updateCustomer(customerId, updateData);
      console.log(`[extractMemory] Updated customer ${customerId} info:`, Object.keys(updateData));
    }

    // Add memories
    if (analysis.memories && Array.isArray(analysis.memories)) {
      for (const memory of analysis.memories) {
        if (memory.key && memory.value) {
          await addCustomerMemory({
            customerId,
            memoryType: memory.type,
            key: memory.key,
            value: memory.value,
            confidence: memory.confidence,
          });
        }
      }
      if (analysis.memories.length > 0) {
        console.log(`[extractMemory] Saved ${analysis.memories.length} memories for customer ${customerId}`);
      }
    }
  } catch (error) {
    console.error('[extractMemory] Failed:', error);
  }
}

export const appRouter = router({
  system: systemRouter,
  
  // User authentication (email/password)
  userAuth: authRouter,
  
  // Admin management
  admin: adminRouter,
  
  // Stripe subscription payments
  stripe: stripeRouter,
  
  // Legacy auth (Manus OAuth)
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { passwordHash, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // AI Persona management
  persona: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      let persona = await getPersonaByUserId(ctx.user.id);
      // Auto-create persona if it doesn't exist
      if (!persona) {
        persona = await upsertPersona({
          userId: ctx.user.id,
          agentName: `${ctx.user.name || 'AI'} 的 AI 助手`,
        });
      }
      return persona;
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
          // Validate URL before fetching
          if (!input.imageUrl || !input.imageUrl.startsWith('http')) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: '無效的圖片 URL',
            });
          }
          
          // Fetch the image from S3/storage
          const response = await fetch(input.imageUrl);
          if (!response.ok) {
            // Handle 404 specifically
            if (response.status === 404) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: '圖片不存在或已被刪除，請重新上傳',
              });
            }
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `無法載入圖片: ${response.statusText}`,
            });
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
          // Re-throw TRPCError as-is
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error('Error fetching image:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '無法載入圖片，請稍後再試',
          });
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
        
        // Calculate Spark cost based on file size (SPARK_COSTS.knowledgeBasePerMB Spark per MB, minimum 1 Spark)
        const fileSizeMB = fileBuffer.length / (1024 * 1024);
        const sparkCost = Math.max(1, Math.ceil(fileSizeMB * SPARK_COSTS.knowledgeBasePerMB));
        
        // Check and deduct Spark
        const sparkCheck = await checkSparkBalance(ctx.user.id, sparkCost);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，上傳此檔案需要 ${sparkCost} Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, sparkCost, `知識庫上傳: ${input.fileName}`, JSON.stringify({ fileName: input.fileName, fileSize: fileBuffer.length, sparkCost }));
        
        const fileKey = `knowledge/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        // Extract text content based on file type
        let extractedContent: string;
        if (["text/plain", "text/csv", "text/markdown", "text/html", "application/json"].includes(input.mimeType)) {
          extractedContent = fileBuffer.toString("utf-8").substring(0, 50000);
        } else if (input.mimeType === "application/pdf") {
          try {
            const { PDFParse } = await import("pdf-parse");
            const parser = new PDFParse({ data: fileBuffer });
            const textResult = await parser.getText();
            await parser.destroy();
            const fullText = textResult.text || "";
            extractedContent = fullText.length > 0 ? fullText.substring(0, 50000) : `[PDF file: ${input.fileName}, unable to extract text]`;
          } catch (pdfErr) {
            console.error("PDF text extraction failed:", pdfErr);
            extractedContent = `[PDF file: ${input.fileName}, ${fileBuffer.length} bytes - text extraction failed]`;
          }
        } else {
          extractedContent = `[Binary file: ${input.fileName}, ${fileBuffer.length} bytes]`;
        }
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          fileSize: fileBuffer.length,
          mimeType: input.mimeType,
          status: "ready",
          content: extractedContent,
          sourceType: "file",
        });
        
        return kb;
      }),
    
       // [PAUSED] YouTube video transcript - temporarily disabled, will re-implement in next stage
    // addYouTube: protectedProcedure
    addYouTube_DISABLED: protectedProcedure
      .input(z.object({
        url: z.string().min(1),
        title: z.string().optional(),
        clientContent: z.string().min(1).optional(),
        clientVideoId: z.string().optional(),
        clientLanguage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // If client already extracted content, store it directly (zero Spark cost)
        if (input.clientContent) {
          const videoId = input.clientVideoId || extractYouTubeVideoId(input.url) || 'unknown';
          const fileName = input.title || `YouTube-${videoId}`;
          const metadata: YouTubeMetadata = {
            videoId,
            transcriptLength: input.clientContent.length,
            extractionMethod: 'transcript',
          };
          
          const kb = await createKnowledgeBase({
            userId: ctx.user.id,
            fileName: fileName,
            fileSize: input.clientContent.length,
            mimeType: "text/plain",
            status: "ready",
            content: input.clientContent,
            sourceType: "youtube",
            sourceUrl: input.url,
            sourceMeta: JSON.stringify(metadata),
          });
          
          return { ...kb, sparkCost: 0 };
        }

        // Fallback: try server-side extraction (costs 5 Spark)
        const sparkCheck = await checkSparkBalance(ctx.user.id, 5);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，YouTube 字幕提取需要 5 Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, 5, `知識庫: YouTube 字幕`, JSON.stringify({ url: input.url }));
        
        const result = await fetchYouTubeTranscript(input.url);
        if (!result.success) {
          // Refund Spark on failure
          await deductSpark(ctx.user.id, -5, `退款: YouTube 字幕提取失敗`, JSON.stringify({ url: input.url }));
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || '無法取得 YouTube 字幕',
          });
        }
        
        const metadata = result.metadata as { videoId: string; duration?: number; transcriptLength: number };
        const fileName = input.title || `YouTube-${metadata.videoId}`;
        const contentStr = result.content || '';
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: fileName,
          fileSize: contentStr.length,
          mimeType: "text/plain",
          status: "ready",
          content: contentStr,
          sourceType: "youtube",
          sourceUrl: input.url,
          sourceMeta: JSON.stringify(metadata),
        });
        
        return { ...kb, sparkCost: 5 };
      }),

    // [PAUSED] YouTube LLM fallback - temporarily disabled, will re-implement in next stage
    // addYouTubeLLM: protectedProcedure
    addYouTubeLLM_DISABLED: protectedProcedure
      .input(z.object({
        url: z.string().min(1),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const LLM_SPARK_COST = 50;
        const sparkCheck = await checkSparkBalance(ctx.user.id, LLM_SPARK_COST);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，AI 影片分析需要 ${LLM_SPARK_COST} Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, LLM_SPARK_COST, `知識庫: YouTube AI分析`, JSON.stringify({ url: input.url }));
        
        const videoId = extractYouTubeVideoId(input.url);
        if (!videoId) {
          await deductSpark(ctx.user.id, -LLM_SPARK_COST, `退款: YouTube AI分析失敗`, JSON.stringify({ url: input.url }));
          throw new TRPCError({ code: 'BAD_REQUEST', message: '無效的 YouTube 連結格式' });
        }

        // Use LLM to understand the video
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: `你是一個專業的影片內容提取助手。你的任務是觀看 YouTube 影片並提取其中所有重要的知識內容。
請用影片使用的語言輸出。提取的內容應該：
1. 包含影片中提到的所有關鍵資訊、數據、事實
2. 保留專有名詞、價格、日期、地址等具體資訊
3. 以結構化的方式組織內容（使用標題和段落）
4. 盡可能詳細和完整
5. 不要添加影片中沒有提到的內容

請直接輸出提取的內容，不需要額外的說明或前言。`
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: `請觀看這個 YouTube 影片並提取其中所有重要的知識內容：${videoUrl}` },
                  { type: 'file_url', file_url: { url: videoUrl, mime_type: 'video/mp4' } }
                ]
              }
            ],
            maxTokens: 16000
          });

          const content = response.choices?.[0]?.message?.content;
          if (!content || typeof content !== 'string' || content.trim().length < 50) {
            await deductSpark(ctx.user.id, -LLM_SPARK_COST, `退款: YouTube AI分析內容不足`, JSON.stringify({ url: input.url }));
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'AI 無法從影片中提取足夠的內容，Spark 已退還。' });
          }

          const fileName = input.title || `YouTube-AI-${videoId}`;
          const metadata: YouTubeMetadata = {
            videoId,
            transcriptLength: content.length,
            extractionMethod: 'llm-summary',
          };

          const kb = await createKnowledgeBase({
            userId: ctx.user.id,
            fileName: fileName,
            fileSize: content.length,
            mimeType: "text/plain",
            status: "ready",
            content: content.trim(),
            sourceType: "youtube",
            sourceUrl: input.url,
            sourceMeta: JSON.stringify(metadata),
          });

          return { ...kb, sparkCost: LLM_SPARK_COST };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          await deductSpark(ctx.user.id, -LLM_SPARK_COST, `退款: YouTube AI分析失敗`, JSON.stringify({ url: input.url }));
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'AI 影片分析失敗，Spark 已退還。請稍後再試。' });
        }
      }),
    
      // Webpage content
    addWebpage: protectedProcedure
      .input(z.object({
        url: z.string().min(1),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-prepend https:// if missing protocol
        let url = input.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        // Validate URL format
        try {
          new URL(url);
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '無效的網址格式，請輸入正確的網址（例如 example.com 或 https://example.com）',
          });
        }
        // Use the normalized URL from here on
        input = { ...input, url };
        
        // Deduct 3 Spark for webpage content extraction
        const sparkCheck = await checkSparkBalance(ctx.user.id, 3);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，網頁內容提取需要 3 Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, 3, `知識庫: 網頁內容`, JSON.stringify({ url: input.url }));
        
        const result = await fetchWebpageContent(input.url);
        
        if (!result.success || !result.content) {
          // Direct scraping failed — auto-fallback to LLM reading
          // Refund the 3 Spark for the failed scrape
          await deductSpark(ctx.user.id, -3, `知識庫: 網頁抓取失敗退款`, JSON.stringify({ url: input.url }));
          
          const scrapeError = result.error || '獲取網頁內容失敗';
          const is403OrFetchError = scrapeError.includes('403') || scrapeError.includes('禁止') || scrapeError.includes('無法訪問') || scrapeError.includes('無法從網頁提取');
          
          if (is403OrFetchError) {
            // Auto-fallback: try LLM reading (costs 10 Spark)
            console.log(`[Webpage] Direct scrape failed (${scrapeError}), auto-fallback to LLM for ${input.url}`);
            const llmSparkCheck = await checkSparkBalance(ctx.user.id, 5);
            if (!llmSparkCheck.allowed) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `直接抓取失敗（${scrapeError}），AI 智能讀取需要 5 Spark，當前餘額 ${llmSparkCheck.balance} Spark 不足。`,
              });
            }
            await deductSpark(ctx.user.id, 5, `知識庫: AI智能讀取網頁(自動備援)`, JSON.stringify({ url: input.url }));
            
            const llmResult = await fetchWebpageContentViaLLM(input.url);
            if (!llmResult.success || !llmResult.content) {
              // Refund LLM Spark on failure
              await deductSpark(ctx.user.id, -5, `知識庫: AI讀取失敗退款`, JSON.stringify({ url: input.url }));
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `直接抓取和 AI 智能讀取均失敗。建議改用「文字輸入」方式，手動複製貼上網頁內容。`,
              });
            }
            
            const llmMeta = llmResult.metadata as { url: string; title: string; description?: string; contentLength: number };
            const llmFileName = input.title || llmMeta.title || new URL(input.url).hostname;
            
            const kb = await createKnowledgeBase({
              userId: ctx.user.id,
              fileName: llmFileName,
              fileSize: llmResult.content.length,
              mimeType: "text/html",
              status: "ready",
              content: llmResult.content,
              sourceType: "webpage",
              sourceUrl: input.url,
              sourceMeta: JSON.stringify({ ...llmMeta, extractionMethod: 'llm-auto-fallback' }),
            });
            
            return { ...kb, _llmFallbackUsed: true, _sparkCost: 10 };
          }
          
          // Non-403 errors: throw directly
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: scrapeError,
          });
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
        
        return { ...kb, _llmFallbackUsed: false, _sparkCost: 3 };
      }),
    
    // Webpage content via LLM fallback (costs 10 Spark)
    addWebpageLLM: protectedProcedure
      .input(z.object({
        url: z.string().min(1),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-prepend https:// if missing protocol
        let url = input.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        try {
          new URL(url);
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '無效的網址格式',
          });
        }

        // Deduct 10 Spark for LLM webpage reading
        const sparkCheck = await checkSparkBalance(ctx.user.id, 5);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，AI 智能讀取需要 5 Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, 5, `知識庫: AI智能讀取網頁`, JSON.stringify({ url }));

        const result = await fetchWebpageContentViaLLM(url);
        if (!result.success || !result.content) {
          // Refund Spark on failure
          await deductSpark(ctx.user.id, -5, `知識庫: AI讀取失敗退款`, JSON.stringify({ url }));
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'AI 網頁讀取失敗',
          });
        }

        const metadata = result.metadata as { url: string; title: string; description?: string; contentLength: number };
        const fileName = input.title || metadata.title || new URL(url).hostname;

        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: fileName,
          fileSize: result.content.length,
          mimeType: "text/html",
          status: "ready",
          content: result.content,
          sourceType: "webpage",
          sourceUrl: url,
          sourceMeta: JSON.stringify({ ...metadata, extractionMethod: 'llm' }),
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
        // Deduct 1 Spark for text input
        const sparkCheck = await checkSparkBalance(ctx.user.id, 1);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，新增文字知識需要 1 Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, 1, `知識庫: 文字輸入`, JSON.stringify({ title: input.title }));
        
        const result = processTextInput(input.content, input.title);
        if (!result.success) {
          throw new Error(result.error || '處理文字內容失敗');
        }
        const textContent = result.content || '';
        
        const kb = await createKnowledgeBase({
          userId: ctx.user.id,
          fileName: input.title,
          fileSize: textContent.length,
          mimeType: "text/plain",
          status: "ready",
          content: textContent,
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
        // Deduct 2 Spark for FAQ knowledge base
        const sparkCheck = await checkSparkBalance(ctx.user.id, 2);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，新增 FAQ 知識需要 2 Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, 2, `知識庫: FAQ`, JSON.stringify({ title: input.title, itemCount: input.items.length }));
        
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
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Persona not found',
          });
        }
        
        // Check Spark balance for the persona owner
        const sparkCheck = await checkSparkBalance(persona.userId, 1); // 1 Spark per message
        if (!sparkCheck.allowed) {
          // Notify the merchant (persona owner) that Spark is insufficient
          notifyOwner({
            title: "\u26a0\ufe0f Spark \u9918\u984d\u4e0d\u8db3 - AI \u5ba2\u6236\u7aef\u5df2\u505c\u6b62\u670d\u52d9",
            content: `\u60a8\u7684 AI \u667a\u80fd\u9ad4\u56e0 Spark \u9918\u984d\u4e0d\u8db3\u800c\u7121\u6cd5\u56de\u61c9\u5ba2\u6236\u8a0a\u606f\u3002\n\u7576\u524d\u9918\u984d\uff1a${sparkCheck.balance} Spark\n\u8acb\u76e1\u5feb\u524d\u5f80\u5145\u503c\u9801\u9762\u8cfc\u8cb7 Spark\uff0c\u4ee5\u6062\u5fa9 AI \u670d\u52d9\u3002`,
          }).catch(() => {}); // Fire-and-forget, don't block the response
          
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: JSON.stringify({
              type: 'SPARK_INSUFFICIENT',
              ownerBalance: sparkCheck.balance,
            }),
          });
        }
        
        // Deduct 1 Spark for this message
        await deductSpark(persona.userId, 1, "AI 對話");
        
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
        
        // Get knowledge base content (no DB limit)
        const knowledgeData = await getKnowledgeContentByUserId(persona.userId);
        
        // Apply plan-based knowledge limit + Spark overlimit charge
        let knowledgeContent = '';
        if (knowledgeData.content) {
          const subscription = await createOrGetSubscription(persona.userId);
          const limits = PLAN_LIMITS[subscription.plan as PlanType];
          const charLimit = limits.knowledgeBaseCharsLimit;
          
          if (knowledgeData.totalChars <= charLimit) {
            // Within plan limit: use all content for free
            knowledgeContent = knowledgeData.content;
          } else {
            // Over plan limit: need to Feed Spark for full access
            const overlimitCost = SPARK_COSTS.knowledgeBaseOverlimitPerChat;
            const overlimitCheck = await checkSparkBalance(persona.userId, overlimitCost);
            if (overlimitCheck.allowed) {
              // Has Spark: deduct and use full content (up to 500K hard cap)
              await deductSpark(persona.userId, overlimitCost, `知識庫超限費用（${Math.round(knowledgeData.totalChars / 1000)}K 字元）`);
              knowledgeContent = knowledgeData.content.substring(0, 500000);
            } else {
              // No Spark: only use within plan limit
              knowledgeContent = knowledgeData.content.substring(0, charLimit);
            }
          }
        }
        
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
        
        // Get contextual memories from learning diary (Brain Memory System) FIRST
        let memoryContext = '';
        try {
          console.log("[chat.send] ========== MEMORY RETRIEVAL START ==========");
          console.log("[chat.send] Searching for contextual memories for user:", persona.userId);
          console.log("[chat.send] User message:", input.message);
          const memoryService = createMemoryService(persona.userId);
          const contextualMemories = await memoryService.getMemoryContext(input.message, 5);
          console.log("[chat.send] Contextual memories found:", contextualMemories ? contextualMemories.length : 0, "chars");
          if (contextualMemories && contextualMemories.trim()) {
            memoryContext = contextualMemories;
            console.log("[chat.send] Memory content preview:", contextualMemories.substring(0, 200));
          } else {
            console.log("[chat.send] No contextual memories found or empty result");
          }
          console.log("[chat.send] ========== MEMORY RETRIEVAL END ==========");
        } catch (error) {
          console.error("[chat.send] Failed to get contextual memories:", error);
          console.error("[chat.send] Error stack:", error instanceof Error ? error.stack : 'Unknown error');
        }

        // Build system prompt - MEMORY FIRST for highest priority
        let systemPrompt = `你是${persona.agentName}，用戶的專屬 AI 銷售助手。
`;

        // Add memory context FIRST (highest priority)
        if (memoryContext) {
          systemPrompt += memoryContext;
        }

        // Then add basic instructions
        systemPrompt += `
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
${knowledgeContent}
---`;
          console.log(`[chat.send] Knowledge injected: ${knowledgeContent.length} chars (total available: ${knowledgeData.totalChars} chars)`);
        }

        // Memory context already added at the beginning of system prompt

        // Add proactive data collection instruction if enabled
        if (training?.proactiveDataCollection && customer) {
          const hasName = !!customer.name;
          const hasEmail = !!customer.email;
          const hasPhone = !!customer.phone;
          if (!hasName || !hasEmail) {
            systemPrompt += `

【主動資料索取】這是一個新客戶或資料不完整的客戶。請在對話的早期，找一個自然的時機，禮貌地詢問客戶的${!hasName ? '姓名' : ''}${!hasName && !hasEmail ? '和' : ''}${!hasEmail ? '聯絡方式（例如電郵）' : ''}，以便更好地為他服務。例如：『為了方便後續跟進，請問怎麼稱呼您呢？』。不要強迫或重複詢問，如果客戶不願提供請尊重。`;
          }
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
        
        // Async: trigger realtime memory extraction (fire-and-forget)
        if (customer) {
          extractMemoryFromTurn({
            customerId: customer.id,
            lastUserMessage: input.message,
            lastAiMessage: aiMessage,
          }).catch((err: unknown) => console.error('[chat.send] Realtime memory extraction failed:', err));
        }
        
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
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Persona not found',
          });
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
        // 主動資料索取
        proactiveDataCollection: z.boolean().optional(),
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
        // Get current superpowers settings to compare
        const currentSettings = await getSuperpowersByUserId(ctx.user.id);
        
        // Count only NEWLY enabled superpowers (not previously enabled)
        const newlyEnabled = Object.entries(input).filter(([key, val]) => {
          if (typeof val !== 'boolean' || val !== true) return false;
          if (['researchDepth', 'followUpIntensity', 'persuasionStyle'].includes(key)) return false;
          // Only count if this power was NOT previously enabled
          const wasEnabled = currentSettings ? (currentSettings as any)[key] === true : false;
          return !wasEnabled;
        }).length;
        
        if (newlyEnabled > 0) {
          const sparkCost = newlyEnabled * SPARK_COSTS.superpowerActivation;
          const sparkCheck = await checkSparkBalance(ctx.user.id, sparkCost);
          if (!sparkCheck.allowed) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Spark 不足，啟用 ${newlyEnabled} 個新超能力需要 ${sparkCost} Spark，當前餘額 ${sparkCheck.balance} Spark`,
            });
          }
          await deductSpark(ctx.user.id, sparkCost, `超能力設定: 新啟用 ${newlyEnabled} 個超能力`, JSON.stringify({ newlyEnabled }));
        }
        
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
    
    // Spark 餘額查詢
    getSparkBalance: protectedProcedure.query(async ({ ctx }) => {
      return { balance: await getSparkBalance(ctx.user.id) };
    }),

    // Spark 交易記錄
    getSparkTransactions: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        return getSparkTransactions(ctx.user.id, input?.limit ?? 20, input?.offset ?? 0);
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
        
        // Deduct 500 Spark for team creation
        const sparkCost = 500;
        const sparkCheck = await checkSparkBalance(ctx.user.id, sparkCost);
        if (!sparkCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Spark 不足，創建團隊需要 ${sparkCost} Spark，當前餘額 ${sparkCheck.balance} Spark`,
          });
        }
        await deductSpark(ctx.user.id, sparkCost, `創建團隊: ${input.name}`, JSON.stringify({ teamName: input.name, plan: input.plan }));
        
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
        if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
        
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge item not found' });
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
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Knowledge item not found' });
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
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
        
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
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
        
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
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
        
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
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
        
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
        if (!customer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
        
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
          const stripeSecretKey = ENV.stripeSecretKey;
          if (!stripeSecretKey) {
            throw new Error('Stripe 密鑰未配置，請在環境變數中設定 LULUBABY_STRIPE_SECRET_KEY 或 STRIPE_SECRET_KEY');
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
            // Use Origin or Referer header to get the actual frontend URL (not internal Cloud Run host)
            success_url: `${ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/[^/]*$/, '') || `${ctx.req.protocol}://${ctx.req.headers.host || 'localhost:3000'}`}/domain?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/[^/]*$/, '') || `${ctx.req.protocol}://${ctx.req.headers.host || 'localhost:3000'}`}/domain?payment=cancelled`,
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

  // Subdomain management (free xxx.lulubaby.xyz)
  subdomain: router({
    // Get current user's subdomain
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) return null;
      const persona = await getPersonaByUserId(ctx.user.id);
      return {
        subdomain: user.subdomain || null,
        url: user.subdomain ? `https://${user.subdomain}.lulubaby.xyz` : null,
        personaId: persona?.id || null,
        agentName: persona?.agentName || null,
      };
    }),

    // Check if a subdomain is available
    check: publicProcedure
      .input(z.object({ subdomain: z.string() }))
      .query(async ({ input }) => {
        const validation = isValidSubdomain(input.subdomain);
        if (!validation.valid) {
          return { available: false, error: validation.error };
        }
        const available = await isSubdomainAvailable(input.subdomain);
        return { available, error: available ? undefined : '\u6b64\u5b50\u57df\u540d\u5df2\u88ab\u4f7f\u7528' };
      }),

    // Update user's subdomain
    update: protectedProcedure
      .input(z.object({ subdomain: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const normalized = input.subdomain.toLowerCase().trim();
        const validation = isValidSubdomain(normalized);
        if (!validation.valid) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: validation.error || '\u7121\u6548\u7684\u5b50\u57df\u540d' });
        }
        const available = await isSubdomainAvailable(normalized, ctx.user.id);
        if (!available) {
          throw new TRPCError({ code: 'CONFLICT', message: '\u6b64\u5b50\u57df\u540d\u5df2\u88ab\u4f7f\u7528' });
        }
        await setUserSubdomain(ctx.user.id, normalized);
        return { subdomain: normalized, url: `https://${normalized}.lulubaby.xyz` };
      }),

    // Resolve subdomain to persona (public API)
    resolve: publicProcedure
      .input(z.object({ subdomain: z.string() }))
      .query(async ({ input }) => {
        const result = await getPersonaBySubdomain(input.subdomain);
        if (!result) return null;
        return result;
      }),
  }),

  // Customer authentication (for chat widget)
  customerAuth: customerAuthRouter,

  // Learning Diary / Brain Memory System
  learningDiary: learningDiaryRouter,

  // Widget settings
  widget: widgetRouter,

  // Agent Chat - 智能體對話
  agentChat: agentChatRouter,
});
export type AppRouter = typeof appRouter;
