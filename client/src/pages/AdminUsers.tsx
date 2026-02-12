import { useState } from "react";
import { useLocation } from "wouter";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Users, Shield, UserCog, ChevronLeft, ChevronRight, AlertTriangle, Zap, Plus, History } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { wsPath } = useWorkspaceId();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Check admin access
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
          <h2 className="text-xl font-semibold">權限不足</h2>
          <p className="text-muted-foreground">只有管理員可以訪問此頁面</p>
          <Button onClick={() => setLocation(wsPath("/dashboard"))}>返回儀表板</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminUsersContent
        page={page}
        setPage={setPage}
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        showRoleDialog={showRoleDialog}
        setShowRoleDialog={setShowRoleDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        showTopupDialog={showTopupDialog}
        setShowTopupDialog={setShowTopupDialog}
        showHistoryDialog={showHistoryDialog}
        setShowHistoryDialog={setShowHistoryDialog}
        currentUserId={user.id}
      />
    </DashboardLayout>
  );
}

function AdminUsersContent({
  page,
  setPage,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  selectedUser,
  setSelectedUser,
  showRoleDialog,
  setShowRoleDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  showTopupDialog,
  setShowTopupDialog,
  showHistoryDialog,
  setShowHistoryDialog,
  currentUserId,
}: {
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  roleFilter: "all" | "user" | "admin";
  setRoleFilter: (role: "all" | "user" | "admin") => void;
  selectedUser: any;
  setSelectedUser: (user: any) => void;
  showRoleDialog: boolean;
  setShowRoleDialog: (show: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  showTopupDialog: boolean;
  setShowTopupDialog: (show: boolean) => void;
  showHistoryDialog: boolean;
  setShowHistoryDialog: (show: boolean) => void;
  currentUserId: number;
}) {
  const utils = trpc.useUtils();
  const [topupAmount, setTopupAmount] = useState("");
  const [topupReason, setTopupReason] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  const { data: usersData, isLoading } = trpc.admin.getAllUsers.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    role: roleFilter,
  });

  const { data: stats } = trpc.admin.getDashboardStats.useQuery();

  const { data: sparkHistory, isLoading: historyLoading } = trpc.admin.getUserSparkHistory.useQuery(
    { userId: selectedUser?.id || 0, page: historyPage, pageSize: 10 },
    { enabled: showHistoryDialog && !!selectedUser }
  );

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("用戶角色已更新");
      utils.admin.getAllUsers.invalidate();
      utils.admin.getDashboardStats.invalidate();
      setShowRoleDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("用戶已刪除");
      utils.admin.getAllUsers.invalidate();
      utils.admin.getDashboardStats.invalidate();
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const topupMutation = trpc.admin.topupSpark.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.admin.getAllUsers.invalidate();
      utils.admin.getDashboardStats.invalidate();
      setShowTopupDialog(false);
      setTopupAmount("");
      setTopupReason("");
    },
    onError: (error) => {
      toast.error(error.message || "充值失敗");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleRoleChange = (newRole: "user" | "admin") => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: newRole,
      });
    }
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate({
        userId: selectedUser.id,
      });
    }
  };

  const handleTopup = () => {
    const amount = parseInt(topupAmount);
    if (!amount || amount <= 0) {
      toast.error("請輸入有效的充值數量");
      return;
    }
    if (!topupReason.trim()) {
      toast.error("請輸入充值原因");
      return;
    }
    if (selectedUser) {
      topupMutation.mutate({
        userId: selectedUser.id,
        amount,
        reason: topupReason.trim(),
      });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      topup: { text: "充值", color: "text-green-600" },
      consume: { text: "消耗", color: "text-red-500" },
      bonus: { text: "獎勵", color: "text-blue-500" },
      refund: { text: "退款", color: "text-orange-500" },
      referral_bonus: { text: "推薦獎勵", color: "text-purple-500" },
      admin_topup: { text: "管理員充值", color: "text-emerald-600" },
    };
    return labels[type] || { text: type, color: "text-gray-500" };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用戶管理</h1>
          <p className="text-muted-foreground">管理平台用戶、權限和 Spark 餘額</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總用戶數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理員</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.adminCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">普通用戶</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.regularUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本週新增</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spark 總流通量</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.totalSpark?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>用戶列表</CardTitle>
          <CardDescription>查看和管理所有註冊用戶</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、電郵或子域名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="角色篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="user">普通用戶</SelectItem>
                <SelectItem value="admin">管理員</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">搜索</Button>
          </form>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>電郵</TableHead>
                      <TableHead>子域名</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead className="text-right">Spark 餘額</TableHead>
                      <TableHead>註冊時間</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.id}</TableCell>
                        <TableCell className="font-medium">{u.name || "-"}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.subdomain || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role === "admin" ? "管理員" : "用戶"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400/30" />
                            <span className="font-mono font-medium text-amber-700 dark:text-amber-300">
                              {u.sparkBalance?.toLocaleString() || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(u.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950"
                              onClick={() => {
                                setSelectedUser(u);
                                setTopupAmount("");
                                setTopupReason("");
                                setShowTopupDialog(true);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              充值
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setSelectedUser(u);
                                setHistoryPage(1);
                                setShowHistoryDialog(true);
                              }}
                            >
                              <History className="h-3 w-3" />
                              記錄
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowRoleDialog(true);
                              }}
                              disabled={u.id === currentUserId}
                            >
                              角色
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteDialog(true);
                              }}
                              disabled={u.id === currentUserId}
                            >
                              刪除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {usersData && usersData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    共 {usersData.pagination.total} 個用戶，第 {page} / {usersData.pagination.totalPages} 頁
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一頁
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= usersData.pagination.totalPages}
                    >
                      下一頁
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Spark Top-up Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              手動充值 Spark
            </DialogTitle>
            <DialogDescription>
              為 {selectedUser?.name || selectedUser?.email} 充值 Spark
              <br />
              <span className="text-xs">目前餘額: {selectedUser?.sparkBalance?.toLocaleString() || 0} Spark</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>充值數量</Label>
              <Input
                type="number"
                min="1"
                placeholder="輸入 Spark 數量..."
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
              <div className="flex gap-2">
                {[100, 500, 1000, 5000, 10000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setTopupAmount(amount.toString())}
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>充值原因</Label>
              <Input
                placeholder="例如：客戶補償、測試用途、促銷活動..."
                value={topupReason}
                onChange={(e) => setTopupReason(e.target.value)}
              />
            </div>
            {topupAmount && parseInt(topupAmount) > 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  充值後餘額: <strong>{((selectedUser?.sparkBalance || 0) + parseInt(topupAmount || "0")).toLocaleString()} Spark</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopupDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleTopup}
              disabled={topupMutation.isPending || !topupAmount || !topupReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {topupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  充值中...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  確認充值
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spark History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Spark 交易記錄
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email} 的 Spark 交易歷史
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sparkHistory?.transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暫無交易記錄
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>時間</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead className="text-right">數量</TableHead>
                    <TableHead className="text-right">餘額</TableHead>
                    <TableHead>說明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sparkHistory?.transactions.map((tx) => {
                    const typeInfo = getTransactionTypeLabel(tx.type);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.text}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {tx.balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {tx.description || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          {sparkHistory && sparkHistory.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                第 {historyPage} / {sparkHistory.pagination.totalPages} 頁
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setHistoryPage(historyPage - 1)}
                  disabled={historyPage <= 1}
                >
                  上一頁
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setHistoryPage(historyPage + 1)}
                  disabled={historyPage >= sparkHistory.pagination.totalPages}
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更改用戶角色</DialogTitle>
            <DialogDescription>
              選擇 {selectedUser?.name || selectedUser?.email} 的新角色
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedUser?.role}
              onValueChange={(v) => handleRoleChange(v as "user" | "admin")}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">普通用戶</SelectItem>
                <SelectItem value="admin">管理員</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除用戶</DialogTitle>
            <DialogDescription>
              您確定要刪除用戶 {selectedUser?.name || selectedUser?.email} 嗎？此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  刪除中...
                </>
              ) : (
                "確認刪除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
