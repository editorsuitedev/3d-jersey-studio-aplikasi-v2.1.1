import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, RefreshCw, 
  CheckCircle, User, ShieldCheck, KeyRound, ArrowLeft, Check 
} from 'lucide-react';

interface AuthContextType {
  login: (email: string, pass: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (token: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
});

export const useAuth = () => useContext(AuthContext);

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

// ==================== LOGIN PAGE ====================
export const LoginPage: React.FC<{ onNavigate: (path: string, state?: any) => void }> = ({ onNavigate }) => {
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
          onNavigate('/verify-email', { email: result.email || email });
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

  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setTimeout(async () => {
      try {
        const demoEmail = email.trim() || 'designer.editor@gmail.com';
        const mockPayload = { email: demoEmail, name: 'Studio Designer', sub: `google-${Date.now()}` };
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
    }, 600);
  };

  return (
    <div className="w-full max-w-sm z-10 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            Selamat Datang
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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-[#A3A3A3]">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[11px] text-[#888888] hover:text-[#da0a2c] transition-colors cursor-pointer"
              >
                Lupa sandi?
              </button>
            </div>
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
                <span>Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-[#737373]">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="text-white font-medium hover:underline hover:text-[#da0a2c] transition-colors cursor-pointer"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== REGISTER PAGE ====================
export const RegisterPage: React.FC<{ onNavigate: (path: string, state?: any) => void }> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await register(fullName, email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Gagal mendaftar akun.');
      } else {
        onNavigate('/verify-email', { email });
      }
    } catch {
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm z-10 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            Buat Akun Baru
          </h1>
          <p className="text-xs text-[#888888]">
            Mulai eksplorasi studio kreatif Anda
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-[#A3A3A3] block mb-1">
              Nama Lengkap
            </label>
            <div className="relative group">
              <User className="w-4 h-4 text-[#666666] group-focus-within:text-[#da0a2c] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmad Studio"
                disabled={isLoading}
                className="w-full bg-[#18181C] border border-white/10 focus:border-[#da0a2c] focus:ring-1 focus:ring-[#da0a2c] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555555] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A3A3A3] block mb-1">
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
            <label className="text-xs font-medium text-[#A3A3A3] block mb-1">
              Kata Sandi
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-[#666666] group-focus-within:text-[#da0a2c] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
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

          <div>
            <label className="text-xs font-medium text-[#A3A3A3] block mb-1">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-[#666666] group-focus-within:text-[#da0a2c] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                disabled={isLoading}
                className="w-full bg-[#18181C] border border-white/10 focus:border-[#da0a2c] focus:ring-1 focus:ring-[#da0a2c] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555555] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${agreeTerms ? 'bg-[#da0a2c] border-[#da0a2c]' : 'bg-[#18181C] border-white/20'}`}>
                {agreeTerms && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </div>
            </div>
            <span className="text-[11px] text-[#888888] leading-tight">
              Saya menyetujui <span className="text-white hover:underline">Ketentuan Layanan</span> & <span className="text-white hover:underline">Kebijakan Privasi</span>.
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#da0a2c] hover:bg-[#b80825] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#da0a2c]/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses Akun...</span>
              </>
            ) : (
              <>
                <span>Daftar Akun</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-[#737373]">
            Sudah memiliki akun?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-white font-medium hover:underline hover:text-[#da0a2c] transition-colors cursor-pointer"
            >
              Masuk
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== VERIFY EMAIL / OTP PAGE ====================
export const VerifyEmailPage: React.FC<{ onNavigate: (path: string, state?: any) => void; emailParam?: string }> = ({ onNavigate, emailParam }) => {
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(45);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailDisplay = emailParam || 'user@editorsuite.cloud';

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMessage('Silakan masukkan 6 digit kode verifikasi.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await verifyOtp(code);
      if (res.success) {
        onNavigate('/studio');
      } else {
        setErrorMessage(res.error || 'Kode verifikasi tidak valid.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan verifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm z-10 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-xl">
        <button
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#da0a2c]/10 border border-[#da0a2c]/30 flex items-center justify-center mx-auto mb-3 text-[#da0a2c]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">
            Verifikasi Email
          </h1>
          <p className="text-xs text-[#888888]">
            Kode 6 digit dikirimkan ke <br />
            <span className="text-white font-mono font-medium">{emailDisplay}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-between gap-1.5">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-bold bg-[#18181C] border border-white/10 focus:border-[#da0a2c] focus:ring-1 focus:ring-[#da0a2c] rounded-xl text-white focus:outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#da0a2c] hover:bg-[#b80825] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#da0a2c]/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Kode...</span>
              </>
            ) : (
              <>
                <span>Konfirmasi Kode</span>
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-[#737373]">
            Tidak menerima kode?{' '}
            {timer > 0 ? (
              <span className="text-[#888888] font-mono">Kirim ulang ({timer}s)</span>
            ) : (
              <button
                type="button"
                onClick={() => setTimer(45)}
                className="text-white font-medium hover:underline hover:text-[#da0a2c] transition-colors cursor-pointer"
              >
                Kirim Ulang
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== FORGOT PASSWORD PAGE ====================
export const ForgotPasswordPage: React.FC<{ onNavigate: (path: string, state?: any) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 800);
  };

  return (
    <div className="w-full max-w-sm z-10 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-xl">
        <button
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Login</span>
        </button>

        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#da0a2c]/10 border border-[#da0a2c]/30 flex items-center justify-center mx-auto mb-3 text-[#da0a2c]">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">
            Lupa Kata Sandi?
          </h1>
          <p className="text-xs text-[#888888]">
            Masukkan email Anda untuk menerima instruksi pemulihan
          </p>
        </div>

        {isSent ? (
          <div className="bg-[#18181F] border border-white/10 rounded-xl p-4 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-white font-medium">Link Pemulihan Terkirim!</p>
            <p className="text-[11px] text-[#888888]">
              Silakan periksa kotak masuk email <span className="text-white">{email}</span>.
            </p>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#da0a2c] hover:bg-[#b80825] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#da0a2c]/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <span>Kirim Instruksi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN APP ROOT ====================
export default function App() {
  const [currentPath, setCurrentPath] = useState('/login');
  const [passedState, setPassedState] = useState<any>(null);
  const [mockRequireVerify, setMockRequireVerify] = useState(false);
  const [mockFailLogin, setMockFailLogin] = useState(false);

  const mockAuthContext: AuthContextType = {
    login: async (email) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (mockFailLogin) return { success: false, error: 'Email atau kata sandi tidak sesuai.' };
      if (mockRequireVerify) return { success: false, requiresVerification: true, email };
      return { success: true };
    },
    register: async (name, email) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (mockFailLogin) return { success: false, error: 'Email sudah terdaftar.' };
      return { success: true, requiresVerification: true, email };
    },
    verifyOtp: async (code) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (code === '000000' || mockFailLogin) return { success: false, error: 'Kode OTP tidak sah.' };
      return { success: true };
    },
    loginWithGoogle: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (mockFailLogin) return { success: false, error: 'Gagal mengautentikasi akun Google.' };
      return { success: true };
    }
  };

  const handleNavigate = (path: string, state?: any) => {
    setCurrentPath(path);
    if (state) setPassedState(state);
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      <div className="min-h-screen w-screen bg-[#0A0A0A] text-[#ECECEC] flex flex-col justify-center items-center px-4 py-12 select-none relative overflow-hidden font-sans">
        
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#da0a2c]/5 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Control Switcher Bar */}
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#14141F]/90 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 text-xs text-white max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-2.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#da0a2c] animate-pulse" />
            <span className="font-semibold text-gray-200 text-[11px]">Auth Suite Preview</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {[
              { path: '/login', label: 'Login' },
              { path: '/register', label: 'Register' },
              { path: '/verify-email', label: 'OTP Code' },
              { path: '/forgot-password', label: 'Forgot' },
            ].map((route) => (
              <button
                key={route.path}
                onClick={() => handleNavigate(route.path)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  currentPath === route.path
                    ? 'bg-[#da0a2c] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {route.label}
              </button>
            ))}
          </div>

          <div className="border-l border-white/10 pl-2 flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400 hover:text-white">
              <input
                type="checkbox"
                checked={mockFailLogin}
                onChange={(e) => setMockFailLogin(e.target.checked)}
                className="rounded bg-black border-gray-600 text-[#da0a2c] focus:ring-0"
              />
              Simulasikan Error
            </label>
          </div>
        </div>

        {/* Page Switcher View */}
        <main className="w-full flex justify-center items-center">
          {currentPath === '/login' && <LoginPage onNavigate={handleNavigate} />}
          {currentPath === '/register' && <RegisterPage onNavigate={handleNavigate} />}
          {currentPath === '/verify-email' && (
            <VerifyEmailPage onNavigate={handleNavigate} emailParam={passedState?.email} />
          )}
          {currentPath === '/forgot-password' && <ForgotPasswordPage onNavigate={handleNavigate} />}
          
          {currentPath === '/studio' && (
            <div className="w-full max-w-sm bg-[#111114] border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-[#da0a2c]/10 border border-[#da0a2c]/30 flex items-center justify-center mx-auto text-[#da0a2c] shadow-[0_0_25px_rgba(218,10,44,0.3)]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Berhasil Masuk Studio</h2>
              <p className="text-xs text-[#888888]">
                Autentikasi selesai. Selamat bekerja di ruang studio Anda!
              </p>
              <button
                onClick={() => handleNavigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#da0a2c] hover:bg-[#b80825] text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-[#da0a2c]/20"
              >
                Kembali ke Login
              </button>
            </div>
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}
