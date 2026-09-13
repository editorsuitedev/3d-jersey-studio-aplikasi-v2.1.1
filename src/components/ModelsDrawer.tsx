import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  Loader2,
  ChevronDown,
  Shirt,
  PersonStanding,
  createLucideIcon,
  Sparkles,
  Lock,
  Crown,
} from 'lucide-react';
import { JERSEY_MODELS } from '../data/models';
import { JerseyModel } from '../types';
import { Jersey3DThumbnail } from './Jersey3DThumbnail';
import { FREE_ALLOWED_MODEL_ID } from '../utils/subscription';

// Custom Lucide-compliant Hanger icon
const Hanger = createLucideIcon('Hanger', [
  ['path', { d: 'M12 10.5L3 17.5a1 1 0 0 0 .6 1.5h16.8a1 1 0 0 0 .6-1.5L12 10.5z', key: 'h1' }],
  ['path', { d: 'M12 10.5V8a2.5 2.5 0 1 1 2.5-2.5', key: 'h2' }],
]);

export type ModelCategory = 'jersey' | 'hanger' | 'mannequin';

interface ModelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (model: JerseyModel) => void;
  isLoadingModel: boolean;
  category?: ModelCategory;
  onChangeCategory?: (category: ModelCategory) => void;
  isPro: boolean;
  onRequirePro: (reason: string, modelName: string) => void;
}

const CATEGORIES: {
  id: ModelCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'jersey',
    label: '3D Jersey',
    icon: Shirt,
    description: 'Browse soccer jersey mockups & cuts',
  },
  {
    id: 'hanger',
    label: '3D Hanger',
    icon: Hanger,
    description: 'Wooden & plastic apparel hangers',
  },
  {
    id: 'mannequin',
    label: '3D Mannequin',
    icon: PersonStanding,
    description: 'Athletic torso & display mannequins',
  },
];

