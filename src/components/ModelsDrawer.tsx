import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Loader2, ChevronDown, Shirt, PersonStanding, createLucideIcon } from 'lucide-react';
import { JERSEY_MODELS, HANGER_MODELS, MANNEQUIN_MODELS } from '../data/models';
import { JerseyModel } from '../types';
import { Jersey3DThumbnail } from './Jersey3DThumbnail';

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
  onChangeCategory?: (cat: ModelCategory) => void;
}

const CATEGORY_CONFIG: Record<
  ModelCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; desc: string }
> = {
  jersey: {
    label: '3D Jersey',
    icon: Shirt,
    desc: 'Athletic football & sports jersey cuts',
  },
  hanger: {
    label: '3D Hanger',
    icon: Hanger,
    desc: 'Wooden, plastic & steel hangers',
  },
  mannequin: {
    label: '3D Mannequin',
    icon: PersonStanding,
    desc: 'Athletic torso & display mannequins',
  },
};

export const ModelsDrawer: React.FC<ModelsDrawerProps> = ({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  isLoadingModel,
  category = 'jersey',
  onChangeCategory,
}) => {
  const [activeCategory, setActiveCategory] = useState<ModelCategory>(category);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep internal category in sync with prop if changed from external sidebar
  useEffect(() => {
    setActiveCategory(category);
  }, [category]);

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

  if (!isOpen) return null;

  const handleSelectCategory = (cat: ModelCategory) => {
    setActiveCategory(cat);
    setIsDropdownOpen(false);
    onChangeCategory?.(cat);
  };

  const currentCategoryConfig = CATEGORY_CONFIG[activeCategory];
  const CurrentCategoryIcon = currentCategoryConfig.icon;

  // Retrieve current models list based on chosen category
  const activeModels: JerseyModel[] =
    activeCategory === 'hanger'
      ? HANGER_MODELS
      : activeCategory === 'mannequin'
      ? MANNEQUIN_MODELS
      : JERSEY_MODELS;

  return (
    <aside
      id="models-drawer-panel"
      className="fixed inset-y-0 left-0 w-[calc(100vw-3rem)] max-w-xs md:relative md:inset-auto md:w-80 bg-[#121212] border-r border-[#262626] flex flex-col z-35 select-none shadow-2xl h-full animate-in slide-in-from-left-4 fade-in duration-200 ease-out"
    >
      {/* Top Header with Unified Category Dropdown & Close button */}
      <div className="p-3.5 border-b border-[#262626] flex items-center justify-between gap-2 relative bg-[#151515]">
        {/* Dropdown Menu Trigger */}
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="w-full h-9 px-3 rounded-lg bg-[#1F1F1F] hover:bg-[#282828] active:bg-[#2E2E2E] border border-[#3A3A3A] hover:border-[#555555] text-left flex items-center justify-between gap-2 transition-all duration-200 group cursor-pointer shadow-xs"
            title="Pilih Kategori Model 3D"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-[#2A2A2A] text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-colors duration-200">
                <CurrentCategoryIcon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#F3F3F3] tracking-tight truncate">
                {currentCategoryConfig.label}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-[#888888] group-hover:text-white transition-transform duration-200 shrink-0 ${
                isDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Category Dropdown Menu List with smooth animation */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-full bg-[#181818] border border-[#333333] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#666666]">
                Kategori 3D Model
              </div>

              {(['jersey', 'hanger', 'mannequin'] as ModelCategory[]).map((catKey) => {
                const config = CATEGORY_CONFIG[catKey];
                const Icon = config.icon;
                const isSelected = activeCategory === catKey;

                return (
                  <button
                    key={catKey}
                    onClick={() => handleSelectCategory(catKey)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#262626] text-white'
                        : 'text-[#C5C5C5] hover:text-white hover:bg-[#202020]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-white text-black' : 'bg-[#242424] text-[#A3A3A3]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold tracking-tight truncate">
                          {config.label}
                        </div>
                        <div className="text-[10px] text-[#737373] truncate">{config.desc}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Close Drawer Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
          title="Tutup Panel Model 3D"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Direct 3D Models Grid with Key-triggered Smooth Animated Transition */}
      <div
        key={activeCategory}
        className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {activeModels.map((model) => {
          const isSelected = model.id === selectedModelId;
          return (
            <div
              key={model.id}
              onClick={() => onSelectModel(model)}
              className="group relative p-1 flex flex-col items-center cursor-pointer transition-transform duration-200 active:scale-95 bg-transparent border-none"
            >
              {/* Card 3D visual preview thumbnail */}
              <div
                className={`w-full aspect-[4/5] rounded-xl bg-[#0D0D0D] border relative flex items-center justify-center overflow-hidden mb-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-white ring-1 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                    : 'border-[#222222] group-hover:border-[#555555] group-hover:shadow-md'
                }`}
              >
                <Jersey3DThumbnail model={model} isSelected={isSelected} />

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Model Info - Name */}
              <div className="w-full text-center">
                <h3
                  className={`text-xs font-semibold truncate transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-[#D4D4D4] group-hover:text-white'
                  }`}
                >
                  {model.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Status notification if switching GLB */}
      {isLoadingModel && (
        <div className="p-3 bg-[#1A1A1A] border-t border-[#262626] flex items-center gap-2 text-xs text-[#A3A3A3] animate-in fade-in duration-150">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          <span>Memuat geometri model 3D...</span>
        </div>
      )}
    </aside>
  );
};

