/**
 * Knowledge Source Service
 * Handles extraction and processing of content from various sources:
 * - YouTube videos (transcript extraction with LLM fallback)
 * - Web pages (content scraping)
 * - Direct text input
 * - FAQ Q&A pairs
 */

import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';
import { invokeLLM } from './_core/llm';

// Types
export type KnowledgeSourceType = 'file' | 'youtube' | 'webpage' | 'text' | 'faq';

export interface YouTubeTranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export interface YouTubeMetadata {
  videoId: string;
  title?: string;
  duration?: number;
  transcriptLength: number;
  extractionMethod?: 'transcript' | 'llm-summary';
}

export interface WebpageMetadata {
  url: string;
  title: string;
  description?: string;
  contentLength: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQMetadata {
  itemCount: number;
  totalLength: number;
}

export interface ExtractionResult {
  success: boolean;
  content?: string;
  metadata?: YouTubeMetadata | WebpageMetadata | FAQMetadata | { title?: string; contentLength: number };
  error?: string;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Attempt to fetch YouTube transcript using the youtube-transcript library.
 * This may fail on cloud servers due to YouTube IP blocking.
 */
async function tryDirectTranscript(videoId: string): Promise<ExtractionResult> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return { success: false, error: 'empty_transcript' };
    }

    const content = transcript.map((item: YouTubeTranscriptItem) => item.text).join(' ');
    const lastItem = transcript[transcript.length - 1];
    const totalDuration = lastItem ? (lastItem.offset + lastItem.duration) / 1000 : 0;

    const metadata: YouTubeMetadata = {
      videoId,
      duration: Math.round(totalDuration),
      transcriptLength: content.length,
      extractionMethod: 'transcript'
    };

    return { success: true, content, metadata };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('[YouTube Transcript] Direct extraction failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Fallback: Use LLM with video understanding to extract content from YouTube video.
 * Sends the YouTube URL to the LLM which can understand video content directly.
 */
async function tryLLMVideoExtraction(videoId: string): Promise<ExtractionResult> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('[YouTube LLM Fallback] Extracting content via LLM for:', videoUrl);

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
            {
              type: 'text',
              text: `請觀看這個 YouTube 影片並提取其中所有重要的知識內容：${videoUrl}`
            },
            {
              type: 'file_url',
              file_url: {
                url: videoUrl,
                mime_type: 'video/mp4'
              }
            }
          ]
        }
      ],
      maxTokens: 16000
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return {
        success: false,
        error: 'LLM 無法從影片中提取足夠的內容'
      };
    }

    const metadata: YouTubeMetadata = {
      videoId,
      transcriptLength: content.length,
      extractionMethod: 'llm-summary'
    };

    return { success: true, content: content.trim(), metadata };
  } catch (error) {
    console.error('[YouTube LLM Fallback Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '使用 AI 提取影片內容時發生錯誤'
    };
  }
}

/**
 * Fetch YouTube video transcript with automatic fallback to LLM extraction.
 * 
 * Strategy:
 * 1. Try direct transcript extraction (fast, accurate)
 * 2. If blocked by YouTube IP ban, fall back to LLM video understanding (slower but reliable)
 */
export async function fetchYouTubeTranscript(urlOrId: string): Promise<ExtractionResult> {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    return {
      success: false,
      error: '無效的 YouTube 連結格式'
    };
  }

  // Step 1: Try direct transcript extraction
  const directResult = await tryDirectTranscript(videoId);
  if (directResult.success) {
    return directResult;
  }

  console.log('[YouTube] Direct transcript failed, trying LLM fallback...');

  // Step 2: Fall back to LLM video understanding
  const llmResult = await tryLLMVideoExtraction(videoId);
  if (llmResult.success) {
    console.log('[YouTube] LLM fallback succeeded, content length:', llmResult.content?.length);
    return llmResult;
  }

  // Both methods failed - return a user-friendly error
  const directError = directResult.error || '';
  
  if (directError.includes('Transcript is disabled') || directError.includes('Sign in to confirm')) {
    return {
      success: false,
      error: '無法提取此影片內容。YouTube 字幕提取和 AI 影片理解均失敗。請嘗試其他影片，或改用「文字輸入」方式手動添加內容。'
    };
  }
  if (directError.includes('Video unavailable') || directError.includes('not found')) {
    return {
      success: false,
      error: '找不到此影片，可能已被刪除或設為私人。請確認連結是否正確。'
    };
  }
  if (directError.includes('Too many requests') || directError.includes('429')) {
    return {
      success: false,
      error: '請求過於頻繁，請稍後再試。'
    };
  }
  
  return {
    success: false,
    error: `無法提取影片內容：${llmResult.error || '請確認連結正確並稍後再試。'}`
  };
}

/**
 * Fetch and extract content from a webpage
 */
