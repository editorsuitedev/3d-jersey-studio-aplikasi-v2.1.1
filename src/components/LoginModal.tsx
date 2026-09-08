import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string } | null;
  onLogin: (user: { email: string; name: string }) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(currentUser?.email || 'editorsuite@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Smooth simulated authentication
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
      const name = email.split('@')[0] || 'Studio User';
      onLogin({ email, name });
      setTimeout(() => {
        setLoginSuccess(false);
        onClose();
      }, 700);
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
      onLogin({ email: 'editorsuite@gmail.com', name: 'Editor Suite Pro' });
      setTimeout(() => {
        setLoginSuccess(false);
        onClose();
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121212] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between bg-[#0D0D0D]">
          <div className="flex items-center">
            <img
              src="https://editorsuite.cloud/logo-editorsuite.svg"
              alt="EDITOR SUITE"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            // Logged in state
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border border-[#3E3E3E] mx-auto flex items-center justify-center text-xl font-bold text-white shadow-inner">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{currentUser.name}</h3>
                <p className="text-xs text-[#888888] mt-0.5">{currentUser.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium mt-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Pro Plan Active</span>
                </div>
              </div>

              <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg text-left text-xs space-y-1.5 text-[#A3A3A3]">
                <div className="flex justify-between">
                  <span>Cloud Storage</span>
                  <span className="text-white font-mono">10 GB / 50 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Quality</span>
                  <span className="text-white font-mono">4K Ultra HD & 60 FPS</span>
                </div>
                <div className="flex justify-between">
                  <span>Max UV Resolution</span>
                  <span className="text-white font-mono">4096px × 4096px</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="py-2 px-4 rounded-lg bg-[#181818] border border-[#333333] text-xs font-medium text-[#EF4444] hover:bg-[#261818] hover:border-[#EF4444]/40 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            // Sign in / Sign up form
            <>
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-white">
                  {isSignUp ? 'Create your Studio Account' : 'Welcome to 3D Jersey Studio'}
                </h3>
                <p className="text-xs text-[#737373]">
                  {isSignUp
                    ? 'Save your 4096px designs and unlock full 3D exports'
                    : 'Sign in to access your designs, presets, and 4K renders'}
                </p>
              </div>

              {/* Social Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1A1A1A] border border-[#333333] hover:border-[#595959] hover:bg-[#242424] text-xs font-medium text-white transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#262626]" />
                <span className="text-[10px] uppercase tracking-wider text-[#555555]">
                  or with email
                </span>
                <div className="flex-1 h-px bg-[#262626]" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-[#A3A3A3] block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#595959] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@editorsuite.cloud"
                      className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-medium text-[#A3A3A3]">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        className="text-[10px] text-[#737373] hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#595959] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-[#555555] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595959] hover:text-[#A3A3A3]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || loginSuccess}
                    className="w-full py-2.5 rounded-lg bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] hover:border-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-50"
                  >
                    {loginSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-[#22C55E]" />
                        <span>Signed in successfully!</span>
                      </>
                    ) : isLoading ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Studio Account' : 'Sign In'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom toggle */}
              <div className="text-center text-xs text-[#737373] pt-1">
                {isSignUp ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      onClick={() => setIsSignUp(false)}
                      className="text-white hover:underline font-medium"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => setIsSignUp(true)}
                      className="text-white hover:underline font-medium"
                    >
                      Sign Up
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
