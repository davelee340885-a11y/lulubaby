import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Shield, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  Loader2, ExternalLink, Settings, Zap, Info, Copy, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type DnsStatus = 'pending' | 'configuring' | 'propagating' | 'active' | 'error';
type SslStatus = 'pending' | 'provisioning' | 'active' | 'error';

interface DomainOrder {
  id: number;
  domain: string;
  dnsStatus: DnsStatus;
  sslStatus: SslStatus;
  registrationDate: Date | null;
  expirationDate: Date | null;
  targetHost: string | null;
  nameservers: string | null;
  cloudflareZoneId: string | null;
  dnsErrorMessage: string | null;
  sslErrorMessage: string | null;
}

function DnsStatusBadge({ status }: { status: DnsStatus }) {
  const config: Record<DnsStatus, { label: string; icon: React.ReactNode; className: string }> = {
    pending: { 
      label: "待配置", 
      icon: <Clock className="h-3 w-3" />, 
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" 
    },
    configuring: { 
      label: "配置中", 
      icon: <Loader2 className="h-3 w-3 animate-spin" />, 
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
    },
    propagating: { 
      label: "傳播中", 
      icon: <RefreshCw className="h-3 w-3 animate-spin" />, 
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" 
    },
    active: { 
      label: "已生效", 
      icon: <CheckCircle2 className="h-3 w-3" />, 
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
    },
    error: { 
      label: "錯誤", 
      icon: <AlertCircle className="h-3 w-3" />, 
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" 
    },
  };

  const { label, icon, className } = config[status];

  return (
    <Badge className={`gap-1 ${className}`}>
      {icon}
      DNS: {label}
    </Badge>
  );
}

function SslStatusBadge({ status }: { status: SslStatus }) {
  const config: Record<SslStatus, { label: string; icon: React.ReactNode; className: string }> = {
    pending: { 
      label: "待申請", 
      icon: <Clock className="h-3 w-3" />, 
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" 
    },
    provisioning: { 
      label: "申請中", 
      icon: <Loader2 className="h-3 w-3 animate-spin" />, 
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" 
    },
    active: { 
      label: "已啟用", 
      icon: <Shield className="h-3 w-3" />, 
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
    },
    error: { 
      label: "錯誤", 
      icon: <AlertCircle className="h-3 w-3" />, 
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" 
    },
  };

  const { label, icon, className } = config[status];

  return (
    <Badge className={`gap-1 ${className}`}>
      {icon}
      SSL: {label}
    </Badge>
  );
}

