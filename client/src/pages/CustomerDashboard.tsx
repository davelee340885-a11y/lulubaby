import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User,
  Palette,
  Zap,
  ChevronRight,
  Sparkles,
  History,
  Star,
  ArrowLeft
} from 'lucide-react';

// Customer session type (matching backend)
type CustomerSession = {
  id: string | number;
  email: string;
  name?: string;
  provider: "email" | "google" | "apple" | "microsoft";
  personaId: number;
};

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'history' | 'settings'>('overview');
  const [user, setUser] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get token from localStorage and verify session
  const token = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;
  
  const { data: sessionData, isLoading: sessionLoading } = trpc.customerAuth.getSession.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  // Update user state when session data changes
  useEffect(() => {
    if (!sessionLoading) {
      if (sessionData?.user) {
        setUser(sessionData.user as CustomerSession);
      } else if (!token) {
        // No token, redirect to chat
        setLocation('/chat/1');
      }
      setIsLoading(false);
    }
  }, [sessionData, sessionLoading, token, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    setLocation('/chat/1');
  };

  const handleBackToChat = () => {
    setLocation(`/chat/${user?.personaId || 1}`);
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">請先登入</p>
          <button
            onClick={() => setLocation('/chat/1')}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg"
          >
            返回登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToChat}
                className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                AI 智能體中心
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{user.name || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            歡迎回來，{user.name || '用戶'}！
          </h1>
          <p className="text-slate-600">
            在這裡管理您的 AI 智能體和對話記錄
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
          {[
            { id: 'overview', label: '總覽', icon: Sparkles },
            { id: 'agents', label: 'AI 智能體', icon: Bot },
            { id: 'history', label: '對話記錄', icon: History },
            { id: 'settings', label: '帳戶設定', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">總對話數</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">開始與 AI 對話以累積記錄</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">我的智能體</p>
                  <p className="text-2xl font-bold text-slate-900">1</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">可用的 AI 智能體數量</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">會員等級</p>
                  <p className="text-2xl font-bold text-slate-900">免費版</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">升級以獲得更多功能</p>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">快速開始</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={handleBackToChat}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-xl p-4 transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>開始對話</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-xl p-4 transition"
                >
                  <Palette className="w-5 h-5" />
                  <span>自訂智能體</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-xl p-4 transition"
                >
                  <Settings className="w-5 h-5" />
                  <span>帳戶設定</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-600" />
                AI 智能體設定
              </h3>
              <p className="text-slate-600 mb-6">
                自訂您的 AI 智能體外觀和行為
              </p>

              {/* Agent Settings Form */}
              <div className="space-y-6">
                {/* Agent Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    智能體名稱
                  </label>
                  <input
                    type="text"
                    placeholder="例如：小助手"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    歡迎訊息
                  </label>
                  <textarea
                    rows={3}
                    placeholder="例如：你好！我是您的專屬 AI 助手，有什麼可以幫到您？"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Theme Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    主題顏色
                  </label>
                  <div className="flex gap-3">
                    {['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md hover:scale-110 transition"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    智能體性格
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'friendly', label: '友善親切', icon: '😊' },
                      { id: 'professional', label: '專業正式', icon: '👔' },
                      { id: 'creative', label: '創意活潑', icon: '🎨' },
                      { id: 'calm', label: '沉穩可靠', icon: '🧘' },
                    ].map((personality) => (
                      <button
                        key={personality.id}
                        className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition"
                      >
                        <span className="text-2xl">{personality.icon}</span>
                        <span className="text-sm text-slate-600">{personality.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  保存設定
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-600" />
              對話記錄
            </h3>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">還沒有對話記錄</p>
              <button
                onClick={handleBackToChat}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition"
              >
                開始第一次對話
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-600" />
                個人資料
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    defaultValue={user.name || ''}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    電郵地址
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                  />
                </div>
                <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition">
                  更新資料
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                安全設定
              </h3>
              <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                更改密碼
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
