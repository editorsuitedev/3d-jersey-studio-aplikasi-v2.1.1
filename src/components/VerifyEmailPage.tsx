import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RotateCw, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface VerifyEmailPageProps {
  initialEmail?: string;
  onNavigate: (path: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ initialEmail = '', onNavigate }) => {
  const { verifyEmail, resendVerification } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read URL query params if user clicked token link from email
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryEmail = urlParams.get('email');
      const queryToken = urlParams.get('token');
      if (queryEmail) setEmail(queryEmail);
      if (queryToken && queryEmail) {
        // Auto verify with token
        handleAutoVerify(queryEmail, queryToken);
      }
    }
  }, []);

  const handleAutoVerify = async (targetEmail: string, token: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await verifyEmail(targetEmail, token);
    setIsLoading(false);
    if (result.success) {
      setSuccessMessage('Verifikasi berhasil! Mengalihkan ke 3D Studio...');
      setTimeout(() => onNavigate('/studio'), 1200);
    } else {
      setErrorMessage(result.error || 'Token verifikasi tidak valid.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email.trim()) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMessage('Masukkan 6-digit kode verifikasi OTP yang kami kirimkan ke email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await verifyEmail(email.trim(), otp.trim());
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Email berhasil diverifikasi! Selamat datang di EditorSuite Studio.');
      setTimeout(() => onNavigate('/studio'), 1200);
    } else {
      setErrorMessage(result.error || 'Kode verifikasi salah atau sudah kadaluarsa.');
    }
  };

  const handleResend = async () => {
    if (isResending || !email.trim()) return;
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await resendVerification(email.trim());
    setIsResending(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Kode verifikasi baru telah dikirim ke email Anda.');
    } else {
      setErrorMessage(result.error || 'Gagal mengirim ulang kode verifikasi.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0A0A0A] text-[#ECECEC] flex flex-col justify-between items-center px-4 py-8 select-none relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#da0a2c]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Nav */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10">
        <button
          type="button"
          onClick={() => onNavigate('/studio')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer text-left"
        >
          <img
            src="/logo-editorsuite.svg"
            alt="EDITOR SUITE"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
            }}
          />
          <span className="text-sm font-bold tracking-tight text-[#ECECEC]">
            3D JERSEY STUDIO
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/studio')}
            className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-medium text-[#ECECEC] transition-all cursor-pointer"
          >
            Buka Studio
          </button>
          <button
            onClick={() => onNavigate('/login')}
            className="text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
          >
            Kembali ke <span className="text-white font-medium underline underline-offset-4">Halaman Masuk</span>
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md my-auto z-10">
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          <div className="space-y-1.5 mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#da0a2c]/10 border border-[#da0a2c]/30 flex items-center justify-center mx-auto mb-3 text-[#da0a2c]">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Verifikasi Email Anda
            </h1>
            <p className="text-xs sm:text-sm text-[#737373]">
              Masukkan kode OTP 6-digit yang telah dikirimkan ke kotak masuk email Anda
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-[#142A19] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full bg-[#181818] border border-[#2E2E2E] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#595959] focus:outline-none focus:border-[#da0a2c] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Kode Verifikasi (OTP 6-Digit)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full bg-[#181818] border border-[#2E2E2E] rounded-lg pl-10 pr-3.5 py-2.5 text-center tracking-[8px] font-mono text-base font-bold text-white placeholder-[#595959] focus:outline-none focus:border-[#da0a2c] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi & Buka Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Resend Action */}
          <div className="mt-5 pt-4 border-t border-[#1F1F1F] flex items-center justify-between text-xs text-[#737373]">
            <span>Belum menerima kode?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-white hover:text-[#da0a2c] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>{isResending ? 'Mengirim...' : 'Kirim Ulang Kode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md text-center z-10 text-[11px] text-[#555555]">
        &copy; {new Date().getFullYear()} EditorSuite Studio &bull; editorsuite.cloud
      </div>
    </div>
  );
};
