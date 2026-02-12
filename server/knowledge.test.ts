import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractYouTubeVideoId,
  processTextInput,
  processFAQInput,
  type FAQItem,
} from './knowledgeSourceService';

describe('Knowledge Source Service', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short YouTube URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from direct ID input', () => {
      const videoId = 'dQw4w9WgXcQ';
      expect(extractYouTubeVideoId(videoId)).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/video';
      expect(extractYouTubeVideoId(url)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractYouTubeVideoId('')).toBeNull();
    });

    it('should handle URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120';
      expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });
  });

  describe('processTextInput', () => {
    it('should process valid text input', () => {
      const result = processTextInput('This is test content', 'Test Title');
      expect(result.success).toBe(true);
      expect(result.content).toBe('This is test content');
      expect(result.metadata).toEqual({
        title: 'Test Title',
        contentLength: 20,
      });
    });

    it('should use default title when not provided', () => {
      const result = processTextInput('Test content');
      expect(result.success).toBe(true);
      expect(result.metadata).toEqual({
        title: '直接輸入',
        contentLength: 12,
      });
    });

    it('should trim whitespace from content', () => {
      const result = processTextInput('  Test content  ');
      expect(result.success).toBe(true);
      expect(result.content).toBe('Test content');
    });

    it('should reject empty content', () => {
      const result = processTextInput('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('請輸入有效的文字內容');
    });

    it('should reject whitespace-only content', () => {
      const result = processTextInput('   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('請輸入有效的文字內容');
    });

    it('should reject content exceeding 100,000 characters', () => {
      const longContent = 'a'.repeat(100001);
      const result = processTextInput(longContent);
      expect(result.success).toBe(false);
      expect(result.error).toBe('文字內容過長，請限制在 100,000 字元以內');
    });

    it('should accept content at exactly 100,000 characters', () => {
      const maxContent = 'a'.repeat(100000);
      const result = processTextInput(maxContent);
      expect(result.success).toBe(true);
      expect(result.content?.length).toBe(100000);
    });
  });

  describe('processFAQInput', () => {
    it('should process valid FAQ items', () => {
      const items: FAQItem[] = [
        { question: 'What is this?', answer: 'This is a test.' },
        { question: 'How does it work?', answer: 'It works well.' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(true);
      expect(result.content).toContain('【問題 1】What is this?');
      expect(result.content).toContain('【答案】This is a test.');
      expect(result.content).toContain('【問題 2】How does it work?');
      expect(result.metadata).toEqual({
        itemCount: 2,
        totalLength: expect.any(Number),
      });
    });

    it('should reject empty items array', () => {
      const result = processFAQInput([]);
      expect(result.success).toBe(false);
      expect(result.error).toBe('請至少輸入一組問答');
    });

    it('should filter out items with empty questions', () => {
      const items: FAQItem[] = [
        { question: '', answer: 'Answer without question' },
        { question: 'Valid question', answer: 'Valid answer' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(true);
      expect(result.content).not.toContain('Answer without question');
      expect(result.content).toContain('Valid question');
    });

    it('should filter out items with empty answers', () => {
      const items: FAQItem[] = [
        { question: 'Question without answer', answer: '' },
        { question: 'Valid question', answer: 'Valid answer' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(true);
      expect(result.content).not.toContain('Question without answer');
      expect(result.content).toContain('Valid question');
    });

    it('should reject if all items are invalid', () => {
      const items: FAQItem[] = [
        { question: '', answer: '' },
        { question: '  ', answer: '  ' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(false);
      expect(result.error).toBe('請確保每組問答都有問題和答案');
    });

    it('should trim whitespace from questions and answers', () => {
      const items: FAQItem[] = [
        { question: '  Question with spaces  ', answer: '  Answer with spaces  ' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(true);
      expect(result.content).toContain('Question with spaces');
      expect(result.content).toContain('Answer with spaces');
    });

    it('should handle single valid item', () => {
      const items: FAQItem[] = [
        { question: 'Single question', answer: 'Single answer' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(true);
      expect(result.metadata).toEqual({
        itemCount: 1,
        totalLength: expect.any(Number),
      });
    });

    it('should handle Chinese characters', () => {
      const items: FAQItem[] = [
        { question: '這是什麼產品？', answer: '這是一個AI助手產品。' },
      ];
      const result = processFAQInput(items);
      expect(result.success).toBe(true);
      expect(result.content).toContain('這是什麼產品？');
      expect(result.content).toContain('這是一個AI助手產品。');
    });
  });
});
