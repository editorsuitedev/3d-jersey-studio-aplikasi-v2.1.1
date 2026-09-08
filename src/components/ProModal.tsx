import React, { useState } from 'react';
import { X, Crown, Check, Sparkles, Zap, Shield, Image, Film, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onOpenLogin }) => {
  const { currentUser, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulationNote, setSimulationNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyPro = currentUser?.plan === 'pro';

  const handleCheckoutXendit = async () => {
    if (!currentUser) {
      onClose();
      onOpenLogin();
      return;
    }

    if (isAlreadyPro) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSimulationNote(null);

    try {
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('editorsuite_auth_token') || ''}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal membuat tagihan pembayaran Xendit.');
        setIsProcessing(false);
        return;
      }

      if (data.is_simulated) {
        setSimulationNote(data.message || 'Mode simulasi pembayaran aktif.');
        // In simulation mode without secret key, let user auto-upgrade for preview test
        setTimeout(async () => {
          await refreshUser();
          setIsProcessing(false);
        }, 1200);
        return;
      }

      if (data.invoice_url) {
        // Direct customer to Xendit Secure Checkout
        window.location.href = data.invoice_url;
      } else {
        setErrorMessage('URL tagihan pembayaran tidak ditemukan.');
        setIsProcessing(false);
      }
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungi gateway pembayaran.');
      setIsProcessing(false);
    }
  };

  const proFeatures = [
    {
      icon: Crown,
      title: 'Semua 10 Model 3D Jersey Sportswear',
      desc: 'Akses penuh ke model O-Neck, V-Neck, Raglan, Polo, Long Sleeve, Cycling & Basketball kits',
    },
    {
      icon: Image,
      title: 'Tekstur UV Resolusi Penuh 4096px × 4096px',
      desc: 'Export & pratinjau layout desain vector-grade pada ketajaman 4K optimal',
    },
    {
      icon: Film,
      title: 'Export Turntable 360° Sinematik 4K',
      desc: 'Render video putar 360 derajat format MP4 dan WebM transparan tanpa watermark',
    },
    {
      icon: Sparkles,
      title: 'Pencahayaan Studio & Pantulan Lantai Realistis',
      desc: 'Preset pencahayaan outdoor stadium, rim light studio, dan contact shadow berkualitas tinggi',
    },
    {
      icon: Zap,
      title: 'Background Stadium & Gradient Tanpa Batas',
      desc: 'Upload foto latar belakang beresolusi tinggi dan kustomisasi linear gradient',
    },
    {
      icon: Shield,
      title: 'Lisensi Komersial & Pembayaran Aman Xendit',
      desc: 'Dukungan QRIS, Transfer Virtual Account (BCA, BNI, BRI, Mandiri) & e-Wallet (OVO, DANA)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#121212] border border-[#2E2E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Crown theme */}
        <div className="p-5 border-b border-[#262626] bg-gradient-to-b from-[#220B0F] to-[#0D0D0D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#da0a2c]/10 border border-[#da0a2c]/30 flex items-center justify-center shadow-inner">
              <Crown className="w-5 h-5 text-[#da0a2c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wider text-white">EDITOR SUITE PRO</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#da0a2c] text-white">
                  LIFETIME
                </span>
              </div>
              <p className="text-xs text-[#A3A3A3] -mt-0.5">
                Next-generation 3D Sportswear Mockup Suite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature List & Pricing */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {simulationNote && (
            <div className="p-3 rounded-lg bg-[#142A19] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span>{simulationNote}</span>
            </div>
          )}

          {isAlreadyPro ? (
            <div className="p-4 rounded-xl bg-[#142A19] border border-[#22C55E]/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 text-[#4ADE80] flex items-center justify-center mx-auto">
                <Crown className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Status PRO Lifetime Aktif!</h4>
              <p className="text-[#A3A3A3] text-xs">
                Akun Anda ({currentUser?.email}) telah memiliki lisensi penuh untuk seluruh fitur 3D Jersey Studio tanpa batas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {proFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded bg-[#222222] border border-[#333333] mt-0.5 text-amber-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-white block text-[11px]">{f.title}</span>
                      <span className="text-[10px] text-[#888888] leading-tight block mt-0.5">
                        {f.desc}
                      </span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-[#22C55E] mt-1 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Pricing Box (hidden if already pro) */}
          {!isAlreadyPro && (
            <div className="p-3.5 rounded-xl bg-[#171717] border border-[#333333] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] block">Investasi Sekali Seumur Hidup</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-white">Rp 199.000</span>
                  <span className="text-xs text-[#666666] line-through">Rp 499.000</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] font-bold text-[10px]">
                  Diskon 60%
                </span>
              </div>
            </div>
          )}

          {/* CTA Xendit Payment */}
          <div className="pt-1 space-y-2">
            {isAlreadyPro ? (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tutup & Mulai Mendesain</span>
              </button>
            ) : (
              <button
                onClick={handleCheckoutXendit}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-[0.99] cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghubungkan ke Xendit...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Bayar Sekarang dengan Xendit (QRIS, VA & E-Wallet)</span>
                  </>
                )}
              </button>
            )}
            <div className="flex items-center justify-center gap-3 text-[10px] text-[#666666]">
              <span>QRIS</span>
              <span>&bull;</span>
              <span>BCA / Mandiri / BNI / BRI</span>
              <span>&bull;</span>
              <span>OVO / DANA / ShopeePay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
