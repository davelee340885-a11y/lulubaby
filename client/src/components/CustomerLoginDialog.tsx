import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface CustomerLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personaId?: string;
  onLoginSuccess?: (user: any) => void;
}

export function CustomerLoginDialog({ isOpen, onClose, personaId = '1', onLoginSuccess }: CustomerLoginDialogProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutations - 使用統一的 authRouter
  const emailLoginMutation = trpc.userAuth.customerLogin.useMutation();
  const emailSignupMutation = trpc.userAuth.customerSignup.useMutation();

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      setError('請輸入電郵地址');
      return;
    }
    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const result = await emailLoginMutation.mutateAsync({
        email,
        password: password,
        personaId: parseInt(personaId),
      } as any);
      console.log('Login successful:', result);
      
      // Save token to localStorage
      if (result.token) {
        localStorage.setItem('customerToken', result.token);
      }
      
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      onClose();
      
      // Stay on current page after login/signup - no redirect needed
      // The user is already on the chat page
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || '登入失敗，請檢查電郵和密碼');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      setError('請輸入姓名');
      return;
    }
    if (!email.trim()) {
      setError('請輸入電郵地址');
      return;
    }
    if (password.length < 8) {
      setError('密碼至少需要 8 個字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('密碼不符');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await emailSignupMutation.mutateAsync({
        name,
        email,
        password,
        personaId: parseInt(personaId),
      });
      console.log('Signup successful:', result);
      
      // Save token to localStorage
      if (result.token) {
        localStorage.setItem('customerToken', result.token);
      }
      
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      onClose();
      
      // Stay on current page after login/signup - no redirect needed
      // The user is already on the chat page
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message || '註冊失敗');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'login' ? '客戶登入' : '建立帳戶'}
          </h2>
          <p className="text-sm text-white/90">
            {mode === 'login' 
              ? '登入後可以保存您的對話記錄' 
              : '建立帳戶以保存您的對話記錄'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === 'login') handleEmailLogin();
              else handleSignup();
            }}
            className="space-y-4"
          >
            {/* Name Input - Signup Only */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="name"
                    type="text"
                    placeholder="請輸入您的姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                電郵地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'login' ? '輸入您的密碼' : '至少 8 個字符'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input - Signup Only */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  確認密碼
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="再次輸入密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {mode === 'login' ? '登入中...' : '建立帳戶中...'}
                </>
              ) : (
                mode === 'login' ? '登入' : '建立帳戶'
              )}
            </button>

            {/* Mode Toggle */}
            <div className="pt-4 border-t border-gray-200">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                    setName('');
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-cyan-600 font-medium py-2"
                >
                  還沒有帳戶？<span className="text-cyan-600 font-semibold">建立帳戶</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                    setName('');
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-cyan-600 font-medium py-2"
                >
                  已有帳戶？<span className="text-cyan-600 font-semibold">返回登入</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
