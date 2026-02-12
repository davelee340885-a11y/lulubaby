/**
 * YouTube Transcript Extractor - Client-side
 * 
 * Extracts YouTube video transcripts directly from the user's browser.
 * This avoids cloud server IP blocking by YouTube since the request
 * comes from the user's own IP address.
 * 
 * Strategy:
 * 1. Fetch the YouTube video page HTML
 * 2. Parse the embedded player response to find caption tracks
 * 3. Fetch the caption track XML and extract text
 */

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  success: boolean;
  content?: string;
  segments?: TranscriptSegment[];
  videoId?: string;
  title?: string;
  language?: string;
  error?: string;
  errorCode?: 'INVALID_URL' | 'NO_CAPTIONS' | 'FETCH_FAILED' | 'PARSE_FAILED' | 'BLOCKED';
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
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
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Parse caption XML and extract text segments
 */
function parseCaptionXml(xml: string): TranscriptSegment[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const textElements = doc.querySelectorAll('text');
  
  const segments: TranscriptSegment[] = [];
  textElements.forEach((el) => {
    const text = decodeHtmlEntities(el.textContent || '').trim();
    if (!text) return;
    
    const start = parseFloat(el.getAttribute('start') || '0');
    const dur = parseFloat(el.getAttribute('dur') || '0');
    
    segments.push({
      text,
      start,
      duration: dur,
    });
  });
  
  return segments;
}

/**
 * Try to extract transcript using the YouTube innertube player API.
 * This is called from the user's browser, so it uses their IP (not blocked).
 */
async function fetchViaInnertubeAPI(videoId: string): Promise<TranscriptResult> {
  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250210.01.00',
        hl: 'en',
        gl: 'US',
      }
    },
    videoId,
  };

  const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { success: false, error: `YouTube API 返回 HTTP ${response.status}`, errorCode: 'FETCH_FAILED' };
  }

  const data = await response.json();

  // Check playability
  if (data.playabilityStatus?.status === 'LOGIN_REQUIRED') {
    return { success: false, error: '需要登入才能訪問此影片', errorCode: 'BLOCKED' };
  }
  if (data.playabilityStatus?.status === 'ERROR') {
    return { success: false, error: '影片不存在或已被刪除', errorCode: 'FETCH_FAILED' };
  }

  // Get video title
  const title = data.videoDetails?.title || '';

  // Find caption tracks
  const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) {
    return { success: false, error: '此影片沒有可用的字幕', errorCode: 'NO_CAPTIONS', videoId, title };
  }

  // Prefer manual captions over auto-generated, prefer Chinese/English
  const preferredLangs = ['zh-Hant', 'zh-TW', 'zh', 'zh-Hans', 'zh-CN', 'en', 'ja', 'ko'];
  let selectedTrack = captionTracks[0];
  
  for (const lang of preferredLangs) {
    const found = captionTracks.find((t: { languageCode: string }) => t.languageCode === lang);
    if (found) {
      selectedTrack = found;
      break;
    }
  }

  // Fetch the caption XML
  const captionUrl = selectedTrack.baseUrl;
  if (!captionUrl) {
    return { success: false, error: '無法獲取字幕 URL', errorCode: 'PARSE_FAILED', videoId, title };
  }

  const captionResponse = await fetch(captionUrl);
  if (!captionResponse.ok) {
    return { success: false, error: `字幕下載失敗 (HTTP ${captionResponse.status})`, errorCode: 'FETCH_FAILED', videoId, title };
  }

  const captionXml = await captionResponse.text();
  const segments = parseCaptionXml(captionXml);

  if (segments.length === 0) {
    return { success: false, error: '字幕內容為空', errorCode: 'NO_CAPTIONS', videoId, title };
  }

  const content = segments.map(s => s.text).join(' ');

  return {
    success: true,
    content,
    segments,
    videoId,
    title,
    language: selectedTrack.languageCode,
  };
}

/**
 * Try to extract transcript by parsing the YouTube watch page HTML.
 * Fallback method if innertube API doesn't work.
 */
async function fetchViaWatchPage(videoId: string): Promise<TranscriptResult> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    return { success: false, error: `無法載入 YouTube 頁面 (HTTP ${response.status})`, errorCode: 'FETCH_FAILED' };
  }

  const html = await response.text();

  // Extract ytInitialPlayerResponse from the page
  const playerMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/);
  if (!playerMatch) {
    // Try alternative pattern
    const altMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/);
    if (!altMatch) {
      return { success: false, error: '無法解析 YouTube 頁面數據', errorCode: 'PARSE_FAILED' };
    }
  }

  try {
    const matchStr = (playerMatch || html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/))?.[1];
    if (!matchStr) {
      return { success: false, error: '無法解析 YouTube 頁面數據', errorCode: 'PARSE_FAILED' };
    }
    
    const playerData = JSON.parse(matchStr);
    const title = playerData.videoDetails?.title || '';
    
    const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      return { success: false, error: '此影片沒有可用的字幕', errorCode: 'NO_CAPTIONS', videoId, title };
    }

    // Select best track
    const preferredLangs = ['zh-Hant', 'zh-TW', 'zh', 'zh-Hans', 'zh-CN', 'en'];
    let selectedTrack = captionTracks[0];
    for (const lang of preferredLangs) {
      const found = captionTracks.find((t: { languageCode: string }) => t.languageCode === lang);
      if (found) { selectedTrack = found; break; }
    }

    const captionResponse = await fetch(selectedTrack.baseUrl);
    const captionXml = await captionResponse.text();
    const segments = parseCaptionXml(captionXml);

    if (segments.length === 0) {
      return { success: false, error: '字幕內容為空', errorCode: 'NO_CAPTIONS', videoId, title };
    }

    return {
      success: true,
      content: segments.map(s => s.text).join(' '),
      segments,
      videoId,
      title,
      language: selectedTrack.languageCode,
    };
  } catch {
    return { success: false, error: '解析 YouTube 頁面數據失敗', errorCode: 'PARSE_FAILED' };
  }
}

/**
 * Main function: Extract YouTube transcript from the user's browser.
 * 
 * Tries multiple methods in order:
 * 1. YouTube innertube player API
 * 2. YouTube watch page parsing
 * 
 * If both fail, returns error with suggestion to use LLM fallback.
 */
export async function extractYouTubeTranscript(url: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { success: false, error: '無效的 YouTube 連結格式', errorCode: 'INVALID_URL' };
  }

  // Method 1: Try innertube API
  try {
    const result = await fetchViaInnertubeAPI(videoId);
    if (result.success) return result;
    
    // If blocked or no captions, try watch page
    if (result.errorCode === 'BLOCKED') {
      console.log('[YT Transcript] Innertube blocked, trying watch page...');
    }
  } catch (e) {
    console.warn('[YT Transcript] Innertube API failed:', e);
  }

  // Method 2: Try watch page parsing
  try {
    const result = await fetchViaWatchPage(videoId);
    if (result.success) return result;
    return result; // Return the error from watch page
  } catch (e) {
    console.warn('[YT Transcript] Watch page failed:', e);
  }

  return {
    success: false,
    videoId,
    error: '無法從此影片提取字幕。可能是影片沒有字幕，或瀏覽器被限制訪問。',
    errorCode: 'FETCH_FAILED',
  };
}
