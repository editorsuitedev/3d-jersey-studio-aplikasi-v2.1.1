import React from 'react';
import {
  Shirt,
  PersonStanding,
  HelpCircle,
  createLucideIcon,
  X,
  Menu,
} from 'lucide-react';
import { motion } from 'motion/react';
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

        {/* Bottom info without scale on hover */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#1f1f1f] transition-colors relative group cursor-pointer active:scale-95"
            title="Info"
          >
            <HelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#737373] group-hover:text-white transition-colors" />
            <div className="hidden md:block absolute left-14 bg-[#1F1F1F] text-white text-xs px-2.5 py-1 rounded border border-[#3E3E3E] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              Info
            </div>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Floating Hamburger Button in Viewport */}
      {onToggleMobileMenu && (
        <div className="md:hidden absolute top-3 left-3 z-20">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: isDrawerOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={onToggleMobileMenu}
            className="w-9 h-9 rounded-xl bg-[#181818]/90 border border-[#383838] shadow-2xl backdrop-blur-md flex items-center justify-center text-[#D4D4D4] hover:text-white cursor-pointer"
            title={isDrawerOpen ? 'Close 3D Models' : 'Open 3D Models'}
          >
            {isDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>
        </div>
      )}
    </>
  );
};
