import React, { useState, useRef, useEffect } from 'react';
import { Download, Crown, User as UserIcon, Shirt, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  currentModelName: string;
  onOpenExport: () => void;
  onOpenUVEditor?: () => void;
  onOpenLogin: () => void;
  onOpenPro: () => void;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  currentUser: { email: string; name: string; plan?: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentModelName,
  onOpenExport,
  onOpenLogin,
  onOpenPro,
  onNavigate,
  onLogout,
  currentUser,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (currentUser) {
      setIsDropdownOpen((prev) => !prev);
    } else {
      if (onNavigate) {
        onNavigate('/login');
      } else {
        onOpenLogin();
      }
    }
  };

  return (
    <header className="h-14 bg-[#0D0D0D] border-b border-[#262626] px-3 sm:px-4 flex items-center justify-between z-40 select-none relative">
      {/* Left: Brand Logo + STUDIO + Model Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <a
          href="https://editorsuite.cloud"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90 shrink-0"
        >
          <img
            src="/logo-editorsuite.svg"
            alt="STUDIO"
            className="h-8 sm:h-6 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
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
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0" ref={dropdownRef}>
        {/* Export Button (Desktop) */}
        <button
          onClick={onOpenExport}
          className="hidden md:flex px-3.5 py-1.5 rounded bg-[#262626] border border-[#595959] text-xs font-semibold text-white hover:bg-[#333333] hover:border-white transition-all items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#ECECEC]" />
          <span className="tracking-tight text-xs">EXPORT</span>
        </button>

        <div className="hidden md:block h-4 w-px bg-[#262626] mx-0.5" />

        {/* PRO Button */}
        <button
          onClick={onOpenPro}
          className={`h-8 px-2 sm:px-2.5 rounded font-bold text-xs flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
            currentUser?.plan === 'pro'
              ? 'bg-[#da0a2c]/20 border border-[#da0a2c]/60 text-[#FF6B81] hover:bg-[#da0a2c]/30'
              : 'bg-[#da0a2c] hover:bg-[#b80825] text-white'
          }`}
          title={currentUser?.plan === 'pro' ? 'PRO Lifetime Aktif' : 'Upgrade ke PRO via Xendit'}
        >
          <Crown className="w-3.5 h-3.5" />
          <span className="tracking-tight hidden xs:inline">
            {currentUser?.plan === 'pro' ? 'PRO' : 'UPGRADE PRO'}
          </span>
        </button>

        {/* Avatar Icon for Login Access */}
        <div className="relative">
          <button
            onClick={handleAvatarClick}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1C1C1C] hover:bg-[#282828] text-[#A3A3A3] hover:text-white transition-all flex items-center justify-center relative active:scale-95 group cursor-pointer border border-[#262626]"
            title={currentUser ? `Akun: ${currentUser.name}` : 'Login / Studio Account'}
          >
            {currentUser ? (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold text-xs sm:text-sm flex items-center justify-center">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#A3A3A3] group-hover:text-white transition-colors" />
            )}
          </button>

          {/* User Menu Dropdown */}
          {isDropdownOpen && currentUser && (
            <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-[#2E2E2E] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-[#242424]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      currentUser.plan === 'pro'
                        ? 'bg-[#da0a2c] text-white'
                        : 'bg-[#262626] text-[#A3A3A3]'
                    }`}
                  >
                    {currentUser.plan === 'pro' ? 'PRO' : 'FREE'}
                  </span>
                </div>
                <div className="text-[11px] text-[#737373] truncate font-mono mt-0.5">
                  {currentUser.email}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNavigate?.('/account');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#CCCCCC] hover:text-white hover:bg-[#222222] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#888888]" />
                  <span>Pengaturan Akun</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout?.();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#EF4444] hover:bg-[#261515] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

