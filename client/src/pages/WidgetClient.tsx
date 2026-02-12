/**
 * WidgetClient - Lightweight chat page designed to be loaded inside widget.js iframe
 * 
 * URL: /widget-client?agentId=1
 * 
 * This is a minimal wrapper that extracts agentId from query params
 * and renders the CustomerChatClient in a compact, borderless layout
 * suitable for iframe embedding.
 */
import CustomerChatClient from "@/components/CustomerChatClient";
import { useSearch } from "wouter";
import { useMemo } from "react";

export default function WidgetClient() {
  const searchString = useSearch();
  
  const agentId = useMemo(() => {
    const params = new URLSearchParams(searchString);
    const id = params.get("agentId");
    return id ? parseInt(id, 10) : null;
  }, [searchString]);

  if (!agentId || isNaN(agentId)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground text-sm">
        <p>Widget 配置錯誤：缺少 agentId 參數</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <CustomerChatClient 
        personaId={agentId} 
        sessionKey={`widget-${agentId}`}
      />
    </div>
  );
}
