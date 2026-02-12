/**
 * SubdomainChat - Access AI chat via main site route /s/:subdomain
 * 
 * Lightweight wrapper that resolves subdomain to personaId
 * and renders the unified CustomerChatClient component.
 * 
 * Route: /s/:subdomain
 */
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CustomerChatClient from "@/components/CustomerChatClient";

export default function SubdomainChat() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params.subdomain || "";

  // Resolve subdomain to persona
  const { data: subdomainInfo, isLoading: subdomainLoading, error: subdomainError } = trpc.subdomain.resolve.useQuery(
    { subdomain },
    { enabled: !!subdomain }
  );

  const personaId = subdomainInfo?.personaId || 0;

  // Loading state
  if (subdomainLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // Error: subdomain not found
  if (subdomainError || !subdomainInfo || !personaId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>找不到此智能體</AlertTitle>
          <AlertDescription>
            子域名「{subdomain}」尚未配置或不存在。
            <br /><br />
            請確認網址是否正確，或聯繫智能體擁有者。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <CustomerChatClient
      personaId={personaId}
      sessionKey={`s-${subdomain}`}
    />
  );
}