function DomainCard({ domain, onRefresh }: { domain: DomainOrder; onRefresh: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [isCheckingSsl, setIsCheckingSsl] = useState(false);

  const setupDomainMutation = trpc.domains.setupDomain.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else if (data.requiresManualSetup) {
        toast.info("需要手動配置 DNS");
      } else {
        toast.error(data.error || "配置失敗");
      }
      setIsSettingUp(false);
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSettingUp(false);
    },
  });

  const checkDnsMutation = trpc.domains.checkDnsStatus.useMutation({
    onSuccess: (data) => {
      if (data.propagated) {
        toast.success(data.message);
      } else {
        toast.info(data.message);
      }
      setIsCheckingDns(false);
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsCheckingDns(false);
    },
  });

  const checkSslMutation = trpc.domains.checkSslStatus.useMutation({
    onSuccess: (data) => {
      toast.info(data.message);
      setIsCheckingSsl(false);
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsCheckingSsl(false);
    },
  });

  const handleSetup = () => {
    setIsSettingUp(true);
    setupDomainMutation.mutate({ orderId: domain.id });
  };

  const handleCheckDns = () => {
    setIsCheckingDns(true);
    checkDnsMutation.mutate({ orderId: domain.id });
  };

  const handleCheckSsl = () => {
    setIsCheckingSsl(true);
    checkSslMutation.mutate({ orderId: domain.id });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已複製到剪貼板");
  };

  const isFullyActive = domain.dnsStatus === 'active' && domain.sslStatus === 'active';
  const needsSetup = domain.dnsStatus === 'pending';
  const isInProgress = domain.dnsStatus === 'configuring' || domain.dnsStatus === 'propagating' || domain.sslStatus === 'provisioning';

  return (
    <Card className={`transition-all ${isFullyActive ? 'border-green-200 dark:border-green-800' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFullyActive ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
              <Globe className={`h-5 w-5 ${isFullyActive ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-mono">{domain.domain}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {domain.registrationDate && (
                  <span>註冊於 {new Date(domain.registrationDate).toLocaleDateString('zh-TW')}</span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DnsStatusBadge status={domain.dnsStatus} />
            <SslStatusBadge status={domain.sslStatus} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {needsSetup && (
            <Button 
              onClick={handleSetup} 
              disabled={isSettingUp}
              className="gap-2"
            >
              {isSettingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              一鍵配置 DNS
            </Button>
          )}
          
          {(domain.dnsStatus === 'propagating' || domain.dnsStatus === 'configuring') && (
            <Button 
              variant="outline" 
              onClick={handleCheckDns} 
              disabled={isCheckingDns}
              className="gap-2"
            >
              {isCheckingDns ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              檢查 DNS 狀態
            </Button>
          )}
          
          {domain.dnsStatus === 'active' && domain.sslStatus !== 'active' && (
            <Button 
              variant="outline" 
              onClick={handleCheckSsl} 
              disabled={isCheckingSsl}
              className="gap-2"
            >
              {isCheckingSsl ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              檢查 SSL 狀態
            </Button>
          )}
          
          {isFullyActive && (
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://${domain.domain}`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              訪問網站
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {domain.dnsStatus === 'error' && domain.dnsErrorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>DNS 配置錯誤</AlertTitle>
            <AlertDescription>{domain.dnsErrorMessage}</AlertDescription>
          </Alert>
        )}

        {domain.sslStatus === 'error' && domain.sslErrorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>SSL 配置錯誤</AlertTitle>
            <AlertDescription>{domain.sslErrorMessage}</AlertDescription>
          </Alert>
        )}

        {isInProgress && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>正在配置中</AlertTitle>
            <AlertDescription>
              DNS 傳播通常需要 24-48 小時，但有時可能更快完成。您可以隨時點擊「檢查狀態」按鈕查看最新進度。
            </AlertDescription>
          </Alert>
        )}

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                詳細配置資訊
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">目標主機</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">{domain.targetHost || 'lulubaby.manus.space'}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(domain.targetHost || 'lulubaby.manus.space')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {domain.cloudflareZoneId && (
                  <div>
                    <p className="text-muted-foreground">Cloudflare Zone ID</p>
                    <p className="font-mono text-xs truncate">{domain.cloudflareZoneId}</p>
                  </div>
                )}
                
                {domain.expirationDate && (
                  <div>
                    <p className="text-muted-foreground">到期日期</p>
                    <p className="font-medium">{new Date(domain.expirationDate).toLocaleDateString('zh-TW')}</p>
                  </div>
                )}
              </div>

              {domain.nameservers && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Nameservers</p>
                  <div className="space-y-1">
                    {JSON.parse(domain.nameservers).map((ns: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded">{ns}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(ns)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual DNS Setup Instructions */}
              {needsSetup && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium mb-2">手動 DNS 配置指示：</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      <span>登入您的域名註冊商管理後台</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      <span>添加 CNAME 記錄，指向 <code className="bg-muted px-1 rounded">lulubaby.manus.space</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      <span>等待 DNS 傳播完成（通常 24-48 小時）</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      <span>回來點擊「檢查 DNS 狀態」按鈕</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default function DomainManagement() {
  const { data: summary, isLoading, refetch } = trpc.domains.getManagementSummary.useQuery();
  const { data: cloudflareStatus } = trpc.domains.getCloudflareStatus.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary || summary.totalDomains === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg">尚無已註冊的域名</h3>
              <p className="text-sm text-muted-foreground mt-1">
                購買域名後，您可以在這裡管理 DNS 配置和 SSL 證書
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{summary.totalDomains}</p>
              <p className="text-sm text-muted-foreground">總域名數</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{summary.activeCount}</p>
              <p className="text-sm text-muted-foreground">已上線</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{summary.pendingCount}</p>
              <p className="text-sm text-muted-foreground">配置中</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{summary.errorCount}</p>
              <p className="text-sm text-muted-foreground">需處理</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cloudflare Status */}
      {cloudflareStatus && (
        <>
          {cloudflareStatus.configured && cloudflareStatus.tokenValid ? (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Cloudflare 已連接</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                API Token 驗證成功，可以自動配置 DNS 和 SSL。
              </AlertDescription>
            </Alert>
          ) : cloudflareStatus.configured && !cloudflareStatus.tokenValid ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cloudflare Token 無效</AlertTitle>
              <AlertDescription>
                {('tokenError' in cloudflareStatus && cloudflareStatus.tokenError) || 'API Token 驗證失敗，請檢查設定。'}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Cloudflare 自動配置未啟用</AlertTitle>
              <AlertDescription>
                {cloudflareStatus.message} 您仍可以手動配置 DNS 記錄。
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Domain List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">域名管理</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
        
        <div className="space-y-4">
          {summary.domains.map((domain) => (
            <DomainCard 
              key={domain.id} 
              domain={domain as DomainOrder} 
              onRefresh={refetch} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