export async function fetchWebpageContent(url: string): Promise<ExtractionResult> {
  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        success: false,
        error: '無效的網址格式'
      };
    }

    // Try multiple User-Agent strategies to bypass bot detection
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ];

    let response: Response | null = null;
    let lastStatus = 0;

    for (const ua of userAgents) {
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(30000)
        });

        if (response.ok) break;
        lastStatus = response.status;
        console.log(`[Webpage Fetch] UA attempt failed with status ${response.status}, trying next...`);
      } catch (fetchErr) {
        console.log(`[Webpage Fetch] UA attempt failed:`, fetchErr instanceof Error ? fetchErr.message : fetchErr);
        continue;
      }
    }

    if (!response || !response.ok) {
      const status = lastStatus || (response?.status ?? 0);
      if (status === 403) {
        return {
          success: false,
          error: '此網站禁止外部存取（HTTP 403），將自動嘗試 AI 智能讀取。'
        };
      }
      if (status === 404) {
        return {
          success: false,
          error: '找不到此網頁（HTTP 404），請確認網址是否正確。'
        };
      }
      if (status === 429) {
        return {
          success: false,
          error: '請求過於頻繁，請稍後再試。'
        };
      }
      return {
        success: false,
        error: `無法訪問網頁${status ? ` (HTTP ${status})` : ''}，請確認網址正確且網站可正常訪問。`
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, noscript, .ad, .advertisement, .sidebar, .menu, .navigation').remove();

    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  parsedUrl.hostname;

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    // Extract main content
    // Try to find main content area
    let content = '';
    const mainSelectors = ['main', 'article', '.content', '.post-content', '.entry-content', '#content', '.article-body'];
    
    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Limit content length (max 50000 characters)
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '...';
    }

    if (!content || content.length < 50) {
      return {
        success: false,
        error: '無法從網頁提取有效內容'
      };
    }

    const metadata: WebpageMetadata = {
      url,
      title,
      description: description.substring(0, 500),
      contentLength: content.length
    };

    return {
      success: true,
      content,
      metadata
    };
  } catch (error) {
    console.error('[Webpage Fetch Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取網頁內容時發生錯誤'
    };
  }
}

/**
 * Process direct text input
 */
export function processTextInput(text: string, title?: string): ExtractionResult {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: '請輸入有效的文字內容'
    };
  }

  const content = text.trim();
  
  // Limit content length (max 100000 characters)
  if (content.length > 100000) {
    return {
      success: false,
      error: '文字內容過長，請限制在 100,000 字元以內'
    };
  }

  return {
    success: true,
    content,
    metadata: {
      title: title || '直接輸入',
      contentLength: content.length
    }
  };
}

/**
 * Process FAQ Q&A pairs
 */
export function processFAQInput(items: FAQItem[]): ExtractionResult {
  if (!items || items.length === 0) {
    return {
      success: false,
      error: '請至少輸入一組問答'
    };
  }

  // Validate and filter valid items
  const validItems = items.filter(item => 
    item.question && item.question.trim() && 
    item.answer && item.answer.trim()
  );

  if (validItems.length === 0) {
    return {
      success: false,
      error: '請確保每組問答都有問題和答案'
    };
  }

  // Format FAQ content for AI context
  const content = validItems.map((item, index) => {
    return `【問題 ${index + 1}】${item.question.trim()}\n【答案】${item.answer.trim()}`;
  }).join('\n\n');

  const metadata: FAQMetadata = {
    itemCount: validItems.length,
    totalLength: content.length
  };

  return {
    success: true,
    content,
    metadata
  };
}

/**
 * Fallback: Use LLM to read and extract content from a webpage URL.
 * The LLM can access URLs that our server cannot (e.g., 403 blocked sites).
 * Cost: ~10 Spark per invocation.
 */
export async function fetchWebpageContentViaLLM(url: string): Promise<ExtractionResult> {
  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { success: false, error: '無效的網址格式' };
    }

    console.log('[Webpage LLM] Extracting content via LLM for:', url);

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `你是一個專業的網頁內容提取助手。你的任務是訪問指定的網頁 URL 並提取其中所有重要的文字內容。
請用網頁使用的語言輸出。提取的內容應該：
1. 包含網頁中的主要文字內容（標題、段落、列表等）
2. 保留專有名詞、價格、日期、地址、聯絡方式等具體資訊
3. 以結構化的方式組織內容（使用標題和段落）
4. 忽略導航欄、廣告、頁尾等非核心內容
5. 不要添加網頁中沒有的內容

請直接輸出提取的內容，不需要額外的說明或前言。`
        },
        {
          role: 'user',
          content: `請訪問以下網頁並提取其中所有重要的文字內容：${url}`
        }
      ],
      maxTokens: 16000
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string' || content.trim().length < 30) {
      return {
        success: false,
        error: 'AI 無法從此網頁提取足夠的內容，請改用「文字輸入」方式手動添加。'
      };
    }

    const metadata: WebpageMetadata = {
      url,
      title: parsedUrl.hostname,
      description: 'AI 智能讀取',
      contentLength: content.trim().length
    };

    return { success: true, content: content.trim(), metadata };
  } catch (error) {
    console.error('[Webpage LLM Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '使用 AI 讀取網頁時發生錯誤'
    };
  }
}

/**
 * Get source type display name
 */
export function getSourceTypeLabel(sourceType: KnowledgeSourceType): string {
  const labels: Record<KnowledgeSourceType, string> = {
    file: '文件',
    youtube: 'YouTube 影片',
    webpage: '網頁',
    text: '文字',
    faq: 'FAQ 問答'
  };
  return labels[sourceType] || sourceType;
}

/**
 * Get source type icon name (for frontend)
 */
export function getSourceTypeIcon(sourceType: KnowledgeSourceType): string {
  const icons: Record<KnowledgeSourceType, string> = {
    file: 'FileText',
    youtube: 'Youtube',
    webpage: 'Globe',
    text: 'Type',
    faq: 'HelpCircle'
  };
  return icons[sourceType] || 'File';
}
