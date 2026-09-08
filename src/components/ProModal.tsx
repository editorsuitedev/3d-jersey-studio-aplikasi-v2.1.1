import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Zap,
  Shield,
  Image,
  Film,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Lock,
  QrCode,
  Building2,
  Smartphone,
  Copy,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  lockedModelName?: string | null;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  lockedModelName,
}) => {
  const { currentUser, refreshUser } = useAuth();
  const [checkoutStep, setCheckoutStep] = useState<'features' | 'xendit' | 'success'>('features');
  const [activePaymentTab, setActivePaymentTab] = useState<'qris' | 'va' | 'ewallet'>('qris');
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bni' | 'bri'>('bca');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyPro = currentUser?.plan === 'pro';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleStartCheckout = async () => {
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

    try {
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('editorsuite_auth_token') || ''}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal membuat tagihan pembayaran Xendit.');
        setIsProcessing(false);
        return;
      }

      setInvoiceData(data);

      if (data.invoice_url && !data.is_simulated) {
        // Direct to Xendit Hosted Checkout
        window.location.href = data.invoice_url;
        return;
      }

      // Show integrated Xendit Checkout in modal
      setCheckoutStep('xendit');
      setIsProcessing(false);
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungi gateway pembayaran Xendit.');
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentUser) return;
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('editorsuite_auth_token') || ''}`,
        },
        body: JSON.stringify({ externalId: invoiceData?.external_id }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengonfirmasi pembayaran.');
        setIsConfirming(false);
        return;
      }

      await refreshUser();
      setCheckoutStep('success');

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#da0a2c', '#FF4D6D', '#FFD166', '#06D6A0', '#118AB2'],
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    } catch {
      setErrorMessage('Terjadi kendala saat memverifikasi pembayaran dengan Xendit.');
    } finally {
      setIsConfirming(false);
    }
  };

  const proFeatures = [
    {
      icon: Crown,
      title: 'Semua 10 Koleksi Model 3D Jersey',
      desc: 'Buka akses penuh O-Neck, V-Neck, Raglan, Polo V1, Polo V2, Hybrid Neck, dan Casual Neck kits',
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
      desc: 'Dukungan QRIS instant, Virtual Account (BCA, BNI, BRI, Mandiri) & e-Wallet (OVO, DANA)',
    },
  ];

  const vaNumbers = {
    bca: '880812' + (currentUser?.id ? currentUser.id.replace(/\D/g, '').slice(0, 8).padEnd(8, '4') : '98765432'),
    mandiri: '890812' + (currentUser?.id ? currentUser.id.replace(/\D/g, '').slice(0, 8).padEnd(8, '5') : '12345678'),
    bni: '880899' + (currentUser?.id ? currentUser.id.replace(/\D/g, '').slice(0, 8).padEnd(8, '6') : '87654321'),
    bri: '880877' + (currentUser?.id ? currentUser.id.replace(/\D/g, '').slice(0, 8).padEnd(8, '7') : '23456789'),
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#121212] border border-[#2E2E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Crown theme */}
        <div className="p-4 sm:p-5 border-b border-[#262626] bg-gradient-to-b from-[#220B0F] to-[#0D0D0D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checkoutStep === 'xendit' && (
              <button
                onClick={() => setCheckoutStep('features')}
                className="w-7 h-7 rounded flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer mr-0.5"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
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
                {checkoutStep === 'xendit'
                  ? 'Pembayaran Terintegrasi Xendit Gateway'
                  : 'Akses Penuh Semua Model 3D & Fitur Studio'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCheckoutStep('features');
              onClose();
            }}
            className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar">
          {/* Locked Model Notice if user clicked a specific locked model */}
          {lockedModelName && checkoutStep === 'features' && !isAlreadyPro && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-[#da0a2c]/20 to-transparent border border-[#da0a2c]/40 flex items-center gap-2.5 text-white">
              <Lock className="w-4 h-4 text-[#da0a2c] shrink-0" />
              <div className="text-[11px]">
                Model <b>&ldquo;{lockedModelName}&rdquo;</b> terkunci. Paket Free hanya dapat mengakses model <b>POLO V2</b>. Upgrade ke PRO Lifetime untuk membuka seluruh 10 model 3D!
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Feature Overview & Pricing */}
          {checkoutStep === 'features' && (
            <>
              {isAlreadyPro ? (
                <div className="p-5 rounded-xl bg-[#142A19] border border-[#22C55E]/30 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 text-[#4ADE80] flex items-center justify-center mx-auto">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-base">Status PRO Lifetime Aktif!</h4>
                  <p className="text-[#A3A3A3] text-xs">
                    Akun Anda ({currentUser?.email}) telah memiliki lisensi penuh untuk seluruh 10 model 3D dan fitur render resolusi tinggi.
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
                        <div className="p-1.5 rounded bg-[#222222] border border-[#333333] mt-0.5 text-amber-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
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
                    <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] block">
                      Akses Selamanya &middot; Bebas Biaya Langganan
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-white">Rp 199.000</span>
                      <span className="text-xs text-[#666666] line-through">Rp 499.000</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] font-bold text-[10px]">
                      Hemat 60%
                    </span>
                  </div>
                </div>
              )}

              {/* CTA Button */}
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
                    onClick={handleStartCheckout}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-[0.99] cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyiapkan Tagihan Xendit...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-white" />
                        <span>Bayar Sekarang via Xendit (QRIS, VA & E-Wallet)</span>
                      </>
                    )}
                  </button>
                )}
                <div className="flex items-center justify-center gap-2 text-[10px] text-[#666666]">
                  <Shield className="w-3 h-3 text-[#da0a2c]" />
                  <span>Xendit Verified Gateway &middot; Otomatis Terhubung &middot; Instan</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Xendit Payment Interface */}
          {checkoutStep === 'xendit' && (
            <div className="space-y-4">
              {/* Payment Summary Box */}
              <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2E2E2E] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#da0a2c]">
                      Xendit Checkout
                    </span>
                    <span className="text-[10px] text-[#737373] font-mono">
                      {invoiceData?.external_id || 'INV-ESPRO-LIFETIME'}
                    </span>
                  </div>
                  <div className="text-lg font-extrabold text-white mt-0.5">Rp 199.000</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Menunggu Bayar
                  </span>
                </div>
              </div>

              {/* Interactive Simulation / Test Notice */}
              {invoiceData?.is_simulated && (
                <div className="p-2.5 rounded-lg bg-[#1A160F] border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold text-white block">Xendit Checkout Interaktif:</span>
                    Silakan pilih metode (QRIS, VA, atau E-Wallet), lalu klik tombol <b className="text-emerald-400">Saya Sudah Bayar</b> di bawah untuk memverifikasi dan mengaktifkan akun PRO Lifetime secara instan.
                  </div>
                </div>
              )}

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#181818] rounded-lg border border-[#262626]">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('qris')}
                  className={`py-2 px-2 rounded-md font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePaymentTab === 'qris'
                      ? 'bg-[#262626] text-white shadow'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-[#da0a2c]" />
                  <span>QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('va')}
                  className={`py-2 px-2 rounded-md font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePaymentTab === 'va'
                      ? 'bg-[#262626] text-white shadow'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Virtual Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('ewallet')}
                  className={`py-2 px-2 rounded-md font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePaymentTab === 'ewallet'
                      ? 'bg-[#262626] text-white shadow'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>E-Wallet</span>
                </button>
              </div>

              {/* Tab 1: QRIS */}
              {activePaymentTab === 'qris' && (
                <div className="p-4 rounded-xl bg-[#171717] border border-[#2E2E2E] text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-800/40 text-[10px] text-red-300 font-bold">
                    <span>QRIS NASIONAL (NMID: ID10200392019)</span>
                  </div>

                  {/* QRIS Visual Code */}
                  <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Stylized QR Matrix Pattern */}
                      <rect width="100" height="100" fill="white" />
                      {/* Top-left Corner Square */}
                      <rect x="5" y="5" width="28" height="28" fill="#111" />
                      <rect x="9" y="9" width="20" height="20" fill="white" />
                      <rect x="13" y="13" width="12" height="12" fill="#da0a2c" />
                      {/* Top-right Corner Square */}
                      <rect x="67" y="5" width="28" height="28" fill="#111" />
                      <rect x="71" y="9" width="20" height="20" fill="white" />
                      <rect x="75" y="13" width="12" height="12" fill="#da0a2c" />
                      {/* Bottom-left Corner Square */}
                      <rect x="5" y="67" width="28" height="28" fill="#111" />
                      <rect x="9" y="71" width="20" height="20" fill="white" />
                      <rect x="13" y="75" width="12" height="12" fill="#da0a2c" />
                      {/* Data dots */}
                      <rect x="38" y="8" width="6" height="6" fill="#222" />
                      <rect x="48" y="12" width="6" height="6" fill="#222" />
                      <rect x="56" y="6" width="6" height="6" fill="#222" />
                      <rect x="38" y="24" width="6" height="6" fill="#222" />
                      <rect x="48" y="28" width="6" height="6" fill="#222" />
                      <rect x="56" y="20" width="6" height="6" fill="#222" />
                      <rect x="8" y="38" width="6" height="6" fill="#222" />
                      <rect x="18" y="44" width="6" height="6" fill="#222" />
                      <rect x="28" y="38" width="6" height="6" fill="#222" />
                      <rect x="8" y="52" width="6" height="6" fill="#222" />
                      <rect x="18" y="56" width="6" height="6" fill="#222" />
                      <rect x="42" y="42" width="16" height="16" fill="#da0a2c" rx="2" />
                      <rect x="46" y="46" width="8" height="8" fill="white" />
                      <rect x="64" y="38" width="6" height="6" fill="#222" />
                      <rect x="74" y="42" width="6" height="6" fill="#222" />
                      <rect x="84" y="38" width="6" height="6" fill="#222" />
                      <rect x="68" y="52" width="6" height="6" fill="#222" />
                      <rect x="80" y="56" width="6" height="6" fill="#222" />
                      <rect x="38" y="68" width="6" height="6" fill="#222" />
                      <rect x="48" y="74" width="6" height="6" fill="#222" />
                      <rect x="56" y="68" width="6" height="6" fill="#222" />
                      <rect x="38" y="82" width="6" height="6" fill="#222" />
                      <rect x="48" y="86" width="6" height="6" fill="#222" />
                      <rect x="58" y="82" width="6" height="6" fill="#222" />
                      <rect x="70" y="72" width="6" height="6" fill="#222" />
                      <rect x="82" y="76" width="6" height="6" fill="#222" />
                      <rect x="74" y="86" width="6" height="6" fill="#222" />
                      <rect x="86" y="86" width="6" height="6" fill="#222" />
                    </svg>
                  </div>

                  <p className="text-[11px] text-[#A3A3A3]">
                    Buka GoPay, OVO, DANA, BCA Mobile, Livin Mandiri, atau aplikasi perbankan Anda, lalu pindai kode QRIS di atas.
                  </p>
                </div>
              )}

              {/* Tab 2: Virtual Account */}
              {activePaymentTab === 'va' && (
                <div className="p-4 rounded-xl bg-[#171717] border border-[#2E2E2E] space-y-3">
                  <div className="text-[11px] text-[#A3A3A3] mb-1">Pilih Bank Virtual Account:</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['bca', 'mandiri', 'bni', 'bri'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        className={`py-2 px-1 rounded-lg border text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          selectedBank === b
                            ? 'bg-[#da0a2c]/20 border-[#da0a2c] text-white'
                            : 'bg-[#202020] border-[#333333] text-[#888888] hover:text-white'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-[#111111] border border-[#2E2E2E] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#888888]">
                      <span>Nomor Virtual Account {selectedBank.toUpperCase()}</span>
                      {copiedText === 'va' && (
                        <span className="text-emerald-400 font-semibold">Tersalin!</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-mono font-bold text-white tracking-wider">
                        {vaNumbers[selectedBank]}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(vaNumbers[selectedBank], 'va')}
                        className="px-2.5 py-1 rounded bg-[#262626] hover:bg-[#333333] text-white text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#737373]">
                    Transfer via ATM, Mobile Banking, atau Internet Banking ke nomor Virtual Account di atas.
                  </p>
                </div>
              )}

              {/* Tab 3: E-Wallet */}
              {activePaymentTab === 'ewallet' && (
                <div className="p-4 rounded-xl bg-[#171717] border border-[#2E2E2E] space-y-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    {['OVO', 'DANA', 'ShopeePay', 'LinkAja'].map((w) => (
                      <span
                        key={w}
                        className="px-2.5 py-1 rounded-md bg-[#222222] border border-[#333333] text-[10px] font-bold text-[#CCCCCC]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#A3A3A3]">
                    Pembayaran instan langsung ke aplikasi dompet digital pilihan Anda terhubung melalui Xendit API.
                  </p>
                </div>
              )}

              {/* Confirmation / Simulation Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isConfirming}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.99] cursor-pointer"
                >
                  {isConfirming ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Pembayaran Xendit...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Saya Sudah Bayar / Selesaikan Pembayaran</span>
                    </>
                  )}
                </button>
                <div className="text-center text-[10px] text-[#666666]">
                  Status otomatis tersinkronisasi dengan Xendit Webhook Token
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success Celebration */}
          {checkoutStep === 'success' && (
            <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Pembayaran Xendit Berhasil!</h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  Status PRO Lifetime Anda Kini Aktif Sepenuhnya
                </p>
              </div>

              <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto leading-relaxed">
                Terima kasih atas pembelian Anda. Seluruh 10 koleksi model 3D (termasuk O-Neck, V-Neck, Raglan, dan lainnya) serta fitur export resolusi 4K kini terbuka untuk akun Anda.
              </p>

              <button
                onClick={() => {
                  setCheckoutStep('features');
                  onClose();
                }}
                className="w-full py-3 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] text-white font-bold text-xs transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Buka Semua Model 3D & Mulai Desain</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
