import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, loginWithGoogle, isFirestoreConnected } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);

    // Client-side quick validations
    if (name.trim().length < 2) {
      setErrorMessage('Nama minimal harus 2 karakter.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal harus 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(name, email, password, confirmPassword);
      if (!result.success) {
        setErrorMessage(result.error || 'Gagal mendaftar. Silakan coba lagi.');
      } else {
        onNavigate('/studio');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setErrorMessage(result.error || 'Gagal mendaftar dengan Google.');
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
    <div className="min-h-screen w-screen bg-[#0A0A0A] text-[#ECECEC] flex flex-col justify-between items-center px-4 py-8 select-none relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#da0a2c]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Nav */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
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
        </div>
        <button
          onClick={() => onNavigate('/login')}
          className="text-xs text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
        >
          Sudah punya akun? <span className="text-white font-medium underline underline-offset-4">Masuk</span>
        </button>
      </div>

      {/* Main Register Card */}
      <div className="w-full max-w-md my-auto z-10">
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          {/* Header */}
          <div className="space-y-1.5 mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-[11px] text-[#A3A3A3] mb-2">
              <Sparkles className="w-3 h-3 text-[#da0a2c]" />
              <span>Daftar Akun Baru</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Buat Akun Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#737373]">
              Registrasi untuk mengakses 3D editor dan rendering Firebase terintegrasi
            </p>
          </div>

          {/* Database connection indicator */}
          <div className="mb-4 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#222] flex items-center justify-between text-[11px] text-[#888]">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-500" />
              Database: <span className="text-white font-medium">Firebase Firestore</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isFirestoreConnected ? 'Online' : 'Ready'}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Quick Sign-up */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#555] hover:bg-[#242424] text-xs sm:text-sm font-medium text-white flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Daftar Cepat dengan Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#262626]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-[#121212] px-2 text-[#666]">atau daftar dengan email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  disabled={isLoading}
                  className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  disabled={isLoading}
                  className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Password (min. 6 karakter)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595959] hover:text-[#A3A3A3] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  disabled={isLoading}
                  className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password match indicator */}
            {password && confirmPassword && (
              <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                {password === confirmPassword ? (
                  <span className="text-[#22C55E] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Password cocok
                  </span>
                ) : (
                  <span className="text-[#EF4444]">
                    Password belum sama
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-[#262626] border border-[#595959] text-xs sm:text-sm font-semibold text-white hover:bg-[#333333] hover:border-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/40 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Daftar & Buka Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-[#262626] text-center">
            <p className="text-xs text-[#737373]">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-white font-medium hover:underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#555555] gap-2 z-10">
        <span>&copy; {new Date().getFullYear()} EDITOR SUITE &middot; 3D Jersey Studio</span>
        <span className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-amber-500" />
          Firebase Firestore Database
        </span>
      </div>
    </div>
  );
};
