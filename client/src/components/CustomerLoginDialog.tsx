import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface CustomerLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personaId?: string;
  onLoginSuccess?: (user: any) => void;
}

export function CustomerLoginDialog({ isOpen, onClose, personaId = '1', onLoginSuccess }: CustomerLoginDialogProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutations
  const emailLoginMutation = trpc.customerAuth.emailLogin.useMutation();
  const emailSignupMutation = (trpc.customerAuth as any).emailSignup.useMutation();

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      setError('請輸入電郵地址');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await emailLoginMutation.mutateAsync({
        email,
        personaId: parseInt(personaId),
      });
      console.log('Login successful:', result);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : '登入失敗');
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
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      onClose();
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : '註冊失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('請輸入電郵地址');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // TODO: Implement password reset
      setError('');
      setMode('login');
      alert('密碼重置連結已發送到您的電郵');
    } catch (err) {
      setError(err instanceof Error ? err.message : '發送失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden" style={{ maxHeight: '85vh' }}>
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 pb-4 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">
            {mode === 'login' ? '客戶登入' : mode === 'signup' ? '建立帳戶' : '忘記密碼'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Description - Fixed */}
        <p className="text-xs text-gray-600 px-6 pt-4 pb-2 flex-shrink-0">
          {mode === 'login'
            ? '登入後可以保存您的對話記錄'
            : mode === 'signup'
            ? '建立帳戶以保存您的對話記錄'
            : '輸入您的電郵地址以重置密碼'}
        </p>

        {/* Main Content - Scrollable */}
        <div style={{ 
          overflowY: 'auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingTop: '1rem',
          paddingBottom: '1rem',
          maxHeight: 'calc(85vh - 150px)'
        }}>
          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === 'login') handleEmailLogin();
              else if (mode === 'signup') handleSignup();
              else handleForgotPassword();
            }}
            className="space-y-4"
          >
            {/* Email Input Section */}
            {mode === 'login' && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    電郵地址
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-medium py-2 rounded transition"
                >
                  {isLoading ? '登入中...' : '使用電郵登入'}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-gray-500 text-xs">或使用社交帳號</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="py-2 px-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center text-sm"
                    title="Google 登入"
                  >
                    🔵
                  </button>
                  <button
                    type="button"
                    className="py-2 px-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center text-sm"
                    title="Apple 登入"
                  >
                    🍎
                  </button>
                  <button
                    type="button"
                    className="py-2 px-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center text-sm"
                    title="Microsoft 登入"
                  >
                    ⊞
                  </button>
                </div>

                {/* Mode Toggle Buttons - Inside Main Content for Login */}
                <div className="space-y-2 text-xs pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setPassword('');
                      setConfirmPassword('');
                      setName('');
                    }}
                    className="w-full text-cyan-500 hover:text-cyan-600 font-medium py-2 hover:bg-cyan-50 rounded text-left"
                  >
                    還沒有帳戶？<span className="font-semibold">建立帳戶</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgotPassword');
                      setError('');
                      setPassword('');
                    }}
                    className="w-full text-cyan-500 hover:text-cyan-600 font-medium py-2 hover:bg-cyan-50 rounded text-left"
                  >
                    <span className="font-semibold">忘記密碼？</span>
                  </button>
                </div>
              </>
            )}

            {/* Signup Section */}
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    姓名
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="請輸入您的姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium mb-2">
                    電郵地址
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium mb-2">
                    密碼
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少 8 個字符"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                    確認密碼
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="再次輸入密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-medium py-2 rounded transition"
                >
                  {isLoading ? '建立中...' : '建立帳戶'}
                </button>

                {/* Mode Toggle Button - Inside Main Content for Signup */}
                <div className="text-xs pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setPassword('');
                      setConfirmPassword('');
                      setName('');
                    }}
                    className="w-full text-cyan-500 hover:text-cyan-600 font-medium py-2 hover:bg-cyan-50 rounded text-left"
                  >
                    已有帳戶？<span className="font-semibold">返回登入</span>
                  </button>
                </div>
              </>
            )}

            {/* Forgot Password Section */}
            {mode === 'forgotPassword' && (
              <>
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
                    電郵地址
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-medium py-2 rounded transition"
                >
                  {isLoading ? '發送中...' : '發送重置連結'}
                </button>
                {/* Mode Toggle Button - Inside Main Content for Forgot Password */}
                <div className="text-xs pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setEmail('');
                    }}
                    className="w-full text-cyan-500 hover:text-cyan-600 font-medium py-2 hover:bg-cyan-50 rounded text-left"
                  >
                    <span className="font-semibold">返回登入</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
        {/* Footer */}
        <div className="text-xs text-gray-500 text-center px-6 py-4 border-t flex-shrink-0">
          {mode === 'login' && (
            <p>首次登入將自動創建帳戶</p>
          )}
        </div>
      </div>
    </div>
  );
}
