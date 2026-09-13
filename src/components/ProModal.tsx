import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Crown, Check, Lock, RefreshCw } from 'lucide-react';
import { UserSubscription, PRO_PRICE_FORMATTED, isProSubscription } from '../utils/subscription';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  subscription: UserSubscription;
  onUpgradeToPro: () => void;
  onExpireSubscription?: () => void;
  reasonTitle?: string;
  reasonDesc?: string;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpgradeToPro,
  onExpireSubscription,
  reasonTitle,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isPro = isProSubscription(subscription);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpgradeToPro();
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 600);
  };

  const handleSimulateExpire = () => {
    if (onExpireSubscription) {
      onExpireSubscription();
      onClose();
    }
  };

  // Format expiration date
  const formatExpiry = (isoString: string | null) => {
    if (!isoString) return '30 Hari';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop with smooth blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="w-full max-w-sm sm:max-w-md bg-[#121212] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Header: Clean, consistent with Editor Suite UI */}
            <div className="px-5 py-3.5 border-b border-[#262626] flex items-center justify-between bg-[#0D0D0D]">
              <div className="flex items-center gap-2.5">
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
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Context notification if triggered by clicking a locked feature */}
              {reasonTitle && !isPro && (
                <div className="px-3.5 py-2.5 rounded-lg bg-[#181818] border border-[#2A2A2A] flex items-center gap-2.5">
                  <Lock className="w-3.5 h-3.5 text-[#da0a2c] shrink-0" />
                  <span className="text-[#ECECEC] font-medium leading-snug">
                    {reasonTitle} — Buka akses dengan Pro Plan.
                  </span>
                </div>
              )}

              {/* Pricing Card */}
              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block">
                    Paket Pro
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      Rp249.000
                    </span>
                    <span className="text-xs text-[#737373]">/ bulan</span>
                  </div>
                </div>

                {isPro && (
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#da0a2c]/15 text-[#da0a2c] border border-[#da0a2c]/30 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>Aktif</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Success Notification */}
              {showSuccess && (
                <div className="px-3.5 py-2.5 rounded-lg bg-[#181818] border border-[#333333] flex items-center gap-2 text-[#ECECEC] animate-in fade-in duration-200">
                  <Check className="w-4 h-4 text-[#da0a2c] shrink-0" />
                  <span>
                    Langganan <strong>Pro Plan</strong> berhasil diaktifkan.
                  </span>
                </div>
              )}

              {/* Feature List: Simple, elegant, monochromatic with brand red accent */}
              <div className="space-y-2.5 pt-1">
                <div className="space-y-2 text-[#D4D4D4]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#da0a2c]/15 text-[#da0a2c] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Akses Seluruh Model 3D</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#da0a2c]/15 text-[#da0a2c] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Bebas Export Sepuasnya</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#da0a2c]/15 text-[#da0a2c] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Prioritas Antiran Rendering</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#da0a2c]/15 text-[#da0a2c] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Penggunaan studio tanpa batas</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                {!isPro ? (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Langganan...</span>
                      </>
                    ) : (
                      <span>Upgrade Sekarang</span>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="px-3.5 py-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between">
                      <span className="text-[#888888]">
                        Aktif s/d <strong className="text-white">{formatExpiry(subscription.expiresAt)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                        className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#2E2E2E] text-white font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        Perpanjang
                      </button>
                    </div>

                    {onExpireSubscription && (
                      <button
                        type="button"
                        onClick={handleSimulateExpire}
                        className="w-full py-1.5 text-[11px] text-[#666666] hover:text-[#999999] transition-colors text-center cursor-pointer"
                      >
                        Simulasikan Masa Langganan Berakhir
                      </button>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-[#555555] text-center">
                  Akses langsung aktif • Batalkan kapan saja
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
