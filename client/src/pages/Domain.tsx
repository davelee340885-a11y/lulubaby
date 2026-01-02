import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Crown, ChevronRight, Sparkles, Copy, ExternalLink, Check, 
  Plus, Trash2, RefreshCw, Shield, AlertCircle, CheckCircle2, Clock,
  Info, ShoppingCart, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
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
  
  const addDomainMutation = trpc.domains.add.useMutation({
    onSuccess: (data) => {
      toast.success("域名已添加，請按照指示設定 DNS 記錄");
      setNewDomain("");
      setIsAddDialogOpen(false);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(error.message);
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
  
  const handleOpenManusDomains = () => {
    // Open Manus Management UI Domains panel in new tab
    window.open('https://manus.im/domains', '_blank');
    toast.info("已在新分頁開啟 Manus 域名商店，購買完成後請返回此頁面連接域名");
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
                  <ShoppingCart className="h-4 w-4" />
                  購買新域名
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    購買新域名
                  </DialogTitle>
                  <DialogDescription>
                    只需 3 個簡單步驟，即可擁有專屬品牌域名
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Step 1 */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-foreground">1</span>
                      </div>
                      <div>
                        <p className="font-medium">搜索並購買域名</p>
                        <p className="text-sm text-muted-foreground">在 Manus 域名商店搜索您想要的域名</p>
                      </div>
                    </div>
                    <div className="ml-11 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        💡 建議選擇簡短易記的域名，如 <span className="font-mono">chat.yourbrand.com</span>
                      </p>
                      <div className="bg-muted rounded-lg p-3 text-xs">
                        <p className="font-medium mb-2">參考價格（由 Manus 收取）：</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <span className="font-mono">.com</span>
                            <p className="text-muted-foreground">~HK$80-120/年</p>
                          </div>
                          <div className="text-center">
                            <span className="font-mono">.io</span>
                            <p className="text-muted-foreground">~HK$280-350/年</p>
                          </div>
                          <div className="text-center">
                            <span className="font-mono">.ai</span>
                            <p className="text-muted-foreground">~HK$600-800/年</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full gap-2" 
                        onClick={handleOpenManusDomains}
                      >
                        前往 Manus 購買域名
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">2</span>
                      </div>
                      <div>
                        <p className="font-medium">返回 Lulubaby 連接域名</p>
                        <p className="text-sm text-muted-foreground">購買完成後，返回此頁面點擊「連接現有域名」</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">3</span>
                      </div>
                      <div>
                        <p className="font-medium">設定 DNS 並啟用</p>
                        <p className="text-sm text-muted-foreground">按照指示設定 DNS，完成後自動啟用 SSL</p>
                      </div>
                    </div>
                  </div>

                  {/* Fee Explanation */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>費用說明</AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p><strong>域名註冊費</strong>：由 Manus 收取（視域名後綴而定）</p>
                      <p><strong>域名管理費</strong>：HK${pricing?.annualFee || 99}/年（由 Lulubaby 收取）</p>
                      <p className="text-xs text-muted-foreground">包含：自動 SSL 證書、DNS 監控、到期提醒</p>
                      <p className="text-xs text-muted-foreground">首 {pricing?.trialDays || 14} 天免費試用域名管理服務</p>
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBuyDialogOpen(false)}>
                    關閉
                  </Button>
                  <Button onClick={() => {
                    setIsBuyDialogOpen(false);
                    setIsAddDialogOpen(true);
                  }} className="gap-2">
                    我已購買，連接域名
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Connect Existing Domain Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  連接現有域名
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>連接自訂域名</DialogTitle>
                  <DialogDescription>
                    輸入您想要綁定的域名，例如 chat.yourbrand.com
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">域名</Label>
                    <Input
                      id="domain"
                      placeholder="chat.yourbrand.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>域名管理費</AlertTitle>
                    <AlertDescription>
                      HK${pricing?.annualFee || 99}/年，包含自動 SSL 證書、DNS 監控和到期提醒。
                      首 {pricing?.trialDays || 14} 天免費試用。
                    </AlertDescription>
                  </Alert>
                  <div className="text-xs text-muted-foreground">
                    <p>💡 還沒有域名？<button 
                      className="text-primary underline hover:no-underline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setIsBuyDialogOpen(true);
                      }}
                    >點此購買新域名</button></p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddDomain} disabled={addDomainMutation.isPending}>
                    {addDomainMutation.isPending ? "添加中..." : "連接域名"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {domains && domains.length > 0 ? (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <span className="font-mono font-medium">{domain.domain}</span>
                      {getStatusBadge(domain.status)}
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
                  
                  {/* DNS Instructions */}
                  {domain.status === 'pending_dns' && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">DNS 設定指示</AlertTitle>
                      <AlertDescription className="text-amber-700 space-y-2">
                        <p>請在您的域名 DNS 設定中添加以下記錄：</p>
                        <div className="bg-white rounded p-3 space-y-2 font-mono text-sm">
                          <div className="flex items-center justify-between">
                            <span>類型: <strong>CNAME</strong></span>
                            <span>主機: <strong>{domain.subdomain || '@'}</strong></span>
                            <span>值: <strong>{domain.dnsRecordValue}</strong></span>
                            <Button size="sm" variant="ghost" onClick={() => copyDnsRecord(domain.dnsRecordValue || '')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleVerifyDns(domain.id)}
                            disabled={verifyingId === domain.id}
                          >
                            {verifyingId === domain.id ? (
                              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />驗證中...</>
                            ) : (
                              <><RefreshCw className="h-4 w-4 mr-2" />驗證 DNS</>
                            )}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* SSL Activation */}
                  {domain.status === 'ssl_pending' && (
                    <Alert className="bg-purple-50 border-purple-200">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <AlertTitle className="text-purple-800">DNS 驗證成功</AlertTitle>
                      <AlertDescription className="text-purple-700">
                        <p>DNS 已正確設定，現在可以啟用 SSL 證書。</p>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleActivateSsl(domain.id)}
                          disabled={activatingId === domain.id}
                        >
                          {activatingId === domain.id ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />啟用中...</>
                          ) : (
                            <><Shield className="h-4 w-4 mr-2" />啟用 SSL</>
                          )}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Active Domain */}
                  {domain.status === 'active' && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        SSL 已啟用
                      </span>
                      {domain.sslExpiresAt && (
                        <span>
                          證書到期: {new Date(domain.sslExpiresAt).toLocaleDateString('zh-HK')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        域名已生效
                      </span>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {domain.status === 'error' && domain.lastErrorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>錯誤</AlertTitle>
                      <AlertDescription>
                        {domain.lastErrorMessage}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mt-2"
                          onClick={() => handleVerifyDns(domain.id)}
                        >
                          重新驗證
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>尚未添加自訂域名</p>
              <p className="text-sm mt-1">添加您的品牌域名，提升專業形象</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsBuyDialogOpen(true)} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  購買新域名
                </Button>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  連接現有域名
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Options */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Free Option */}
        <Card className="relative">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              免費
            </span>
          </div>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-base">系統網址</CardTitle>
            <CardDescription className="text-xs">免費使用系統自動生成的對話連結</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
              yoursite.manus.space/chat/1
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ 永久免費</li>
              <li>✓ 即時可用</li>
              <li>✓ SSL安全加密</li>
            </ul>
          </CardContent>
        </Card>

        {/* Subdomain Option */}
        <Card className="relative border-primary/30">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              推薦
            </span>
          </div>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">自訂子域名</CardTitle>
            <CardDescription className="text-xs">自訂您的專屬子域名前綴</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
              <span className="text-primary font-semibold">yourname</span>.manus.space
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ 專業品牌形象</li>
              <li>✓ 易於記憶分享</li>
              <li>✓ 在設定面板修改</li>
            </ul>
          </CardContent>
        </Card>

        {/* Custom Domain Option */}
        <Card className="relative border-amber-300/50">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
              HK${pricing?.annualFee || 99}/年
            </span>
          </div>
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-2">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-base">自訂域名</CardTitle>
            <CardDescription className="text-xs">綁定您自己的品牌域名</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
              ai.<span className="text-primary font-semibold">yourbrand</span>.com
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ 完整品牌體驗</li>
              <li>✓ 自動 SSL 證書</li>
              <li>✓ DNS 監控 &amp; 到期提醒</li>
            </ul>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 gap-2"
              onClick={() => setIsBuyDialogOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              購買域名
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How to Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">如何設定自訂域名？</CardTitle>
          <CardDescription>只需三個簡單步驟即可完成設定</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">購買或準備域名</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <button 
                    className="text-primary underline hover:no-underline"
                    onClick={() => setIsBuyDialogOpen(true)}
                  >購買新域名</button> 或使用您現有的域名
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">設定 DNS</p>
                <p className="text-sm text-muted-foreground mt-1">按照指示在您的 DNS 添加 CNAME 記錄</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">驗證並啟用</p>
                <p className="text-sm text-muted-foreground mt-1">驗證 DNS 設定後自動啟用 SSL</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              自訂域名讓您的AI助手更專業，提升客戶對您品牌的信任度
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsBuyDialogOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                購買域名
              </Button>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                連接域名
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
