import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Crown, ChevronRight, Sparkles, Copy, ExternalLink, Check, 
  Plus, Trash2, RefreshCw, Shield, AlertCircle, CheckCircle2, Clock,
  Info, ShoppingCart, ArrowRight, Search, Loader2, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
// Currency removed - all prices in USD
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

interface DomainSearchResult {
  domainName: string;
  available: boolean;
  premium: boolean;
  originalPriceUsd: number;
  sellingPriceUsd: number;
  renewalSellingPriceUsd: number;
  minYears: number; // 最低購買年限
  pricePerYear: number; // 每年價格（USD）
  // All prices in USD
}

// 已購買域名列表組件
function PurchasedDomains() {
  const { data: orders, isLoading } = trpc.domains.getOrders.useQuery();
  
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
            您還沒有購買任何域名，去「搜索域名」標籤頁開始搜索吧！
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
      
      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.domain}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  訂單 ID: {order.id}
                </div>
              </div>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">購買時間</div>
                <div className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">總價</div>
                <div className="font-medium">
                  ${(order.totalPrice / 100).toFixed(2)}
                </div>
              </div>
            </div>
            
            {order.status === 'registered' && order.registrationDate && (
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>域名已成功註冊！註冊時間：{new Date(order.registrationDate).toLocaleDateString('zh-TW')}</span>
                </div>
              </div>
            )}
            
            {order.status === 'failed' && (
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>註冊失敗，請聯繫客服處理</span>
                </div>
              </div>
            )}
            
            {(order.status === 'payment_completed' || order.status === 'registering') && (
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="h-4 w-4" />
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

export default function Domain() {
  const { data: persona } = trpc.persona.get.useQuery();
  const { data: domains, refetch: refetchDomains } = trpc.domains.list.useQuery();
  const { data: pricing } = trpc.domains.pricing.useQuery();
  
  const [copied, setCopied] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  
  // Domain search states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);
  const [includeManagementService, setIncludeManagementService] = useState(true); // 可選的域名管理服務
  
  // Handle payment status from URL
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      toast.success('支付成功！域名正在註冊中，請稍候...');
      // Clear URL parameters
      window.history.replaceState({}, '', '/domain');
      refetchDomains();
    } else if (paymentStatus === 'cancelled') {
      toast.error('支付已取消');
      // Clear URL parameters
      window.history.replaceState({}, '', '/domain');
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
      // 跳轉到 Stripe Checkout 頁面
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("創建支付會話失敗: " + error.message);
    },
  });
  
  const chatUrl = persona ? `${window.location.origin}/chat/${persona.id}` : null;

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
    // Clean the keyword - remove spaces and special characters
    const cleanKeyword = searchKeyword.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanKeyword) {
      toast.error("請輸入有效的域名關鍵字（只能包含英文字母、數字和連字符）");
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
    searchDomainsMutation.mutate({
      keyword: searchKeyword,
    });
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">專屬網址</h1>
        <p className="text-muted-foreground mt-1">設定您的AI助手專屬網址，提升品牌專業形象</p>
      </div>

      {/* Current URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            您目前的對話連結
          </CardTitle>
          <CardDescription>
            將此連結分享給您的客戶，讓他們可以與您的AI助手對話
          </CardDescription>
        </CardHeader>
        <CardContent>
          {persona ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all">
                {chatUrl}
              </div>
              <Button onClick={copyUrl} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={() => window.open(chatUrl!, "_blank")} variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">請先在「AI設定」中完成基本設定</p>
          )}
        </CardContent>
      </Card>

      {/* Custom Domains Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              自訂域名
            </CardTitle>
            <CardDescription>
              綁定您自己的品牌域名，提供完整的品牌體驗
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Buy New Domain Button */}
            <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  自訂網域
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    自訂網域
                  </DialogTitle>
                  <DialogDescription>
                    搜索並購買您的專屬品牌域名
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="search" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="search">搜索域名</TabsTrigger>
                    <TabsTrigger value="orders">已購買</TabsTrigger>
                    <TabsTrigger value="info">費用說明</TabsTrigger>
                  </TabsList>
                  <TabsContent value="search" className="space-y-3 mt-3">
                    {/* Domain Search */}
                    <div className="space-y-3">
                      <Label>輸入您想要的域名關鍵字</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="例如：mybrand"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchDomains()}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSearchDomains} 
                          disabled={isSearching}
                          className="gap-2"
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          搜索
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        我們會自動搜索 .com、.net、.org、.io、.co、.ai 等常見後綴
                      </p>
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                    <div className="space-y-1.5">
                        <Label>搜索結果</Label>
                        <div className="border rounded-lg divide-y max-h-[150px] overflow-y-auto">
                          {searchResults.map((result) => (
                            <div 
                              key={result.domainName}
                              className={`flex items-center justify-between p-2 ${
                                result.available 
                                  ? 'hover:bg-muted/50 cursor-pointer' 
                                  : 'opacity-60 bg-muted/30'
                              }`}
                              onClick={() => handleSelectDomain(result)}
                            >
                              <div className="flex items-center gap-3">
                                <Globe className={`h-3 w-3 ${result.available ? 'text-green-600' : 'text-muted-foreground'}`} />
                                <div>
                                  <p className="font-mono font-medium text-sm">{result.domainName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {result.available ? (
                                      <span className="text-xs text-green-600">可購買</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">已被註冊</span>
                                    )}
                                    {result.premium && (
                                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Premium
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {result.available && (
                                 <div className="text-right">
                                   {result.premium ? (
                                     // Premium 域名：顯示一次性購買價格
                                     <>
                                       <span className="text-base font-bold">${result.sellingPriceUsd.toFixed(2)}</span>
                                       <p className="text-xs text-muted-foreground">
                                         <span className="text-amber-600">一次性購買<br/></span>
                                         續費 ${result.renewalSellingPriceUsd.toFixed(2)}/年
                                       </p>
                                     </>
                                   ) : (
                                     // 普通域名：顯示每年價格
                                     <>
                                       <span className="text-base font-bold">${result.pricePerYear.toFixed(2)}/年</span>
                                       <p className="text-xs text-muted-foreground">
                                         {result.minYears > 1 && (
                                           <span className="text-amber-600">最低 {result.minYears} 年，總計 ${result.sellingPriceUsd.toFixed(2)}<br/></span>
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
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">正在搜索可用域名...</span>
                      </div>
                    )}
                    
                    {/* Selected Domain Payment */}
                    {selectedDomain && (
                      <div className="space-y-3 border-t pt-3">
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">已選擇域名</p>
                              <p className="text-lg font-bold font-mono">{selectedDomain.domainName}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedDomain(null)}>更換</Button>
                          </div>
                          
                            <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center pb-2 border-b">
                              <span className="text-sm">域名費用</span>
                              <span className="font-mono">${selectedDomain.sellingPriceUsd.toFixed(2)}</span>
                            </div>
                            
                            {/* Management Service Toggle */}
                            <div className="flex items-center justify-between pb-2 border-b">
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
                              <span className="font-mono">{includeManagementService ? '$12.99' : '$0.00'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-lg font-bold text-primary">
                              <span>總計</span>
                              <span className="font-mono">${(selectedDomain.sellingPriceUsd + (includeManagementService ? 12.99 : 0)).toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            {includeManagementService ? (
                              <p>✓ 包含自動 SSL 證書、DNS 監控、到期提醒</p>
                            ) : (
                              <p>✗ 只購買域名，不提供管理服務</p>
                            )}
                          </div>
                          
                          <Button 
                            className="w-full gap-2" 
                            size="lg"
                            onClick={() => {
                              if (selectedDomain) {
                                createCheckoutSessionMutation.mutate({
                                  domainName: selectedDomain.domainName,
                                  domainPriceUsd: selectedDomain.sellingPriceUsd,
                                  includeManagementService: includeManagementService,
                                });
                              }
                            }}
                            disabled={createCheckoutSessionMutation.isPending}
                          >
                            {createCheckoutSessionMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                處理中...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4" />
                                立即購買並支付
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Coming Soon Notice */}
                    {!selectedDomain && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>一站式域名購買</AlertTitle>
                        <AlertDescription>
                          搜索域名後，選擇您喜歡的域名即可直接購買。我們支持 Stripe 支付，安全快速。
                        </AlertDescription>
                      </Alert>
                    )}
                    

                  </TabsContent>
                  
                  <TabsContent value="orders" className="space-y-3 mt-3">
                    <PurchasedDomains />
                  </TabsContent>
                  
                  <TabsContent value="info" className="space-y-4 mt-4">
                    {/* Pricing Info */}
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">域名費用（一次性）</h4>
                        <div className="grid grid-cols-2 gap-1.5 text-center">
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="font-mono text-lg">.com</span>
                            <p className="text-sm text-muted-foreground mt-1">~$10-15/年</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="font-mono text-lg">.io</span>
                            <p className="text-sm text-muted-foreground mt-1">~$35-50/年</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="font-mono text-lg">.ai</span>
                            <p className="text-sm text-muted-foreground mt-1">~$90-120/年</p>
                            <p className="text-xs text-amber-600 mt-0.5">最低 2 年</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          * 價格已包含 30% 服務費，實際價格以搜索結果為準
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">域名管理費</h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-primary">$12.99<span className="text-sm font-normal text-muted-foreground">/年</span></p>
                            <p className="text-sm text-muted-foreground mt-1">首 14 天免費試用</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> 自動 SSL 證書</p>
                            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> DNS 狀態監控</p>
                            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> 到期提醒通知</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            
            {/* Connect Existing Domain Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
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
                  <div className="space-y-4">
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
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleAddDomain}
                    disabled={addDomainMutation.isPending}
                  >
                    {addDomainMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    添加域名
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Domain List */}
          {domains && domains.length > 0 ? (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div 
                  key={domain.id}
                  className="border rounded-lg p-4 space-y-3"
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
                              <Shield className="h-3 w-3 mr-1" />
                              SSL
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
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
                    <div className="bg-muted rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">DNS 設定指示：</p>
                     <div className="grid gap-3 md:grid-cols-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">類型</p>
                          <p className="font-mono">{domain.dnsRecordType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">名稱</p>
                          <p className="font-mono">{domain.subdomain || '@'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">值</p>
                          <div className="flex items-center gap-1">
                            <p className="font-mono truncate">{domain.dnsRecordValue}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => copyDnsRecord(domain.dnsRecordValue!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyDns(domain.id)}
                          disabled={verifyingId === domain.id}
                        >
                          {verifyingId === domain.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          驗證 DNS
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* SSL Activation */}
                  {domain.status === 'ssl_pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleActivateSsl(domain.id)}
                        disabled={activatingId === domain.id}
                      >
                        {activatingId === domain.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        啟用 SSL
                      </Button>
                    </div>
                  )}
                  
                  {/* Active Domain */}
                  {domain.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        訪問網站
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>您還沒有設定自訂域名</p>
              <p className="text-sm mt-1">點擊上方按鈕開始設定</p>
            </div>
          )}
          
          {/* Pricing Info */}
          {pricing && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span>域名管理費</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">${pricing.annualFee}/年</span>
                  <span className="text-muted-foreground ml-2">（首 {pricing.trialDays} 天免費）</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {pricing.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
