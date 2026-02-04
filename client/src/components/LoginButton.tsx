import { useState } from 'react';
import { LogIn, User, LogOut } from 'lucide-react';
import { CustomerLoginDialog } from './CustomerLoginDialog';

interface LoginButtonProps {
  customer: any | null;
  personaId: string;
  onLogin: (user: any) => void;
  onLogout: () => void;
  variant?: 'minimal' | 'full';
  className?: string;
}

/**
 * Manus AI 風格的簡約登入按鈕
 * 參考 Manus AI 的設計：簡潔、現代、無干擾
 */
export function LoginButton({
  customer,
  personaId,
  onLogin,
  onLogout,
  variant = 'minimal',
  className = '',
}: LoginButtonProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // 已登入狀態
  if (customer) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {variant === 'full' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">
              {customer.name || customer.email?.split('@')[0]}
            </span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
          title="登出"
        >
          <LogOut className="w-4 h-4" />
          {variant === 'full' && <span>登出</span>}
        </button>
      </div>
    );
  }

  // 未登入狀態 - Manus AI 風格簡約按鈕
  return (
    <>
      <button
        onClick={() => setShowLoginDialog(true)}
        className={`
          group flex items-center gap-2 
          px-4 py-2.5 
          bg-white hover:bg-gray-50
          border-2 border-gray-300 hover:border-cyan-400
          rounded-full
          text-sm font-semibold text-gray-800 hover:text-cyan-600
          shadow-md hover:shadow-lg
          transition-all duration-200
          ${className}
        `}
      >
        <LogIn className="w-4 h-4 text-cyan-500 group-hover:text-cyan-600 transition-colors" />
        <span>登入</span>
      </button>

      <CustomerLoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        personaId={personaId}
        onLoginSuccess={(user) => {
          onLogin(user);
          setShowLoginDialog(false);
        }}
      />
    </>
  );
}

/**
 * 更簡約的登入按鈕 - 只有圖標
 */
export function LoginIconButton({
  customer,
  personaId,
  onLogin,
  onLogout,
  className = '',
}: LoginButtonProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  if (customer) {
    return (
      <button
        onClick={onLogout}
        className={`
          w-9 h-9 
          flex items-center justify-center 
          bg-gradient-to-br from-cyan-400 to-blue-500 
          rounded-full 
          text-white
          hover:shadow-md
          transition-all duration-200
          ${className}
        `}
        title={`${customer.name || customer.email} - 點擊登出`}
      >
        <User className="w-4 h-4" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLoginDialog(true)}
        className={`
          w-10 h-10 
          flex items-center justify-center 
          bg-white hover:bg-gray-50
          border-2 border-gray-300 hover:border-cyan-400
          rounded-full 
          text-cyan-500 hover:text-cyan-600
          shadow-md hover:shadow-lg
          transition-all duration-200
          ${className}
        `}
        title="登入"
      >
        <LogIn className="w-5 h-5" />
      </button>

      <CustomerLoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        personaId={personaId}
        onLoginSuccess={(user) => {
          onLogin(user);
          setShowLoginDialog(false);
        }}
      />
    </>
  );
}
