import React from 'react';
import { Download, Crown, User, Shirt, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentModelName: string;
  onOpenExport: () => void;
  onOpenUVEditor?: () => void;
  onOpenLogin: () => void;
  onOpenPro: () => void;
  currentUser: { email: string; name: string } | null;
  isPro?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentModelName,
  onOpenExport,
  onOpenLogin,
  onOpenPro,
  currentUser,
  isPro = false,
}) => {
  return (
    <header className="h-14 bg-[#0D0D0D] border-b border-[#262626] px-3 sm:px-4 flex items-center justify-between z-40 select-none">
      {/* Left: Brand Logo + STUDIO + Model Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <a
          href="https://editorsuite.id"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90 shrink-0"
        >
          <img
            src="/logo-editorsuite.svg"
            alt="STUDIO"
            className="h-8 sm:h-6 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://editorsuite.id/logo-editorsuite.svg';
            }}
          />
          <span className="text-xs sm:text-sm font-bold tracking-tight text-[#ECECEC] hidden xs:inline">
            STUDIO
          </span>
        </a>

        {/* Current Mockup Indicator (Hidden on mobile) */}
        <div className="hidden md:block h-4 w-px bg-[#262626] mx-0.5 sm:mx-1 shrink-0" />
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded bg-[#181818] border border-[#2A2A2A] text-xs text-[#A3A3A3] min-w-0">
          <Shirt className="w-3.5 h-3.5 text-[#595959] shrink-0" />
          <span className="text-[#ECECEC] font-medium tracking-tight truncate max-w-[85px] sm:max-w-[150px] md:max-w-none">
            {currentModelName}
          </span>
        </div>

        {/* Plan Indicator Pill (Free or Pro) - visibility hidden per request */}
        <div className="hidden sm:flex items-center">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1F1F1F] border border-[#333333] text-[#A3A3A3] invisible"
            style={{ visibility: 'hidden' }}
          ></span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Export Button (Desktop) - without scale on hover */}
        <button
          onClick={onOpenExport}
          className="hidden md:flex px-3.5 py-1.5 rounded bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] hover:border-white transition-colors items-center gap-2 shadow-sm cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-[#ECECEC]" />
          <span className="tracking-tight text-xs">EXPORT</span>
        </button>

        <div className="hidden md:block h-4 w-px bg-[#262626] mx-0.5" />

        {/* PRO Button / Upgrade CTA */}
        {isPro ? (
          <button
            onClick={onOpenPro}
            className="h-8 px-2 sm:px-2.5 rounded-lg bg-[#da0a2c]/20 border border-[#da0a2c]/60 text-white font-bold text-xs flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer hover:bg-[#da0a2c]/30"
            title="Editor Suite Pro Aktif - Klik untuk kelola paket"
          >
            <Crown className="w-3.5 h-3.5 text-[#da0a2c] fill-[#da0a2c]" />
            <span className="tracking-tight hidden xs:inline">PRO AKTIF</span>
          </button>
        ) : (
          <button
            onClick={onOpenPro}
            className="h-8 px-2 sm:px-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] border border-[#da0a2c] text-white font-bold text-xs flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm shadow-red-950/40 active:scale-95 cursor-pointer"
            title="Upgrade ke Pro Plan (Rp249.000/bln)"
          >
            <Crown className="w-3.5 h-3.5 text-white" />
            <span className="tracking-tight">UPGRADE PRO</span>
          </button>
        )}

        {/* Avatar Icon for Login Access */}
        <button
          onClick={onOpenLogin}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#dc2626] via-[#7c3aed] to-[#2563eb] p-[1.5px] transition-shadow hover:shadow-[0_0_12px_rgba(37,99,235,0.45)] flex items-center justify-center relative cursor-pointer active:scale-95"
          title={currentUser ? `Account: ${currentUser.name} (${isPro ? 'Pro' : 'Free'})` : 'Login / Studio Account'}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#b91c1c] via-[#4f46e5] to-[#1d4ed8] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-inner">
            {currentUser ? (
              currentUser.name.charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
