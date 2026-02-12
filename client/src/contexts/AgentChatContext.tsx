/**
 * AgentChatContext - AI 對話持久化管理器
 * 
 * 將對話狀態提升到 App 層級，確保頁面切換時：
 * 1. 對話消息不丟失
 * 2. 進行中的 AI 回應繼續運行
 * 3. 回到頁面時可看到最新狀態
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  memorySaved?: boolean;
  timestamp: Date;
  sessionId?: string;
}

export interface ChatSession {
  sessionId: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

interface AgentChatContextType {
  // Current conversation
  messages: ChatMessage[];
  currentSessionId: string | null;
  isLoading: boolean;
  
  // Actions
  sendMessage: (message: string) => void;
  clearChat: () => void;
  loadSession: (sessionId: string) => void;
  startNewSession: () => void;
  
  // Session list
  sessions: ChatSession[];
  sessionsLoading: boolean;
  refreshSessions: () => void;
  deleteSession: (sessionId: string) => void;
}

const AgentChatContext = createContext<AgentChatContextType | null>(null);

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  messagesRef.current = messages;

  // tRPC mutations
  const sendMessageMutation = trpc.agentChat.sendMessage.useMutation();
  const saveHistoryMutation = trpc.agentChat.saveHistory.useMutation();
  const deleteSessionMutation = trpc.agentChat.deleteSession.useMutation();
  const utils = trpc.useUtils();

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await utils.agentChat.listSessions.fetch();
      if (data) {
        setSessions(
          data.map((s) => ({
            sessionId: s.sessionId,
            title: s.title || "新對話",
            lastMessage: s.lastMessage,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messageCount: s.messageCount,
          }))
        );
      }
    } catch (err) {
      console.error("[AgentChat] Failed to fetch sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, [utils]);

  const loadSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    try {
      const data = await utils.agentChat.getSession.fetch({ sessionId });
      if (data && data.messages) {
        setMessages(
          data.messages.map((m) => ({
            id: `${m.role}-${m.id}-${Math.random().toString(36).substring(2, 6)}`,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.createdAt),
            sessionId,
          }))
        );
      }
    } catch (err) {
      console.error("[AgentChat] Failed to load session:", err);
      toast.error("載入對話失敗");
    } finally {
      setIsLoading(false);
    }
  }, [utils]);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim() || isLoading) return;

      const sessionId = currentSessionId || generateSessionId();
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message.trim(),
        timestamp: new Date(),
        sessionId,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Build conversation history from current messages
      const conversationHistory = messagesRef.current.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      sendMessageMutation.mutate(
        {
          message: userMessage.content,
          conversationHistory,
          sessionId,
        },
        {
          onSuccess: (data) => {
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content:
                typeof data.reply === "string"
                  ? data.reply
                  : JSON.stringify(data.reply),
              memorySaved: data.memorySaved,
              timestamp: new Date(),
              sessionId,
            };
            setMessages((prev) => [...prev, assistantMessage]);

            if (data.memorySaved) {
              toast.success("記憶已保存到「我的大腦」", {
                description: "您可以在「我的大腦」頁面查看和管理所有記憶",
              });
            }

            // Save to server history in background
            const updatedMessages = [...messagesRef.current, assistantMessage];
            saveHistoryMutation.mutate({
              sessionId,
              messages: updatedMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            });

            setIsLoading(false);
          },
          onError: (error) => {
            toast.error("發送失敗", { description: error.message });
            setIsLoading(false);
          },
        }
      );
    },
    [currentSessionId, isLoading, sendMessageMutation, saveHistoryMutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    toast.info("對話已清除");
  }, []);

  const deleteSession = useCallback(
    (sessionId: string) => {
      deleteSessionMutation.mutate(
        { sessionId },
        {
          onSuccess: () => {
            setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
            if (currentSessionId === sessionId) {
              setMessages([]);
              setCurrentSessionId(null);
            }
            toast.success("對話已刪除");
          },
          onError: () => {
            toast.error("刪除失敗");
          },
        }
      );
    },
    [deleteSessionMutation, currentSessionId]
  );

  return (
    <AgentChatContext.Provider
      value={{
        messages,
        currentSessionId,
        isLoading,
        sendMessage,
        clearChat,
        loadSession,
        startNewSession,
        sessions,
        sessionsLoading,
        refreshSessions,
        deleteSession,
      }}
    >
      {children}
    </AgentChatContext.Provider>
  );
}

export function useAgentChat() {
  const ctx = useContext(AgentChatContext);
  if (!ctx) throw new Error("useAgentChat must be used within AgentChatProvider");
  return ctx;
}
