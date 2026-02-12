/**
 * CustomDomainChat - Access AI chat via custom domain or lulubaby.xyz subdomain
 * 
 * Lightweight wrapper that resolves hostname to personaId
 * and renders the unified CustomerChatClient component.
 * 
 * Supports two routing modes:
 * 1. xxx.lulubaby.xyz subdomains → subdomain.resolve API
 * 2. Other custom domains → domains.getPublishedDomain API
 */
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CustomerChatClient from "@/components/CustomerChatClient";

export default function CustomDomainChat() {
  const currentDomain = window.location.hostname;
  const isLulubabySubdomain = currentDomain.endsWith('.lulubaby.xyz') && currentDomain !== 'lulubaby.xyz';
  const lulubabySubdomain = isLulubabySubdomain ? currentDomain.replace('.lulubaby.xyz', '') : null;

  // For lulubaby.xyz subdomains, use subdomain.resolve API
  const { data: subdomainInfo, isLoading: subdomainLoading, error: subdomainError } = trpc.subdomain.resolve.useQuery(
    { subdomain: lulubabySubdomain! },
    { enabled: isLulubabySubdomain && !!lulubabySubdomain }
  );

  // For custom domains, use domains.getPublishedDomain API
  const { data: domainInfo, isLoading: domainLoading, error: domainError } = trpc.domains.getPublishedDomain.useQuery(
    { domain: currentDomain },
    { enabled: !isLulubabySubdomain }
  );

  const personaId = isLulubabySubdomain ? (subdomainInfo?.personaId || 0) : (domainInfo?.personaId || 0);
  const isLoading = isLulubabySubdomain ? subdomainLoading : domainLoading;
  const hasError = isLulubabySubdomain ? (subdomainError || !subdomainInfo) : (domainError || !domainInfo);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if ((!isLoading && hasError) || !personaId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>域名未配置</AlertTitle>
          <AlertDescription>
            此域名（{currentDomain}）尚未配置或未發布。
            <br /><br />
            如果您是網站擁有者，請前往管理後台完成以下步驟：
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>確認域名已成功註冊</li>
              <li>綁定域名到 AI 智能體</li>
              <li>等待 DNS 生效</li>
              <li>點擊「發布網站」按鈕</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <CustomerChatClient
      personaId={personaId}
      sessionKey={`domain-${currentDomain}`}
    />
  );
}
