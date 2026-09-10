import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FloatingInput } from './FloatingInput';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setIsUnverified(false);
    setResendNotice(null);
    setUnauthorizedDomain(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Email atau password salah.');
        if (result.unverified) {
          setIsUnverified(true);
        }
      } else {
        onNavigate('/studio');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    setResendNotice(null);

    try {
      const result = await resendVerification(email, password);
      if (result.success) {
        setResendNotice(`Tautan verifikasi baru berhasil dikirim ke ${email}. Silakan cek email Anda.`);
      } else {
        setResendNotice(result.error || 'Gagal mengirim ulang email verifikasi.');
      }
    } catch {
      setResendNotice('Terjadi kendala saat mengirim email verifikasi.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsUnverified(false);
    setResendNotice(null);
    setUnauthorizedDomain(null);
    setIsLoading(true);

    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        if (!result.cancelled) {
          if (result.unauthorizedDomain) {
            setUnauthorizedDomain(result.unauthorizedDomain);
          } else {
            setErrorMessage(result.error || 'Gagal login dengan Google.');
          }
        }
      } else {
        onNavigate('/studio');
      }
    } catch {
      setErrorMessage('Gagal menghubungkan ke Google Firebase Auth.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#ECECEC] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle center ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#da0a2c]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Clean Card */}
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <img
              src="/logo-editorsuite.svg"
              alt="EDITOR SUITE"
              className="h-8 w-auto mx-auto object-contain mb-3"
              onError={(e) => {
                e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
              }}
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Masuk ke Akun
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-1">
              Masuk untuk melanjutkan ke 3D Jersey Studio
            </p>
          </div>

          {/* Unauthorized Domain Guide (Firebase Console Setup) */}
          {unauthorizedDomain && (
            <div className="mb-5 p-4 rounded-xl bg-[#1C1708] border border-amber-500/40 text-xs text-amber-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-xs">Domain Belum Diizinkan di Firebase Console</h4>
                  <p className="text-[#A3A3A3] text-[11px] leading-relaxed">
                    Firebase menolak login Google karena domain ini belum ditambahkan ke daftar <strong className="text-white">Authorized Domains</strong> di project <span className="font-mono text-amber-300">d-studio-e414d</span>.
                  </p>
                </div>
              </div>

              {/* Copyable Domain Box */}
              <div className="p-2.5 bg-black/60 rounded-lg border border-[#333333] flex items-center justify-between gap-2">
                <div className="truncate font-mono text-[11px] text-emerald-400 select-all">
                  {unauthorizedDomain}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(unauthorizedDomain);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-[#2A2A2A] hover:bg-[#383838] border border-[#444444] text-[10px] text-white shrink-0 font-medium cursor-pointer transition-colors flex items-center gap-1"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#aaa]" />
                      <span>Salin Domain</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href="https://console.firebase.google.com/project/d-studio-e414d/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors w-full justify-center"
              >
                <span>Buka Pengaturan Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Error / Unverified Notice */}
          {errorMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs animate-in fade-in duration-200 ${
                isUnverified
                  ? 'bg-[#241A14] border-amber-500/40 text-amber-200'
                  : 'bg-[#2A1414] border-[#EF4444]/40 text-[#FCA5A5]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isUnverified ? 'text-amber-400' : 'text-[#EF4444]'
                  }`}
                />
                <div className="space-y-2 w-full">
                  <span className="leading-relaxed block">{errorMessage}</span>

                  {isUnverified && (
                    <div className="pt-1 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending}
                        className="w-fit py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isResending ? (
                          <>
                            <div className="w-3 h-3 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                            <span>Mengirim ulang...</span>
                          </>
                        ) : (
                          <span>Kirim Ulang Email Verifikasi</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resend Notice */}
          {resendNotice && (
            <div className="mb-5 p-3 rounded-xl bg-[#142A19] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{resendNotice}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#2E2E2E] hover:border-[#444444] text-sm font-semibold text-white flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
          </button>

          {/* Minimal Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#242424]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#121212] px-3 text-[#666666]">atau</span>
            </div>
          </div>

          {/* Form with Floating Labels */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="login-email"
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              icon={<Mail className="w-4 h-4" />}
            />

            <FloatingInput
              id="login-password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#E5E5E5] text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5 mt-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-5 border-t border-[#222222] text-center">
            <p className="text-xs text-[#737373]">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-white font-medium hover:underline cursor-pointer"
              >
                Daftar sekarang
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
