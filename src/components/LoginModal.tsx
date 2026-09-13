import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Mail, Lock, Eye, EyeOff, Check, User, ShieldCheck, Crown, ArrowRight } from 'lucide-react';
import { UserSubscription, isProSubscription, PRO_PRICE_FORMATTED } from '../utils/subscription';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string } | null;
  onLogin: (user: { email: string; name: string }) => void;
  onLogout: () => void;
  subscription: UserSubscription;
  onOpenPro: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  subscription,
  onOpenPro,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    // Smooth simulated authentication
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
      const userName = name.trim() || email.split('@')[0] || 'Studio User';
      onLogin({ email, name: userName });
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="w-full max-w-sm bg-[#121212] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header Bar: Logo proporsional di kiri, tombol close di kanan */}
            <div className="px-5 py-3.5 border-b border-[#262626] flex items-center justify-between bg-[#0D0D0D]">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-editorsuite.svg"
                  alt="Editor Suite"
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
                  }}
                />
                <span className="text-xs font-bold tracking-wider text-[#ECECEC]">
                  STUDIO
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              {currentUser ? (
                // Logged in state
                <div className="space-y-4 text-center py-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#dc2626] via-[#7c3aed] to-[#2563eb] p-[2px] mx-auto shadow-lg">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#b91c1c] via-[#4f46e5] to-[#1d4ed8] flex items-center justify-center text-xl font-bold text-white shadow-inner">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{currentUser.name}</h3>
                    <p className="text-xs text-[#888888] mt-0.5">{currentUser.email}</p>

                    {isProSubscription(subscription) ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#da0a2c]/15 border border-[#da0a2c]/40 text-[#da0a2c] text-[11px] font-bold mt-3">
                        <Crown className="w-3.5 h-3.5" />
                        <span>Pro Plan Aktif</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1F1F1F] border border-[#333333] text-[#A3A3A3] text-[11px] font-medium mt-3">
                        <span>Free Plan</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg text-left text-xs space-y-1.5 text-[#A3A3A3]">
                    <div className="flex justify-between">
                      <span>Model 3D Akses</span>
                      <span className="text-white font-mono">
                        {isProSubscription(subscription) ? 'Semua 10 Model' : '1 Model (O Neck)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Image</span>
                      <span className={isProSubscription(subscription) ? 'text-white font-mono' : 'text-[#737373] font-mono'}>
                        {isProSubscription(subscription) ? 'Tersedia (4K)' : 'Terkunci'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Video Turntable</span>
                      <span className={isProSubscription(subscription) ? 'text-white font-mono' : 'text-[#737373] font-mono'}>
                        {isProSubscription(subscription) ? 'Tersedia (60 FPS)' : 'Terkunci'}
                      </span>
                    </div>
                  </div>

                  {/* Upgrade button for Free user */}
                  {!isProSubscription(subscription) && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPro();
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Upgrade ke Pro Plan ({PRO_PRICE_FORMATTED})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2 rounded-lg bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] transition-all cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="py-2 px-4 rounded-lg bg-[#181818] border border-[#333333] text-xs font-medium text-[#EF4444] hover:bg-[#261818] hover:border-[#EF4444]/40 transition-all cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                // Sederhana: Login & Register
                <>
                  {/* Segmented Button Login / Register */}
                  <div className="grid grid-cols-2 p-1 bg-[#181818] rounded-lg border border-[#262626]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setLoginSuccess(false);
                      }}
                      className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        !isSignUp
                          ? 'bg-[#262626] text-white border border-[#3E3E3E] shadow-xs'
                          : 'text-[#737373] hover:text-[#ECECEC] border border-transparent'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setLoginSuccess(false);
                      }}
                      className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        isSignUp
                          ? 'bg-[#262626] text-white border border-[#3E3E3E] shadow-xs'
                          : 'text-[#737373] hover:text-[#ECECEC] border border-transparent'
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  {/* Form tanpa label, placeholder hilang smooth saat fokus */}
                  <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                    {isSignUp && (
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-[#595959] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="smooth-placeholder w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#555555] placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0 focus:outline-none transition-colors"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#595959] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="smooth-placeholder w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#555555] placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#595959] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="smooth-placeholder w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-lg pl-9 pr-9 py-2.5 text-xs text-white placeholder-[#555555] placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595959] hover:text-[#A3A3A3] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Tombol Aksi Sederhana */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isLoading || loginSuccess}
                        className="w-full py-2.5 rounded-lg bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] hover:border-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        {loginSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-[#22C55E]" />
                            <span>{isSignUp ? 'Registered Successfully!' : 'Logged In!'}</span>
                          </>
                        ) : isLoading ? (
                          <span>{isSignUp ? 'Registering...' : 'Logging in...'}</span>
                        ) : (
                          <span>{isSignUp ? 'Register' : 'Login'}</span>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Social Login Singkat */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-[#262626]" />
                    <span className="text-[10px] uppercase tracking-wider text-[#555555]">
                      or
                    </span>
                    <div className="flex-1 h-px bg-[#262626]" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#181818] border border-[#2A2A2A] hover:border-[#404040] hover:bg-[#222222] text-xs font-medium text-white transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

