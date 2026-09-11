import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Check, ArrowRight, ShieldCheck, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FloatingInput } from './FloatingInput';

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
  onLogout,
}) => {
  const { loginWithGoogle, login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const name = email.split('@')[0] || 'Studio Designer';
        const result = await Promise.race([
          register(name, email, password, password),
          new Promise<{ success: boolean; error: string }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: false,
                  error: 'Pendaftaran memakan waktu terlalu lama. Silakan coba lagi.',
                }),
              14000
            )
          ),
        ]);
        if (result.success) {
          setIsVerificationPending(true);
        } else {
          setErrorMessage(result.error || 'Gagal mendaftar.');
        }
      } else {
        const result = await Promise.race([
          login(email, password),
          new Promise<{ success: boolean; error: string }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: false,
                  error: 'Proses masuk memakan waktu terlalu lama. Periksa internet Anda.',
                }),
              12000
            )
          ),
        ]);
        if (result.success) {
          setLoginSuccess(true);
          setTimeout(() => {
            setLoginSuccess(false);
            onClose();
          }, 600);
        } else {
          setErrorMessage(result.error || 'Email atau password salah.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        setLoginSuccess(true);
        setTimeout(() => {
          setLoginSuccess(false);
          onClose();
        }, 600);
      } else if (!result.cancelled) {
        if (result.unauthorizedDomain) {
          setUnauthorizedDomain(result.unauthorizedDomain);
        } else {
          setErrorMessage(result.error || 'Gagal login dengan Google.');
        }
      }
    } catch {
      setErrorMessage('Gagal menghubungi Firebase Auth.');
    } finally {
      setIsLoading(false);
    }
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
          ) : isVerificationPending ? (
            // Verification pending state
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
                <Mail className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Konfirmasi Email Anda</h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Tautan konfirmasi telah dikirim ke <strong className="text-white break-all">{email}</strong>. Demi keamanan, Anda harus mengonfirmasi email terlebih dahulu sebelum dapat masuk.
                </p>
              </div>

              <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg text-left text-xs space-y-1.5 text-[#888]">
                <p className="text-white font-medium text-[11px]">Langkah berikutnya:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>Buka kotak masuk (atau folder spam) di email Anda.</li>
                  <li>Klik link verifikasi dari Firebase.</li>
                  <li>Kembali ke studio dan masuk dengan akun Anda.</li>
                </ol>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerificationPending(false);
                    setIsSignUp(false);
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80824] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Masuk ke Akun Anda</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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

              {/* Unauthorized Domain Guide */}
              {unauthorizedDomain && (
                <div className="p-3.5 rounded-xl bg-[#1C1708] border border-amber-500/40 text-xs text-amber-200 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white text-xs">Domain Belum Diizinkan</h4>
                      <p className="text-[#A3A3A3] text-[11px] mt-0.5 leading-relaxed">
                        Tambahkan domain aplikasi ini ke daftar Authorized Domains di Firebase Console (d-studio-e414d).
                      </p>
                    </div>
                  </div>

                  <div className="p-2 bg-black/60 rounded border border-[#333333] flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[10px] text-emerald-400 select-all">
                      {unauthorizedDomain}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(unauthorizedDomain);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }}
                      className="px-2 py-0.5 rounded bg-[#2A2A2A] hover:bg-[#383838] border border-[#444] text-[10px] text-white shrink-0 font-medium cursor-pointer"
                    >
                      {copiedDomain ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>

                  <a
                    href="https://console.firebase.google.com/project/d-studio-e414d/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 transition-colors w-full justify-center"
                  >
                    <span>Buka Firebase Console Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#3A3A3A] hover:border-[#666] text-xs sm:text-sm font-semibold text-white transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-md"
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
                <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#262626]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#121212] px-3 text-[#666666]">or with email</span>
                </div>
              </div>

              {/* Email / Password Form with Floating Labels */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <FloatingInput
                  id="modal-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  icon={<Mail className="w-4 h-4" />}
                />

                <FloatingInput
                  id="modal-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  icon={<Lock className="w-4 h-4" />}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#666666] hover:text-[#ECECEC] transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="pt-1">
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
