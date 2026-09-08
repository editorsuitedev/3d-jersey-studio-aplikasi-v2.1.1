import React from 'react';
import {
  Shirt,
  PersonStanding,
  HelpCircle,
  createLucideIcon,
  X,
  Menu,
} from 'lucide-react';
import { ActiveTool } from '../types';

// Custom Lucide-compliant Hanger icon
const Hanger = createLucideIcon('Hanger', [
  ['path', { d: 'M12 10.5L3 17.5a1 1 0 0 0 .6 1.5h16.8a1 1 0 0 0 .6-1.5L12 10.5z', key: 'h1' }],
  ['path', { d: 'M12 10.5V8a2.5 2.5 0 1 1 2.5-2.5', key: 'h2' }],
]);

interface SidebarNavProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  isDrawerOpen: boolean;
  drawerCategory: 'jersey' | 'hanger' | 'mannequin';
  onOpenDrawerCategory: (category: 'jersey' | 'hanger' | 'mannequin') => void;
  onOpenHelp: () => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  onToggleMobileMenu?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  isDrawerOpen,
  drawerCategory,
  onOpenDrawerCategory,
  onOpenHelp,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  onToggleMobileMenu,
}) => {
  const tools = [
    {
      id: 'mockups' as ActiveTool,
      label: '3D Jersey',
      category: 'jersey' as const,
      icon: Shirt,
      desc: 'Browse soccer jersey mockups & cuts',
      active: isDrawerOpen && drawerCategory === 'jersey',
    },
    {
      id: 'hanger' as ActiveTool,
      label: '3D Hanger',
      category: 'hanger' as const,
      icon: Hanger,
      desc: 'Wooden & plastic apparel hangers',
      active: isDrawerOpen && drawerCategory === 'hanger',
    },
    {
      id: 'mannequin' as ActiveTool,
      label: '3D Mannequin',
      category: 'mannequin' as const,
      icon: PersonStanding,
      desc: 'Athletic torso & display mannequins',
      active: isDrawerOpen && drawerCategory === 'mannequin',
    },
  ];

  return (
    <>
      {/* 1. Desktop Vertical Sidebar Strip (Hidden on mobile) */}
      <aside className="hidden md:flex w-12 sm:w-14 bg-[#0D0D0D] border-r border-[#262626] flex-col items-center justify-between py-2.5 sm:py-3 z-30 select-none shrink-0">
        {/* Top tool buttons */}
        <div className="flex flex-col items-center gap-2">
          {tools.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <button
                key={item.id}
                onClick={() => onOpenDrawerCategory(item.category)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-[#262626] text-white border border-[#595959]'
                    : 'text-[#595959] hover:text-[#D4D4D4] hover:bg-[#181818]'
                }`}
                title={item.label}
              >
                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                {/* Tooltip on desktop only */}
                <div className="hidden md:block absolute left-14 bg-[#1F1F1F] text-white text-xs px-2.5 py-1 rounded border border-[#3E3E3E] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom info */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[#595959] hover:text-[#D4D4D4] hover:bg-[#181818] transition-all relative group cursor-pointer"
            title="Info"
          >
            <HelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            <div className="hidden md:block absolute left-14 bg-[#1F1F1F] text-white text-xs px-2.5 py-1 rounded border border-[#3E3E3E] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              Info
            </div>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Floating Hamburger Button in Viewport (if Header isn't used) */}
      {onToggleMobileMenu && (
        <div className="md:hidden absolute top-3 left-3 z-20">
          <button
            onClick={onToggleMobileMenu}
            className="w-9 h-9 rounded-xl bg-[#181818]/90 border border-[#383838] shadow-2xl backdrop-blur-md flex items-center justify-center text-[#D4D4D4] hover:text-white active:scale-95 cursor-pointer"
            title="Open 3D Catalog Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Mobile Slide-out Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-black/70 z-50 md:hidden backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#121212] border-r border-[#262626] z-50 flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-left duration-200 md:hidden">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo-editorsuite.svg"
                    alt="STUDIO"
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
                    }}
                  />
                  <span className="text-xs font-bold tracking-tight text-[#ECECEC]">
                    3D CATALOGS
                  </span>
                </div>
                <button
                  onClick={onCloseMobileMenu}
                  className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
                  title="Close Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tool Category List */}
              <div className="mt-4 flex flex-col gap-2">
                {tools.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.active;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onCloseMobileMenu?.();
                        onOpenDrawerCategory(item.category);
                      }}
                      className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all active:scale-98 cursor-pointer ${
                        isActive
                          ? 'bg-[#262626] border-[#595959] text-white'
                          : 'bg-[#181818] border-[#2A2A2A] text-[#D4D4D4] hover:bg-[#222222] hover:border-[#3E3E3E]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-white text-black' : 'bg-[#242424] text-[#ECECEC]'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold tracking-tight text-[#ECECEC]">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#737373] truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Info Button */}
            <div className="pt-3 border-t border-[#262626]">
              <button
                onClick={() => {
                  onCloseMobileMenu?.();
                  onOpenHelp();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Shortcuts</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