export const ModelsDrawer: React.FC<ModelsDrawerProps> = ({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  isLoadingModel,
  category = 'jersey',
  onChangeCategory,
  isPro,
  onRequirePro,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentCategory = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const CurrentIcon = currentCategory.icon;

  return (
    <aside
      className={`bg-[#121212] border-r border-[#262626] flex flex-col select-none h-full overflow-hidden text-[#ECECEC] transition-all duration-250 ease-out
        fixed inset-y-0 left-0 z-50 w-[calc(100vw-3rem)] max-w-xs
        md:absolute md:left-12 sm:md:left-14 md:top-0 md:bottom-0 md:z-20 md:w-80
        ${
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-full opacity-0 pointer-events-none'
        }
      `}
    >
      <div className="w-[calc(100vw-3rem)] max-w-xs md:w-80 h-full flex flex-col shrink-0">
        {/* Header with Category Dropdown Menu & Close button */}
        <div className="p-3 sm:p-4 border-b border-[#262626] flex items-center justify-between relative bg-[#0D0D0D]">
        {/* Dropdown Menu for 3D Jersey, 3D Hanger, 3D Mannequin */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#333333] hover:border-[#555555] active:bg-[#222222] text-white transition-all cursor-pointer group shadow-xs"
            title="Pilih Model (3D Jersey, 3D Hanger, 3D Mannequin)"
          >
            <CurrentIcon className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight text-[#ECECEC]">
              {currentCategory.label}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#888888] group-hover:text-white transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Items */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#161616] border border-[#333333] rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#737373] border-b border-[#262626]">
                Select 3D Model Category
              </div>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = cat.id === category;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onChangeCategory?.(cat.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#262626] text-white font-semibold'
                        : 'text-[#D4D4D4] hover:bg-[#202020] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white text-black' : 'bg-[#222222] text-[#ECECEC]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold">{cat.label}</div>
                        <div className="text-[10px] text-[#737373] truncate">{cat.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Close Drawer Button */}
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer active:scale-95"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Models Display Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {category === 'jersey' ? (
          /* 3D Jersey Models Grid */
          <div className="grid grid-cols-2 gap-3">
            {JERSEY_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              const isLocked = !isPro && model.id !== FREE_ALLOWED_MODEL_ID;

              const handleClick = () => {
                if (isLocked) {
                  onRequirePro('Model 3D Khusus Pro Plan', model.name);
                  return;
                }
                onSelectModel(model);
              };

              return (
                <div
                  key={model.id}
                  onClick={handleClick}
                  className="group relative p-1 flex flex-col items-center cursor-pointer transition-colors bg-transparent border-none"
                  title={isLocked ? `${model.name} (Eksklusif Pro Plan - Rp249.000/bln)` : model.name}
                >
                  {/* Card 3D visual preview thumbnail */}
                  <div
                    className={`w-full aspect-[4/5] rounded bg-[#0D0D0D] border relative flex items-center justify-center overflow-hidden mb-2 transition-colors ${
                      isSelected ? 'border-white' : 'border-[#222222] group-hover:border-[#444444]'
                    }`}
                  >
                    <Jersey3DThumbnail model={model} isSelected={isSelected} />

                    {/* Pro Lock Badge for locked models on Free Plan */}
                    {isLocked && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#da0a2c] text-white text-[9px] font-bold flex items-center gap-1 shadow-md z-10 tracking-tight">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PRO</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md z-10">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Model Info - Just the name */}
                  <div className="w-full text-center">
                    <h3
                      className={`text-xs font-semibold truncate transition-colors flex items-center justify-center gap-1 ${
                        isSelected ? 'text-white' : 'text-[#D4D4D4] group-hover:text-white'
                      }`}
                    >
                      <span>{model.name}</span>
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        ) : category === 'hanger' ? (
          /* 3D Hanger Collection (Upcoming / Preview) */
          <div className="py-6 px-3 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-white">
              <Hanger className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#da0a2c]/15 text-[#da0a2c] border border-[#da0a2c]/40 text-[10px] font-bold tracking-wide uppercase mb-2">
                <Sparkles className="w-3 h-3" />
                Coming Soon
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">3D Hanger Catalog</h3>
              <p className="text-xs text-[#888888] mt-1 max-w-[200px]">
                Apparel wooden & plastic display hangers will be available in the upcoming PRO update.
              </p>
            </div>
            <button
              onClick={() => onChangeCategory?.('jersey')}
              className="px-4 py-2 rounded-lg bg-[#262626] hover:bg-[#303030] text-white text-xs font-semibold transition-colors cursor-pointer border border-[#3E3E3E]"
            >
              Back to 3D Jersey
            </button>
          </div>
        ) : (
          /* 3D Mannequin Collection (Upcoming / Preview) */
          <div className="py-6 px-3 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2E2E2E] flex items-center justify-center text-white">
              <PersonStanding className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#da0a2c]/15 text-[#da0a2c] border border-[#da0a2c]/40 text-[10px] font-bold tracking-wide uppercase mb-2">
                <Sparkles className="w-3 h-3" />
                Coming Soon
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">3D Mannequin Catalog</h3>
              <p className="text-xs text-[#888888] mt-1 max-w-[200px]">
                Athletic torso & ghost mannequins will be available in the upcoming PRO update.
              </p>
            </div>
            <button
              onClick={() => onChangeCategory?.('jersey')}
              className="px-4 py-2 rounded-lg bg-[#262626] hover:bg-[#303030] text-white text-xs font-semibold transition-colors cursor-pointer border border-[#3E3E3E]"
            >
              Back to 3D Jersey
            </button>
          </div>
        )}
      </div>

      {/* Loading Status notification if switching GLB */}
      {isLoadingModel && (
        <div className="p-3 bg-[#1A1A1A] border-t border-[#262626] flex items-center gap-2 text-xs text-[#A3A3A3]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          <span>Loading 3D model geometry...</span>
        </div>
      )}
      </div>
    </aside>
  );
};
