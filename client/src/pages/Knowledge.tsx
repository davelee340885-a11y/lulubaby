import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Upload, Trash2, Loader2, AlertCircle, CheckCircle, 
  Globe, Type, HelpCircle, Plus, X
} from "lucide-react";
import { toast } from "sonner";
import { useRef, useState, useCallback, useEffect } from "react";
import { useBackgroundTasks } from "@/contexts/BackgroundTaskContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SourceType = "file" | "webpage" | "text" | "faq";

interface FAQItem {
  question: string;
  answer: string;
}

export default function Knowledge() {
  const { data: knowledgeBases, isLoading } = trpc.knowledge.list.useQuery();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<SourceType>("file");

  // Background task manager
  const { tasks, addTask, updateTask, removeTask } = useBackgroundTasks();



  // Webpage form state
  const [webpageUrl, setWebpageUrl] = useState("");
  const [webpageTitle, setWebpageTitle] = useState("");

  // Text form state
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");

  // FAQ form state
  const [faqTitle, setFaqTitle] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([{ question: "", answer: "" }]);

  // Mutations with background task tracking
  const uploadMutation = trpc.knowledge.upload.useMutation({
    onMutate: () => {
      addTask({ id: `upload-${Date.now()}`, type: "knowledge-process", label: "文件上傳中...", status: "running" });
    },
    onSuccess: () => {
      toast.success("文件上傳成功");
      utils.knowledge.list.invalidate();
      setUploading(false);
      const t = tasks.find(t => t.type === "knowledge-process" && t.status === "running");
      if (t) updateTask(t.id, { status: "success", label: "文件上傳完成" });
    },
    onError: (error) => {
      toast.error("上傳失敗: " + error.message);
      setUploading(false);
      const t = tasks.find(t => t.type === "knowledge-process" && t.status === "running");
      if (t) updateTask(t.id, { status: "error", label: "文件上傳失敗", error: error.message });
    },
  });

  const webpageMutation = trpc.knowledge.addWebpage.useMutation({
    onMutate: () => {
      addTask({ id: `webpage-${Date.now()}`, type: "knowledge-process", label: "網頁內容提取中...", status: "running" });
    },
    onSuccess: (data: any) => {
      const usedLLM = data?._llmFallbackUsed;
      const sparkCost = data?._sparkCost || 3;
      if (usedLLM) {
        toast.success(`網頁內容已添加（AI 智能讀取，消耗 ${sparkCost} Spark）`, { duration: 5000 });
      } else {
        toast.success("網頁內容已添加");
      }
      utils.knowledge.list.invalidate();
      setWebpageUrl("");
      setWebpageTitle("");
      setUploading(false);
      const t = tasks.find(t => t.type === "knowledge-process" && t.status === "running");
      if (t) updateTask(t.id, { status: "success", label: usedLLM ? "AI 智能讀取完成" : "網頁內容已添加" });
    },
    onError: (error) => {
      setUploading(false);
      const t = tasks.find(t => t.type === "knowledge-process" && t.status === "running");
      if (t) updateTask(t.id, { status: "error", label: "網頁提取失敗", error: error.message });
      toast.error("添加失敗: " + error.message);
    },
  });



  const textMutation = trpc.knowledge.addText.useMutation({
    onSuccess: () => {
      toast.success("文字內容已添加");
      utils.knowledge.list.invalidate();
      setTextTitle("");
      setTextContent("");
      setUploading(false);
    },
    onError: (error) => {
      toast.error("添加失敗: " + error.message);
      setUploading(false);
    },
  });

  const faqMutation = trpc.knowledge.addFAQ.useMutation({
    onSuccess: () => {
      toast.success("FAQ 問答已添加");
      utils.knowledge.list.invalidate();
      setFaqTitle("");
      setFaqItems([{ question: "", answer: "" }]);
      setUploading(false);
    },
    onError: (error) => {
      toast.error("添加失敗: " + error.message);
      setUploading(false);
    },
  });

  const deleteMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("知識項目已刪除");
      utils.knowledge.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("文件大小不能超過 5MB");
      return;
    }

    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
      toast.error("只支持 TXT、MD、PDF、DOC、DOCX 格式");
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        mimeType: file.type || "text/plain",
      });
    };
    reader.onerror = () => {
      toast.error("讀取文件失敗");
      setUploading(false);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleWebpageSubmit = () => {
    if (!webpageUrl.trim()) {
      toast.error("請輸入網頁連結");
      return;
    }
    setUploading(true);
    webpageMutation.mutate({
      url: webpageUrl.trim(),
      title: webpageTitle.trim() || undefined,
    });
  };



  const handleTextSubmit = () => {
    if (!textTitle.trim()) {
      toast.error("請輸入標題");
      return;
    }
    if (!textContent.trim()) {
      toast.error("請輸入內容");
      return;
    }
    setUploading(true);
    textMutation.mutate({
      title: textTitle.trim(),
      content: textContent.trim(),
    });
  };

  const handleFAQSubmit = () => {
    if (!faqTitle.trim()) {
      toast.error("請輸入標題");
      return;
    }
    const validItems = faqItems.filter(item => item.question.trim() && item.answer.trim());
    if (validItems.length === 0) {
      toast.error("請至少輸入一組有效的問答");
      return;
    }
    setUploading(true);
    faqMutation.mutate({
      title: faqTitle.trim(),
      items: validItems,
    });
  };

  const addFAQItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const removeFAQItem = (index: number) => {
    if (faqItems.length > 1) {
      setFaqItems(faqItems.filter((_, i) => i !== index));
    }
  };

  const updateFAQItem = (index: number, field: "question" | "answer", value: string) => {
    const newItems = [...faqItems];
    newItems[index][field] = value;
    setFaqItems(newItems);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "未知";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case "youtube":
        return <Globe className="h-8 w-8 text-red-500" />;
      case "webpage":
        return <Globe className="h-8 w-8 text-blue-500" />;
      case "text":
        return <Type className="h-8 w-8 text-purple-500" />;
      case "faq":
        return <HelpCircle className="h-8 w-8 text-orange-500" />;
      default:
        return <FileText className="h-8 w-8 text-primary" />;
    }
  };

  const getSourceLabel = (sourceType: string | null) => {
    switch (sourceType) {
      case "youtube":
        return "YouTube 影片";
      case "webpage":
        return "網頁";
      case "text":
        return "文字";
      case "faq":
        return "FAQ 問答";
      default:
        return "文件";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">知識庫管理</h1>
        <p className="text-muted-foreground mt-1">上傳各種來源的內容讓AI學習您的業務知識</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>添加知識</CardTitle>
          <CardDescription>選擇適合的方式添加知識內容</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SourceType)}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">文件上傳</span>
              </TabsTrigger>
              <TabsTrigger value="webpage" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">網頁</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">文字</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQ</span>
              </TabsTrigger>
            </TabsList>

            {/* File Upload Tab */}
            <TabsContent value="file">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {uploading && activeTab === "file" ? (
                      <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{uploading && activeTab === "file" ? "上傳中..." : "點擊或拖放文件到此處"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        支持 TXT、MD、PDF、DOC、DOCX 格式，最大 5MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </TabsContent>

            {/* Webpage Tab */}
            <TabsContent value="webpage">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>提示：</strong>輸入網頁連結，系統將自動抓取網頁內容（3 Spark）。
                    若網站封鎖存取，將自動啟用 AI 智能讀取（10 Spark，失敗退還）。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webpage-url">網頁連結 *</Label>
                  <Input
                    id="webpage-url"
                    placeholder="example.com/page 或 https://example.com/page"
                    value={webpageUrl}
                    onChange={(e) => {
                      setWebpageUrl(e.target.value);
                    }}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webpage-title">自訂標題（選填）</Label>
                  <Input
                    id="webpage-title"
                    placeholder="留空將使用網頁標題"
                    value={webpageTitle}
                    onChange={(e) => setWebpageTitle(e.target.value)}
                    disabled={uploading}
                  />
                </div>
                <Button 
                  onClick={handleWebpageSubmit} 
                  disabled={uploading || !webpageUrl.trim()}
                  className="w-full"
                >
                  {uploading && activeTab === "webpage" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />抓取中（若封鎖將自動 AI 讀取）</>
                  ) : (
                    <><Globe className="h-4 w-4 mr-2" />抓取內容<span className="text-xs ml-1 opacity-70">（3 Spark）</span></>
                  )}
                </Button>


              </div>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text">
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    <strong>提示：</strong>直接輸入文字內容，適合添加產品說明、公司介紹、服務條款等。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-title">標題 *</Label>
                  <Input
                    id="text-title"
                    placeholder="例如：公司簡介、產品說明"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-content">內容 *</Label>
                  <Textarea
                    id="text-content"
                    placeholder="輸入您想讓AI學習的內容..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    disabled={uploading}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {textContent.length.toLocaleString()} / 100,000 字元
                  </p>
                </div>
                <Button 
                  onClick={handleTextSubmit} 
                  disabled={uploading || !textTitle.trim() || !textContent.trim()}
                  className="w-full"
                >
                  {uploading && activeTab === "text" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />添加中...</>
                  ) : (
                    <><Type className="h-4 w-4 mr-2" />添加內容</>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>提示：</strong>以問答對的形式添加常見問題，AI將能更準確地回答類似問題。
                    適合添加銷售話術、客服FAQ、產品問答等。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-title">標題 *</Label>
                  <Input
                    id="faq-title"
                    placeholder="例如：產品FAQ、銷售話術"
                    value={faqTitle}
                    onChange={(e) => setFaqTitle(e.target.value)}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-4">
                  <Label>問答對</Label>
                  {faqItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                      {faqItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFAQItem(index)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="space-y-2">
                        <Label className="text-sm">問題 {index + 1}</Label>
                        <Input
                          placeholder="客戶可能會問的問題"
                          value={item.question}
                          onChange={(e) => updateFAQItem(index, "question", e.target.value)}
                          disabled={uploading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">答案</Label>
                        <Textarea
                          placeholder="您希望AI如何回答"
                          value={item.answer}
                          onChange={(e) => updateFAQItem(index, "answer", e.target.value)}
                          disabled={uploading}
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addFAQItem}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加問答對
                  </Button>
                </div>
                <Button 
                  onClick={handleFAQSubmit} 
                  disabled={uploading || !faqTitle.trim() || faqItems.every(item => !item.question.trim() || !item.answer.trim())}
                  className="w-full"
                >
                  {uploading && activeTab === "faq" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />添加中...</>
                  ) : (
                    <><HelpCircle className="h-4 w-4 mr-2" />添加 FAQ</>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>知識庫內容</CardTitle>
          <CardDescription>AI將根據這些內容回答客戶問題</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : knowledgeBases?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>尚未添加任何知識內容</p>
              <p className="text-sm mt-1">使用上方的標籤頁添加各種來源的知識</p>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledgeBases?.map((kb) => (
                <div
                  key={kb.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getSourceIcon((kb as { sourceType?: string }).sourceType || "file")}
                    <div>
                      <p className="font-medium">{kb.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {getSourceLabel((kb as { sourceType?: string }).sourceType || "file")} · {formatFileSize(kb.fileSize)} · {new Date(kb.createdAt).toLocaleDateString("zh-TW")}
                      </p>
                      {(kb as { sourceUrl?: string }).sourceUrl && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {(kb as { sourceUrl?: string }).sourceUrl}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(kb.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(kb.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個知識項目嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後，AI將不再使用此內容回答問題。此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
