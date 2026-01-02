/**
 * Knowledge Source Service
 * Handles extraction and processing of content from various sources:
 * - YouTube videos (transcript extraction)
 * - Web pages (content scraping)
 * - Direct text input
 * - FAQ Q&A pairs
 */

import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';

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
 * Fetch YouTube video transcript
 */
export async function fetchYouTubeTranscript(urlOrId: string): Promise<ExtractionResult> {
  try {
    const videoId = extractYouTubeVideoId(urlOrId);
    if (!videoId) {
      return {
        success: false,
        error: '無效的 YouTube 連結格式'
      };
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return {
        success: false,
        error: '無法獲取影片字幕，該影片可能沒有字幕或字幕已被禁用'
      };
    }

    // Combine transcript text
    const content = transcript.map((item: YouTubeTranscriptItem) => item.text).join(' ');
    
    // Calculate total duration
    const lastItem = transcript[transcript.length - 1];
    const totalDuration = lastItem ? (lastItem.offset + lastItem.duration) / 1000 : 0;

    const metadata: YouTubeMetadata = {
      videoId,
      duration: Math.round(totalDuration),
      transcriptLength: content.length
    };

    return {
      success: true,
      content,
      metadata
    };
  } catch (error) {
    console.error('[YouTube Transcript Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取 YouTube 字幕時發生錯誤'
    };
  }
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

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        error: `無法訪問網頁 (HTTP ${response.status})`
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
