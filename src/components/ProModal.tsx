import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Zap,
  Download,
  Video,
  Shirt,
  Sparkles,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  reason?: string;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  reason,
}) => {
  const { currentUser, upgradeToPro } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyPro = currentUser?.plan === 'pro';

  const handleUpgrade = async () => {
    if (!currentUser) {
      onClose();
      onOpenLogin();
      return;
    }

    setIsUpgrading(true);
    setErrorMessage(null);
    try {
      const res = await upgradeToPro('midtrans');
      if (res.success) {
        setUpgradeSuccess(true);
        setTimeout(() => {
          setUpgradeSuccess(false);
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Gagal memproses upgrade');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#121212] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#262626] bg-gradient-to-r from-[#1C1214] via-[#161616] to-[#0F0F0F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center shadow-inner">
              <Crown className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">EDITOR SUITE PRO</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#EF4444] text-white uppercase tracking-wider">
                  Rp249.000 / bln
                </span>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Freemium SaaS Platform untuk Desain 3D Jersey & Sportswear
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason banner if triggered from an export attempt or locked model */}
        {reason && (
          <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/20 px-5 py-2.5 flex items-center gap-2.5 text-xs text-[#FCA5A5]">
            <Lock className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{reason}</span>
          </div>
        )}

        {/* Comparison: FREE vs PRO */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* FREE Plan Card */}
            <div className="rounded-xl bg-[#171717] border border-[#2B2B2B] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">FREE</span>
                  <span className="text-[11px] font-semibold text-[#888888]">Gratis Selamanya</span>
                </div>
                <p className="text-[11px] text-[#A3A3A3] mb-3 leading-relaxed">
                  Ideal untuk mengeksplorasi editor dan membuat rancangan awal.
                </p>

                <ul className="space-y-2 text-[11px]">
                  <li className="flex items-center gap-2 text-[#D4D4D4]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Semua fitur editor & 3D viewer</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#D4D4D4]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 Model Jersey (01. O-Neck)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#D4D4D4]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>UV Mapping, Layer & Material</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#D4D4D4]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Camera, Lighting & Scene styling</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-400 font-medium pt-1 border-t border-[#262626]">
                    <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Tidak dapat melakukan export file</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-[#262626] text-center text-[10px] text-[#777777]">
                Paket Aktif Standar
              </div>
            </div>

            {/* PRO Plan Card */}
            <div className="rounded-xl bg-gradient-to-b from-[#1F1416] to-[#161616] border-2 border-[#EF4444]/60 p-4 flex flex-col justify-between relative shadow-lg shadow-red-950/20">
              <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#EF4444] text-white uppercase tracking-wider shadow">
                DIREKOMENDASIKAN
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[#EF4444]" />
                    <span className="font-bold text-white text-sm">PRO</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    Rp249.000 <span className="text-[10px] text-[#9E9E9E] font-normal">/ bln</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#D4D4D4] mb-3 leading-relaxed">
                  Solusi lengkap untuk apparel brand, desainer jersey & vendor konveksi.
                </p>

                <ul className="space-y-2 text-[11px]">
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Check className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Semua fitur Free</span>
                  </li>
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Shirt className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Semua 10 model jersey atletik</span>
                  </li>
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Download className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Export image resolusi ultra-tinggi</span>
                  </li>
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Video className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Export video 360° turntable (MP4/WebM)</span>
                  </li>
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Export berbagai aspect ratio (16:9, 1:1, 9:16, 4:5)</span>
                  </li>
                  <li className="flex items-center gap-2 text-white font-medium">
                    <Zap className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>Akses model baru selama subscription aktif</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-[#332225] flex items-center justify-between text-[11px] text-emerald-400">
                <span>Instant Auto-Activation</span>
                <span>Batal kapan saja</span>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {upgradeSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Selamat! Akun Anda kini berstatus PRO. Fitur export dan model aktif.</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {isAlreadyPro ? (
              <div className="w-full py-3 rounded-xl bg-[#1F2937] text-[#9CA3AF] border border-[#374151] font-semibold text-xs flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Akun Anda saat ini sudah berada di paket PRO Aktif</span>
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading || upgradeSuccess}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-bold text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-red-950/40 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses Upgrade PRO...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-white" />
                    <span>Upgrade ke PRO — Rp249.000 / bulan</span>
                  </>
                )}
              </button>
            )}
            <p className="text-[10px] text-[#666666] text-center mt-2.5">
              Pembayaran aman & instan melalui Payment Gateway terintegrasi • Garansi kepuasan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
