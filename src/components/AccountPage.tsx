import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, LogOut, ArrowLeft, Check, AlertCircle, Save, Calendar, Key, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { currentUser, updateProfile, logout, isFirestoreConnected } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

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
        setSuccessMessage('Profil berhasil diperbarui di Firebase Firestore!');
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

  const formattedDate = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Aktif';

  return (
    <div className="min-h-screen w-screen bg-[#0A0A0A] text-[#ECECEC] flex flex-col justify-between items-center px-4 py-8 select-none relative overflow-hidden">
      {/* Top Navigation */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/studio')}
            className="p-2 rounded-xl bg-[#181818] border border-[#2A2A2A] hover:border-[#595959] text-[#A3A3A3] hover:text-white transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Studio</span>
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <img
            src="/logo-editorsuite.svg"
            alt="EDITOR SUITE"
            className="h-7 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
            }}
          />
          <span className="text-sm font-bold tracking-tight text-[#ECECEC]">
            3D JERSEY STUDIO
          </span>
        </div>
      </div>

      {/* Main Account Card */}
      <div className="w-full max-w-xl my-auto z-10">
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          {/* Header Profile Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-[#262626]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg shrink-0">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {currentUser?.name || 'Studio User'}
              </h1>
              <p className="text-xs text-[#888888] font-mono">{currentUser?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Editor Suite Member</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Firestore Synced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="mt-5 p-3 rounded-xl bg-[#142A19] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 p-3 rounded-xl bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase text-[11px] text-[#A3A3A3]">
              Pengaturan Akun & Profil
            </h2>

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
                  disabled={isSaving}
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
                  disabled={isSaving}
                  className="w-full bg-[#181818] border border-[#2A2A2A] focus:border-[#595959] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#555555] focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Read-only metadata */}
            <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl text-xs space-y-2 text-[#888888]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  Database Provider
                </span>
                <span className="text-white font-medium text-[11px]">
                  Firebase Firestore ({isFirestoreConnected ? 'Connected' : 'Offline'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#595959]" />
                  User ID
                </span>
                <span className="text-white font-mono text-[11px] truncate max-w-[200px]">
                  {currentUser?.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#595959]" />
                  Bergabung Sejak
                </span>
                <span className="text-white font-mono text-[11px]">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] hover:border-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#1A1414] border border-[#EF4444]/40 text-xs font-medium text-[#EF4444] hover:bg-[#2A1818] hover:border-[#EF4444] transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Logging out...' : 'Keluar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-4xl flex items-center justify-between text-[11px] text-[#555555] z-10">
        <span>&copy; {new Date().getFullYear()} EDITOR SUITE &middot; 3D Jersey Studio</span>
        <span className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-amber-500" />
          Firebase Firestore Database
        </span>
      </div>
    </div>
  );
};
