import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Crown, Sparkles, Copy, ExternalLink, Check, 
  Plus, Trash2, RefreshCw, Shield, AlertCircle, CheckCircle2, Clock,
  Info, ShoppingCart, Search, Loader2, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DomainManagement from "@/components/DomainManagement";

interface DomainSearchResult {
  domainName: string;
  available: boolean;
  premium: boolean;
  originalPriceUsd: number;
  sellingPriceUsd: number;
  renewalSellingPriceUsd: number;
  minYears: number;
  pricePerYear: number;
}

// ==================== PurchasedDomains Component ====================
function PurchasedDomains() {
  const { data: orders, isLoading, refetch } = trpc.domains.getOrders.useQuery();
  const { data: persona } = trpc.persona.get.useQuery();
  const [bindingOrderId, setBindingOrderId] = useState<number | null>(null);
  const [publishingOrderId, setPublishingOrderId] = useState<number | null>(null);
  const [checkingDnsOrderId, setCheckingDnsOrderId] = useState<number | null>(null);
  const [checkingSslOrderId, setCheckingSslOrderId] = useState<number | null>(null);
  
  const bindPersonaMutation = trpc.domains.bindPersona.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setBindingOrderId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setBindingOrderId(null);
    },
  });
  
  const publishMutation = trpc.domains.publish.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setPublishingOrderId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setPublishingOrderId(null);
    },
  });
  
  const checkDnsStatusMutation = trpc.domains.checkDnsStatus.useMutation({
    onSuccess: (data) => {
      if (data.propagated) {
        toast.success(data.message);
      } else {
        toast.info(data.message);
      }
      setCheckingDnsOrderId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setCheckingDnsOrderId(null);
    },
  });
  
  const checkSslStatusMutation = trpc.domains.checkSslStatus.useMutation({
    onSuccess: (data) => {
      toast.info(data.message);
      setCheckingSslOrderId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setCheckingSslOrderId(null);
    },
  });
  
  const handleBindPersona = (orderId: number) => {
    if (!persona?.id) {
      toast.error('請先設定您的 AI 智能體');
      return;
    }
    setBindingOrderId(orderId);
    bindPersonaMutation.mutate({ orderId, personaId: persona.id });
  };
  
  const handlePublish = (orderId: number) => {
    setPublishingOrderId(orderId);
    publishMutation.mutate({ orderId });
  };
  
  const handleCheckDns = (orderId: number) => {
    setCheckingDnsOrderId(orderId);
    checkDnsStatusMutation.mutate({ orderId });
  };
  
  const handleCheckSsl = (orderId: number) => {
    setCheckingSslOrderId(orderId);
    checkSslStatusMutation.mutate({ orderId });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h3 className="font-medium">尚無購買記錄</h3>
          <p className="text-sm text-muted-foreground mt-1">
            前往「搜索域名」標籤頁開始搜索並購買域名
          </p>
        </div>
      </div>
    );
  }
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_payment: { label: "待支付", variant: "outline" },
      payment_processing: { label: "支付處理中", variant: "secondary" },
      payment_failed: { label: "支付失敗", variant: "destructive" },
      payment_completed: { label: "支付完成", variant: "default" },
      registering: { label: "註冊中", variant: "secondary" },
      registered: { label: "已註冊", variant: "default" },
      failed: { label: "註冊失敗", variant: "destructive" },
      cancelled: { label: "已取消", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        共 {orders.length} 筆訂單
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold text-base">{order.domain}</span>
                </div>
                <p className="text-xs text-muted-foreground">訂單 #{order.id}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
              <div>
                <p className="text-xs text-muted-foreground">購買時間</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">總價</p>
                <p className="font-medium font-mono">${(order.totalPrice / 100).toFixed(2)}</p>
              </div>
            </div>
            
            {/* Registered domain details */}
            {order.status === 'registered' && order.registrationDate && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>域名已成功註冊 — {new Date(order.registrationDate).toLocaleDateString('zh-TW')}</span>
                </div>
                
                {/* DNS & SSL Status Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">DNS 狀態</p>
                      {order.dnsStatus !== 'active' && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                          onClick={() => handleCheckDns(order.id)}
                          disabled={checkingDnsOrderId === order.id}>
                          {checkingDnsOrderId === order.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                    {order.dnsStatus === 'active' && (
                      <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />已生效</Badge>
                    )}
                    {order.dnsStatus === 'propagating' && (
                      <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />傳播中</Badge>
                    )}
                    {order.dnsStatus === 'pending' && (
                      <Badge variant="outline">待配置</Badge>
                    )}
                    {order.dnsStatus === 'error' && (
                      <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />錯誤</Badge>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">SSL 狀態</p>
                      {order.sslStatus !== 'active' && order.dnsStatus === 'active' && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                          onClick={() => handleCheckSsl(order.id)}
                          disabled={checkingSslOrderId === order.id}>
                          {checkingSslOrderId === order.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                    {order.sslStatus === 'active' && (
                      <Badge variant="default" className="bg-green-600"><Shield className="h-3 w-3 mr-1" />已啟用</Badge>
                    )}
                    {order.sslStatus === 'provisioning' && (
                      <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />配置中</Badge>
                    )}
                    {order.sslStatus === 'pending' && (
                      <Badge variant="outline">待申請</Badge>
                    )}
                    {order.sslStatus === 'error' && (
                      <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />錯誤</Badge>
                    )}
                  </div>
                </div>
                
                {/* Persona Binding */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">綁定智能體</p>
                  {order.personaId ? (
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      已綁定到 {persona?.agentName || '智能體'}
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline"
                      onClick={() => handleBindPersona(order.id)}
                      disabled={bindingOrderId === order.id}>
                      {bindingOrderId === order.id
                        ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" />綁定中...</>
                        : <><LinkIcon className="h-3 w-3 mr-2" />綁定智能體</>}
                    </Button>
                  )}
                </div>
                
                {/* Publish / Visit */}
                {order.personaId && order.dnsStatus === 'active' && (
                  <div className="flex items-center gap-2 pt-1">
                    {order.isPublished ? (
                      <>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />已發布
                        </Badge>
                        <Button size="sm" variant="outline"
                          onClick={() => window.open(`https://${order.domain}`, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-2" />訪問網站
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"
                        onClick={() => handlePublish(order.id)}
                        disabled={publishingOrderId === order.id}>
                        {publishingOrderId === order.id
                          ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" />發布中...</>
                          : <><Sparkles className="h-3 w-3 mr-2" />發布網站</>}
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Publishing Requirements */}
                {!order.isPublished && (
                  <Alert className="bg-muted/50 border-muted-foreground/20">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-sm">發布條件</AlertTitle>
                    <AlertDescription className="text-xs space-y-1">
                      {!order.personaId && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                          <span>需要綁定智能體</span>
                        </div>
                      )}
                      {order.dnsStatus !== 'active' && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                          <span>DNS 需要生效（通常需要 5 分鐘 - 48 小時）</span>
                        </div>
                      )}
                      {order.personaId && order.dnsStatus === 'active' && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                          <span>所有條件已滿足，可以發布！</span>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {/* Status-specific messages */}
            {order.status === 'failed' && (
              <div className="pt-2 border-t text-sm space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>註冊失敗，請聯繫客服處理</span>
                </div>
                {order.failureReason && (
                  <p className="text-xs text-muted-foreground ml-6">原因：{order.failureReason}</p>
                )}
              </div>
            )}
            
            {order.status === 'payment_failed' && (
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>支付失敗，請重試</span>
                </div>
              </div>
            )}
            
            {order.status === 'cancelled' && (
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>訂單已取消</span>
                </div>
              </div>
            )}
            
            {(order.status === 'payment_completed' || order.status === 'registering') && (
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                  <span>支付已完成，正在處理域名註冊...</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Main Domain Page ====================
export default function Domain() {
  const { data: persona } = trpc.persona.get.useQuery();
  const { data: domains, refetch: refetchDomains } = trpc.domains.list.useQuery();
  const { data: pricing } = trpc.domains.pricing.useQuery();
  
  const [copied, setCopied] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  
  // Domain search states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);
  const [includeManagementService, setIncludeManagementService] = useState(true);
  
  // Handle payment status from URL
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      toast.success('支付成功！域名正在註冊中，請稍候...');
      window.history.replaceState({}, '', window.location.pathname);
      refetchDomains();
    } else if (paymentStatus === 'cancelled') {
      toast.error('支付已取消');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  
  const addDomainMutation = trpc.domains.add.useMutation({
    onSuccess: () => {
      toast.success("域名已添加，請按照指示設定 DNS 記錄");
      setNewDomain("");
      setIsAddDialogOpen(false);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const searchDomainsMutation = trpc.domains.search.useMutation({
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: (error) => {
      toast.error("搜索失敗：" + error.message);
      setIsSearching(false);
    },
  });
  
  const verifyDnsMutation = trpc.domains.verifyDns.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      refetchDomains();
      setVerifyingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setVerifyingId(null);
    },
  });
  
  const activateSslMutation = trpc.domains.activateSsl.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchDomains();
      setActivatingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setActivatingId(null);
    },
  });
  
  const deleteDomainMutation = trpc.domains.delete.useMutation({
    onSuccess: () => {
      toast.success("域名已刪除");
      refetchDomains();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const createCheckoutSessionMutation = trpc.domains.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      toast.success("正在跳轉到 Stripe 支付頁面...");
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("創建支付會話失敗: " + error.message);
    },
  });
  
  const { data: publishedDomain } = trpc.domains.getPublished.useQuery();
  const { data: subdomainData, refetch: refetchSubdomain } = trpc.subdomain.get.useQuery();
  
  // Subdomain editing states
  const [isEditingSubdomain, setIsEditingSubdomain] = useState(false);
  const [newSubdomain, setNewSubdomainValue] = useState("");
  const [subdomainError, setSubdomainError] = useState("");
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  
  const updateSubdomainMutation = trpc.subdomain.update.useMutation({
    onSuccess: (data) => {
      toast.success(`子域名已更新為 ${data.subdomain}.lulubaby.xyz`);
      setIsEditingSubdomain(false);
      refetchSubdomain();
    },
    onError: (error) => {
      setSubdomainError(error.message);
    },
  });
  
  const checkSubdomainQuery = trpc.subdomain.check.useQuery(
    { subdomain: newSubdomain },
    { enabled: newSubdomain.length >= 3 }
  );
  
  // Priority: published custom domain with subdomain path > main site /s/ route > fallback /chat/id
  const chatUrl = persona 
    ? (publishedDomain?.url && subdomainData?.subdomain
      ? `${publishedDomain.url}/s/${subdomainData.subdomain}` 
      : subdomainData?.subdomain 
        ? `https://lulubaby.xyz/s/${subdomainData.subdomain}` 
        : `${window.location.origin}/chat/${persona.id}`)
    : null;
  
  const subdomainUrl = subdomainData?.subdomain 
    ? `https://lulubaby.xyz/s/${subdomainData.subdomain}` 
    : null;
  
  const copySubdomainUrl = () => {
    if (subdomainUrl) {
      navigator.clipboard.writeText(subdomainUrl);
      setCopiedSubdomain(true);
      toast.success("專屬連結已複製到剪貼板");
      setTimeout(() => setCopiedSubdomain(false), 2000);
    }
  };

  const copyUrl = () => {
    if (chatUrl) {
      navigator.clipboard.writeText(chatUrl);
      setCopied(true);
      toast.success("連結已複製到剪貼板");
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const copyDnsRecord = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("已複製到剪貼板");
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />已啟用</Badge>;
      case 'pending_dns':
        return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock className="h-3 w-3 mr-1" />等待 DNS 設定</Badge>;
      case 'verifying':
        return <Badge variant="outline" className="text-blue-600 border-blue-300"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />驗證中</Badge>;
      case 'ssl_pending':
        return <Badge variant="outline" className="text-purple-600 border-purple-300"><Shield className="h-3 w-3 mr-1" />SSL 配置中</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />錯誤</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error("請輸入域名");
      return;
    }
    addDomainMutation.mutate({ domain: newDomain.trim() });
  };
  
  const handleVerifyDns = (id: number) => {
    setVerifyingId(id);
    verifyDnsMutation.mutate({ id });
  };
  
  const handleActivateSsl = (id: number) => {
    setActivatingId(id);
    activateSslMutation.mutate({ id });
  };
  
  const handleSearchDomains = () => {
    if (!searchKeyword.trim()) {
      toast.error("請輸入要搜索的域名關鍵字");
      return;
    }
    const cleanKeyword = searchKeyword.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanKeyword) {
      toast.error("請輸入有效的域名關鍵字（只能包含英文字母、數字和連字符）");
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
    searchDomainsMutation.mutate({ keyword: searchKeyword });
  };

  const handleSelectDomain = (domain: DomainSearchResult) => {
    if (!domain.available) {
      toast.error("此域名已被註冊，無法購買");
      return;
    }
    setSelectedDomain(domain);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">專屬網址</h1>
        <p className="text-muted-foreground mt-1">設定您的 AI 助手專屬網址，提升品牌專業形象</p>
      </div>

      {/* ===== Section 1: Current Chat URL ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            您目前的對話連結
          </CardTitle>
          <CardDescription className="text-xs">
            將此連結分享給客戶，讓他們可以與您的 AI 助手對話
          </CardDescription>
        </CardHeader>
        <CardContent>
          {persona ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2.5 font-mono text-sm break-all">
                {chatUrl}
              </div>
              <Button onClick={copyUrl} variant="outline" size="icon" className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={() => window.open(chatUrl!, "_blank")} variant="outline" size="icon" className="shrink-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">請先在「版面設定」中完成基本設定</p>
          )}
        </CardContent>
      </Card>

      {/* ===== Section 2: Free Subdomain ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            免費專屬子域名
          </CardTitle>
          <CardDescription className="text-xs">
            每位用戶免費獲得一個專屬 AI 對話連結，無需購買域名
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subdomainData?.subdomain ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-3 py-2.5 font-mono text-sm break-all">
                  https://lulubaby.xyz/s/{subdomainData.subdomain}
                </div>
                <Button onClick={copySubdomainUrl} variant="outline" size="icon" className="shrink-0">
                  {copiedSubdomain ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button onClick={() => window.open(subdomainUrl!, "_blank")} variant="outline" size="icon" className="shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button onClick={() => { setIsEditingSubdomain(true); setNewSubdomainValue(subdomainData.subdomain || ''); setSubdomainError(''); }} variant="outline" size="sm" className="shrink-0">
                  自訂名稱
                </Button>
              </div>
              
              {isEditingSubdomain && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <Label className="text-sm">自訂子域名</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSubdomain}
                      onChange={(e) => { setNewSubdomainValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSubdomainError(''); }}
                      placeholder="your-name"
                      className="font-mono"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.lulubaby.xyz</span>
                  </div>
                  {newSubdomain.length >= 3 && checkSubdomainQuery.data && (
                    <p className={`text-sm ${checkSubdomainQuery.data.available ? 'text-green-600' : 'text-red-600'}`}>
                      {checkSubdomainQuery.data.available ? '\u2713 此子域名可用' : checkSubdomainQuery.data.error || '\u2717 此子域名已被使用'}
                    </p>
                  )}
                  {subdomainError && <p className="text-sm text-red-600">{subdomainError}</p>}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => updateSubdomainMutation.mutate({ subdomain: newSubdomain })}
                      disabled={!checkSubdomainQuery.data?.available || updateSubdomainMutation.isPending}
                      size="sm">
                      {updateSubdomainMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      確認更改
                    </Button>
                    <Button onClick={() => setIsEditingSubdomain(false)} variant="outline" size="sm">
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">子域名正在生成中，請稍後刷新頁面...</p>
          )}
        </CardContent>
      </Card>

      {/* ===== Section 3: Custom Domains (Tabs Layout) ===== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                自訂域名
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                購買或綁定您自己的品牌域名，提供完整的品牌體驗
              </CardDescription>
            </div>
            {/* Connect Existing Domain Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                  <LinkIcon className="h-3.5 w-3.5" />
                  連接現有網域
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>連接現有網域</DialogTitle>
                  <DialogDescription>
                    輸入您已擁有的域名，我們將提供 DNS 設定指示
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">域名</Label>
                    <Input
                      id="domain"
                      placeholder="例如：chat.yourbrand.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      建議使用子域名（如 chat.yourbrand.com），這樣不會影響您的主網站
                    </p>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>域名管理費</AlertTitle>
                    <AlertDescription>
                      連接域名後，我們將收取 $12.99/年 的管理費，包含自動 SSL 證書、DNS 監控和到期提醒。首 14 天免費試用。
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
                  <Button onClick={handleAddDomain} disabled={addDomainMutation.isPending}>
                    {addDomainMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    添加域名
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="search" className="text-xs">搜索域名</TabsTrigger>
              <TabsTrigger value="orders" className="text-xs">已購買</TabsTrigger>
              <TabsTrigger value="manage" className="text-xs">域名管理</TabsTrigger>
              <TabsTrigger value="info" className="text-xs">費用說明</TabsTrigger>
            </TabsList>
            
            {/* Tab: Search Domains */}
            <TabsContent value="search" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="text-sm">輸入您想要的域名關鍵字</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="例如：mybrand"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchDomains()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchDomains} disabled={isSearching} className="gap-2 shrink-0">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    搜索
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  自動搜索 .com、.net、.org、.io、.co、.ai 等常見後綴
                </p>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">搜索結果</Label>
                  <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                    {searchResults.map((result) => (
                      <div 
                        key={result.domainName}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          result.available 
                            ? 'hover:bg-primary/5 cursor-pointer' 
                            : 'opacity-50 bg-muted/30'
                        } ${selectedDomain?.domainName === result.domainName ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
                        onClick={() => handleSelectDomain(result)}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className={`h-4 w-4 shrink-0 ${result.available ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-mono font-medium text-sm">{result.domainName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {result.available ? (
                                <span className="text-xs text-green-600 font-medium">可購買</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">已被註冊</span>
                              )}
                              {result.premium && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] px-1.5 py-0">
                                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />Premium
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {result.available && (
                          <div className="text-right shrink-0 ml-3">
                            {result.premium ? (
                              <>
                                <span className="text-sm font-bold">USD ${result.sellingPriceUsd.toFixed(2)}</span>
                                <p className="text-[10px] text-muted-foreground">
                                  <span className="text-amber-600">一次性購買</span>
                                  <br />續費 ${result.renewalSellingPriceUsd.toFixed(2)}/年
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-bold">USD ${result.pricePerYear.toFixed(2)}/年</span>
                                <p className="text-[10px] text-muted-foreground">
                                  {result.minYears > 1 && (
                                    <><span className="text-amber-600">最低 {result.minYears} 年，總計 ${result.sellingPriceUsd.toFixed(2)}</span><br /></>
                                  )}
                                  續費 ${result.renewalSellingPriceUsd.toFixed(2)}/年
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-muted-foreground text-sm">正在搜索可用域名...</span>
                </div>
              )}
              
              {/* Selected Domain Payment */}
              {selectedDomain && (
                <div className="border-t pt-4 space-y-3">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">已選擇域名</p>
                        <p className="text-lg font-bold font-mono">{selectedDomain.domainName}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedDomain(null)}>更換</Button>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center pb-2 border-b border-green-200 dark:border-green-800">
                        <span className="text-sm">域名費用</span>
                        <span className="font-mono font-medium">USD ${selectedDomain.sellingPriceUsd.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pb-2 border-b border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeManagementService}
                            onChange={(e) => setIncludeManagementService(e.target.checked)}
                            className="rounded border-gray-300"
                            id="management-service"
                          />
                          <label htmlFor="management-service" className="text-sm cursor-pointer">
                            年度管理費
                          </label>
                        </div>
                        <span className="font-mono font-medium">{includeManagementService ? 'USD $12.99' : 'USD $0.00'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-lg font-bold text-primary pt-1">
                        <span>總計</span>
                        <span className="font-mono">USD ${(selectedDomain.sellingPriceUsd + (includeManagementService ? 12.99 : 0)).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      {includeManagementService
                        ? '✓ 包含自動 SSL 證書、DNS 監控、到期提醒'
                        : '✗ 只購買域名，不提供管理服務'}
                    </p>
                    
                    <Button 
                      className="w-full gap-2" 
                      size="lg"
                      onClick={() => {
                        if (selectedDomain) {
                          createCheckoutSessionMutation.mutate({
                            domainName: selectedDomain.domainName,
                            domainPriceUsd: selectedDomain.sellingPriceUsd,
                            includeManagementService,
                          });
                        }
                      }}
                      disabled={createCheckoutSessionMutation.isPending}
                    >
                      {createCheckoutSessionMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />處理中...</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4" />立即購買並支付</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {!selectedDomain && !isSearching && searchResults.length === 0 && (
                <Alert className="bg-muted/30">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-sm">一站式域名購買</AlertTitle>
                  <AlertDescription className="text-xs">
                    搜索域名後，選擇您喜歡的域名即可直接購買。支持 Stripe 支付，安全快速。
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {/* Tab: Purchased Orders */}
            <TabsContent value="orders" className="mt-4">
              <PurchasedDomains />
            </TabsContent>
            
            {/* Tab: Domain Management */}
            <TabsContent value="manage" className="mt-4">
              <DomainManagement />
            </TabsContent>
            
            {/* Tab: Pricing Info */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">域名費用參考</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { tld: '.com', price: '~$10-15/年' },
                      { tld: '.io', price: '~$35-50/年' },
                      { tld: '.ai', price: '~$90-120/年', note: '最低 2 年' },
                      { tld: '.co', price: '~$25-35/年' },
                    ].map(item => (
                      <div key={item.tld} className="p-2.5 bg-muted/50 rounded-lg text-center">
                        <span className="font-mono text-sm font-semibold">{item.tld}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.price}</p>
                        {item.note && <p className="text-[10px] text-amber-600">{item.note}</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    * 價格已包含 30% 服務費，實際價格以搜索結果為準
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">域名管理費</h4>
                  <p className="text-2xl font-bold text-primary">USD $12.99<span className="text-xs font-normal text-muted-foreground">/年</span></p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">首 14 天免費試用</p>
                  <div className="space-y-1.5 text-xs">
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />自動 SSL 證書</p>
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />DNS 狀態監控</p>
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />到期提醒通知</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ===== Section 4: Connected Domains List ===== */}
      {domains && domains.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              已連接的域名
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {domains.map((domain) => (
              <div 
                key={domain.id}
                className="border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-mono font-medium">{domain.domain}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(domain.status)}
                        {domain.status === 'active' && domain.sslEnabled && (
                          <Badge className="bg-green-500/10 text-green-600">
                            <Shield className="h-3 w-3 mr-1" />SSL
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => {
                      if (confirm("確定要刪除此域名嗎？")) {
                        deleteDomainMutation.mutate({ id: domain.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* DNS Setup Instructions */}
                {(domain.status === 'pending_dns' || domain.status === 'verifying') && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">DNS 設定指示：</p>
                    <div className="grid gap-3 md:grid-cols-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">類型</p>
                        <p className="font-mono font-medium">{domain.dnsRecordType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">名稱</p>
                        <p className="font-mono font-medium">{domain.subdomain || '@'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">值</p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono truncate">{domain.dnsRecordValue}</p>
                          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                            onClick={() => copyDnsRecord(domain.dnsRecordValue!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="mt-2"
                      onClick={() => handleVerifyDns(domain.id)}
                      disabled={verifyingId === domain.id}>
                      {verifyingId === domain.id
                        ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        : <RefreshCw className="h-4 w-4 mr-2" />}
                      驗證 DNS
                    </Button>
                  </div>
                )}
                
                {/* SSL Activation */}
                {domain.status === 'ssl_pending' && (
                  <Button size="sm"
                    onClick={() => handleActivateSsl(domain.id)}
                    disabled={activatingId === domain.id}>
                    {activatingId === domain.id
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <Shield className="h-4 w-4 mr-2" />}
                    啟用 SSL
                  </Button>
                )}
                
                {/* Active Domain */}
                {domain.status === 'active' && (
                  <Button size="sm" variant="outline"
                    onClick={() => window.open(`https://${domain.domain}`, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />訪問網站
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ===== Pricing Footer ===== */}
      {pricing && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              <span className="font-medium">域名管理費</span>
            </div>
            <div className="text-right">
              <span className="font-bold">${pricing.annualFee}/年</span>
              <span className="text-muted-foreground ml-2 text-xs">（首 {pricing.trialDays} 天免費）</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pricing.features.map((feature, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
