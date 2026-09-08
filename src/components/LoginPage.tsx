import React, { useState, createContext, useContext } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';

interface AuthContextType {
  login: (email: string, pass: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  loginWithGoogle: (token: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  login: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
});

export const useAuth = () => useContext(AuthContext);

interface LoginPageProps {
  onNavigate: (path: string, state?: any) => void;
}

function safeBase64Encode(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return btoa('{"email":"designer.editor@gmail.com"}');
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        if (result.requiresVerification) {
          // Redirect to verify email page with email preset
          onNavigate(`/verify-email?email=${encodeURIComponent(result.email || email)}`);
          return;
        }
        setErrorMessage(result.error || 'Email atau password salah.');
      } else {
        onNavigate('/studio');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    // If Google Identity Services library is loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Standard fallback prompt simulation
            simulateGoogleAuth();
          }
        });
      } catch {
        simulateGoogleAuth();
      }
    } else {
      simulateGoogleAuth();
    }
  };

  const simulateGoogleAuth = async () => {
    // Generate a secure demo credential for preview / sandbox testing
    try {
      const demoEmail = email.trim() || 'designer.editor@gmail.com';
      const mockPayload = {
        email: demoEmail,
        name: demoEmail.split('@')[0] || 'Studio Designer',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        sub: `google-${Date.now()}`,
      };
      const token = `header.${safeBase64Encode(JSON.stringify(mockPayload))}.signature`;
      const res = await loginWithGoogle(token);
      if (res.success) {
        onNavigate('/studio');
      } else {
        setErrorMessage(res.error || 'Autentikasi Google gagal');
      }
    } catch {
      setErrorMessage('Gagal menghubungi layanan autentikasi Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0A0A0A] text-[#ECECEC] flex flex-col justify-center items-center px-4 py-8 select-none relative overflow-hidden font-sans">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#da0a2c]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Clean Card */}
      <main className="w-full max-w-sm z-10">
        <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-xl">
          
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              Login
            </h1>
            <p className="text-xs text-[#888888]">
              Masuk untuk melanjutkan ke studio
            </p>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#18181F] hover:bg-[#20202A] border border-white/10 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2.5 cursor-pointer mb-5 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-medium tracking-wider">
              <span className="bg-[#111114] px-2 text-[#666666]">atau email</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Email
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-[#666666] group-focus-within:text-[#da0a2c] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  disabled={isLoading}
                  className="w-full bg-[#18181C] border border-white/10 focus:border-[#da0a2c] focus:ring-1 focus:ring-[#da0a2c] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555555] focus:outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-[#666666] group-focus-within:text-[#da0a2c] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full bg-[#18181C] border border-white/10 focus:border-[#da0a2c] focus:ring-1 focus:ring-[#da0a2c] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-[#555555] focus:outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white cursor-pointer p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#da0a2c] hover:bg-[#b80825] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#da0a2c]/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean Card Footer */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-[#737373]">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-white font-medium hover:underline hover:text-[#da0a2c] transition-colors cursor-pointer"
              >
                Signup
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [currentPath, setCurrentPath] = useState('/login');
  const [mockRequireVerify, setMockRequireVerify] = useState(false);
  const [mockFailLogin, setMockFailLogin] = useState(false);

  // Mock Authentication Provider logic
  const mockAuthContext: AuthContextType = {
    login: async (email, password) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      if (mockFailLogin) {
        return { success: false, error: 'Email atau password yang Anda masukkan salah.' };
      }
      
      if (mockRequireVerify) {
        return { 
          success: false, 
          requiresVerification: true, 
          email: email || 'user@editorsuite.cloud' 
        };
      }

      return { success: true };
    },
    loginWithGoogle: async (token) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (mockFailLogin) {
        return { success: false, error: 'Gagal mengautentikasi akun Google.' };
      }
      return { success: true };
    }
  };

  const handleNavigate = (path: string, state?: any) => {
    setCurrentPath(path);
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      <div className="relative min-h-screen bg-black">
        {/* Interactive Simulation Bar */}
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-[#14141F]/90 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-4 text-xs text-white max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-2 border-r border-white/10 pr-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-gray-300">Clean UI Preview</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-400 hover:text-white">
              <input
                type="checkbox"
                checked={mockRequireVerify}
                onChange={(e) => setMockRequireVerify(e.target.checked)}
                className="rounded bg-black border-gray-600 text-[#da0a2c] focus:ring-0"
              />
              Simulasikan OTP Redirect
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-400 hover:text-white">
              <input
                type="checkbox"
                checked={mockFailLogin}
                onChange={(e) => setMockFailLogin(e.target.checked)}
                className="rounded bg-black border-gray-600 text-[#da0a2c] focus:ring-0"
              />
              Simulasikan Error
            </label>
          </div>

          <button
            onClick={() => setCurrentPath('/login')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[11px] transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset View
          </button>
        </div>

        {/* View Switcher based on Navigation state */}
        {currentPath.startsWith('/login') ? (
          <LoginPage onNavigate={handleNavigate} />
        ) : (
          <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#da0a2c]/10 border border-[#da0a2c]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(218,10,44,0.3)]">
              <CheckCircle className="w-7 h-7 text-[#da0a2c]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Navigated Route</h2>
            <p className="text-xs font-mono text-[#da0a2c] bg-[#12121A] px-4 py-2 rounded-xl border border-white/10 mb-6">
              {currentPath}
            </p>
            <button
              onClick={() => setCurrentPath('/login')}
              className="px-5 py-2 bg-[#da0a2c] hover:bg-[#b80825] text-xs font-semibold rounded-xl text-white transition-all shadow-lg shadow-[#da0a2c]/30 cursor-pointer"
            >
              Kembali ke Login Studio
            </button>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}
