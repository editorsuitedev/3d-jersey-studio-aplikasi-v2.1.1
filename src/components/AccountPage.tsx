import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Check,
  AlertCircle,
  Save,
  Calendar,
  Key,
  Crown,
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  CreditCard,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ExportHistoryItem, Payment, Subscription } from '../types/auth';

interface AccountPageProps {
  onNavigate: (path: string) => void;
  onOpenProModal?: (reason?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate, onOpenProModal }) => {
  const { currentUser, updateProfile, logout, upgradeToPro, cancelSubscription } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'history'>('profile');
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const isPro = currentUser?.plan === 'pro';

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Load account extra info (subscriptions, payments, export history)
  const fetchAccountData = async () => {
    setIsLoadingData(true);
    try {
      const [accRes, expRes] = await Promise.all([
        fetch('/api/account', { credentials: 'include' }).catch(() => null),
        fetch('/api/export/history', { credentials: 'include' }).catch(() => null),
      ]);

      if (accRes && accRes.ok) {
        const accData = await accRes.json();
        if (accData.subscription) setSubscription(accData.subscription);
        if (accData.payments) setPayments(accData.payments);
      }

      if (expRes && expRes.ok) {
        const expData = await expRes.json();
        if (Array.isArray(expData)) setExportHistory(expData);
      }
    } catch (err) {
      console.warn('[Account] Fetch error:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [currentUser?.plan]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage('Nama minimal 2 karakter.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({ name: name.trim(), email: email.trim() });
      if (res.success) {
        setSuccessMessage('Profil berhasil diperbarui di database!');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.error || 'Gagal memperbarui profil.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectUpgrade = async () => {
    setIsUpgrading(true);
    setErrorMessage(null);
    try {
      const res = await upgradeToPro('midtrans');
      if (res.success) {
        setSuccessMessage('Selamat! Akun Anda berhasil di-upgrade ke PRO (Rp249.000 / bulan).');
        await fetchAccountData();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(res.error || 'Gagal memproses upgrade');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan langganan PRO?')) return;

    setIsCancelling(true);
    try {
      const res = await cancelSubscription();
      if (res.success) {
        setSuccessMessage('Langganan PRO telah dibatalkan.');
        await fetchAccountData();
      } else {
        setErrorMessage(res.error || 'Gagal membatalkan langganan');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      onNavigate('/login');
    } catch {
      onNavigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0A0A0A] text-[#ECECEC] flex flex-col items-center px-4 py-8 select-none relative overflow-y-auto custom-scrollbar">
      {/* Back to Studio action */}
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between z-10">
        <button
          onClick={() => onNavigate('/studio')}
          className="p-2.5 px-3.5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#555555] text-[#A3A3A3] hover:text-white transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Studio</span>
        </button>

        {/* Plan indicator badge */}
        <div className="flex items-center gap-2">
          {isPro ? (
            <div className="px-3 py-1 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] font-bold text-xs flex items-center gap-1.5 shadow-sm">
              <Crown className="w-3.5 h-3.5" />
              <span>PRO MEMBER</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenProModal?.('Upgrade akun Anda ke PRO')}
              className="px-3 py-1 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#EF4444] text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Paket FREE • Upgrade PRO</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Account Container */}
      <div className="w-full max-w-3xl z-10 space-y-6">
        {/* User Identity Card */}
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-[#262626]">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-[#EF4444] via-[#B91C1C] to-[#1F1F1F] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shrink-0 border border-white/10">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-center sm:text-left space-y-1 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {currentUser?.name || 'Studio User'}
                </h1>
                {isPro ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#EF4444] text-white uppercase tracking-wider">
                    PRO (Rp249.000/bln)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#262626] text-[#A3A3A3] uppercase">
                    FREE PLAN
                  </span>
                )}
              </div>
              <p className="text-xs text-[#888888] font-mono">{currentUser?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Editor Suite Authenticated</span>
                </div>
                {currentUser?.email_verified ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Email Terverifikasi</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-[#888888] text-[10px] font-medium">
                    <span>Email Belum Diverifikasi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="py-2 px-3 rounded-xl bg-[#1A1414] border border-[#EF4444]/30 text-xs font-medium text-[#EF4444] hover:bg-[#2A1818] hover:border-[#EF4444] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-6 pt-4 border-b border-[#222222] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 transition-colors relative cursor-pointer ${
                activeTab === 'profile' ? 'text-white font-bold' : 'text-[#737373] hover:text-[#ECECEC]'
              }`}
            >
              <span>Detail Akun & Database</span>
              {activeTab === 'profile' && (
                <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-white" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('subscription')}
              className={`pb-2.5 transition-colors relative cursor-pointer ${
                activeTab === 'subscription' ? 'text-white font-bold' : 'text-[#737373] hover:text-[#ECECEC]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Langganan & Billing (SaaS)</span>
              </span>
              {activeTab === 'subscription' && (
                <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#EF4444]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 transition-colors relative cursor-pointer ${
                activeTab === 'history' ? 'text-white font-bold' : 'text-[#737373] hover:text-[#ECECEC]'
              }`}
            >
              <span>Riwayat Ekspor</span>
              {activeTab === 'history' && (
                <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          </div>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-[#142A19] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Detail Akun & Database User */}
          {activeTab === 'profile' && (
            <div className="mt-5 space-y-5">
              {/* Edit Form */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#A3A3A3] block mb-1.5">
                      Nama Pengguna
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#595959] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
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
                        disabled={isSaving}
                        className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 rounded-xl bg-[#262626] border border-[#444444] text-xs font-semibold text-white hover:bg-[#333333] hover:border-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan Nama & Email</span>
                    </>
                  )}
                </button>
              </form>

              {/* Core User Database Fields Table */}
              <div className="pt-4 border-t border-[#222222]">
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">
                  Metadata Database User (Core Schema)
                </h3>

                <div className="bg-[#161616] border border-[#242424] rounded-xl divide-y divide-[#222222] text-xs overflow-hidden">
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-[#666666]" />
                      User ID (UUID)
                    </span>
                    <span className="font-mono text-white text-[11px] select-all">
                      {currentUser?.id || '-'}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-[#666666]" />
                      Plan (Paket)
                    </span>
                    <span className="font-bold text-white uppercase text-[11px]">
                      {currentUser?.plan || 'free'}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#666666]" />
                      Password Hash
                    </span>
                    <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Enkripsi Bcrypt (Non-plaintext)
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#666666]" />
                      Email Verification Status
                    </span>
                    <span className={`text-[11px] font-semibold ${currentUser?.email_verified ? 'text-blue-400' : 'text-[#888888]'}`}>
                      {currentUser?.email_verified ? 'Terverifikasi' : 'Belum Diverifikasi'}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#666666]" />
                      Google Account ID
                    </span>
                    <span className="font-mono text-[#D4D4D4] text-[11px]">
                      {currentUser?.google_id || 'Tidak Terhubung'}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#666666]" />
                      IP Address
                    </span>
                    <span className="font-mono text-white text-[11px]">
                      {currentUser?.ip_address || '127.0.0.1'}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#666666]" />
                      Last Login
                    </span>
                    <span className="text-[#D4D4D4] text-[11px]">
                      {formatDate(currentUser?.last_login)}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#666666]" />
                      Created At
                    </span>
                    <span className="text-[#D4D4D4] text-[11px]">
                      {formatDate(currentUser?.created_at)}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[#888888] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#666666]" />
                      Updated At
                    </span>
                    <span className="text-[#D4D4D4] text-[11px]">
                      {formatDate(currentUser?.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Langganan & Billing (Freemium SaaS) */}
          {activeTab === 'subscription' && (
            <div className="mt-5 space-y-5">
              {/* Current Plan Overview Card */}
              <div className={`p-5 rounded-2xl border ${
                isPro
                  ? 'bg-gradient-to-b from-[#201114] to-[#141414] border-[#EF4444]/50'
                  : 'bg-[#161616] border-[#2A2A2A]'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className={`w-5 h-5 ${isPro ? 'text-[#EF4444]' : 'text-[#777777]'}`} />
                      <h2 className="text-base font-bold text-white">
                        {isPro ? 'Paket PRO Aktif' : 'Paket FREE Standar'}
                      </h2>
                    </div>
                    <p className="text-xs text-[#888888] mt-0.5">
                      {isPro
                        ? 'Biaya langganan Rp249.000 / bulan • Akses Penuh ke Semua Fitur & Model'
                        : 'Akses gratis ke editor & 1 model jersey (O-Neck). Fitur ekspor terkunci.'}
                    </p>
                  </div>

                  {isPro ? (
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-full">
                      Status: Active
                    </div>
                  ) : (
                    <button
                      onClick={handleDirectUpgrade}
                      disabled={isUpgrading}
                      className="py-2 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs transition-all shadow-lg shadow-red-950/40 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isUpgrading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Crown className="w-3.5 h-3.5" />
                      )}
                      <span>Upgrade PRO — Rp249.000/bln</span>
                    </button>
                  )}
                </div>

                {/* Features comparison checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#262626] text-xs">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A3A3A3] uppercase">Akses Fitur Anda:</div>
                    <div className="flex items-center gap-2 text-[#D4D4D4]">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Semua fitur editor 3D, UV mapping, layers & material</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#D4D4D4]">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Camera, Lighting & Scene customization</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#D4D4D4]">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>1 Model Jersey (01. O-Neck)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A3A3A3] uppercase">Fitur Khusus PRO:</div>
                    <div className={`flex items-center gap-2 ${isPro ? 'text-white' : 'text-[#777777]'}`}>
                      {isPro ? <Check className="w-3.5 h-3.5 text-[#EF4444]" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Semua 10 Model Jersey atletik lengkap</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isPro ? 'text-white' : 'text-[#777777]'}`}>
                      {isPro ? <Check className="w-3.5 h-3.5 text-[#EF4444]" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Export Image resolusi 4K (PNG/JPG)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isPro ? 'text-white' : 'text-[#777777]'}`}>
                      {isPro ? <Check className="w-3.5 h-3.5 text-[#EF4444]" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Export Video 360° turntable (MP4/WebM)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isPro ? 'text-white' : 'text-[#777777]'}`}>
                      {isPro ? <Check className="w-3.5 h-3.5 text-[#EF4444]" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Export berbagai rasio (16:9, 1:1, 9:16, 4:5)</span>
                    </div>
                  </div>
                </div>

                {/* Cancel option for Pro */}
                {isPro && (
                  <div className="mt-4 pt-3 border-t border-[#331C1F] flex items-center justify-between text-xs">
                    <span className="text-[#888888]">Periode aktif: 30 hari berjalan</span>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={isCancelling}
                      className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer disabled:opacity-50"
                    >
                      {isCancelling ? 'Membatalkan...' : 'Batalkan Langganan'}
                    </button>
                  </div>
                )}
              </div>

              {/* Payments Table */}
              <div>
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#888888]" />
                  <span>Riwayat Pembayaran & Invoice</span>
                </h3>

                {payments.length === 0 ? (
                  <div className="p-6 bg-[#161616] border border-[#222222] rounded-xl text-center text-xs text-[#737373]">
                    Belum ada riwayat pembayaran tercatat di akun ini.
                  </div>
                ) : (
                  <div className="bg-[#161616] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#222222] text-xs">
                    {payments.map((p) => (
                      <div key={p.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{p.invoice_id}</div>
                          <div className="text-[11px] text-[#888888]">
                            Gateway: {p.gateway.toUpperCase()} • {formatDate(p.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">
                            Rp {Number(p.amount).toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-[#888888]">
                            {p.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Riwayat Ekspor (Core export_history table) */}
          {activeTab === 'history' && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#888888]" />
                  <span>Catatan Riwayat Ekspor Pengguna</span>
                </h3>
                <button
                  onClick={fetchAccountData}
                  className="p-1 text-[#888888] hover:text-white cursor-pointer"
                  title="Segarkan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {exportHistory.length === 0 ? (
                <div className="p-8 bg-[#161616] border border-[#222222] rounded-xl text-center text-xs text-[#737373] space-y-1">
                  <Download className="w-6 h-6 mx-auto mb-2 opacity-40 text-white" />
                  <div className="font-semibold text-[#D4D4D4]">Belum ada aktivitas ekspor</div>
                  <p className="text-[11px] text-[#777777]">
                    Semua aktivitas ekspor gambar dan video akan tercatat otomatis di tabel database export_history.
                  </p>
                </div>
              ) : (
                <div className="bg-[#161616] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#222222] text-xs">
                  {exportHistory.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#222222] border border-[#333333] text-white">
                          <Download className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white capitalize">
                            Export {item.type} ({item.format.toUpperCase()})
                          </div>
                          <div className="text-[11px] text-[#888888]">
                            Rasio: {item.resolution} • {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>

                      <div>
                        {item.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            BERHASIL
                          </span>
                        )}
                        {item.status === 'blocked_free_plan' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            DIBLOKIR (PAKET FREE)
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-[#888888]">
                            GAGAL
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
