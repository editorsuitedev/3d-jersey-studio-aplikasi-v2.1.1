import React from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { JERSEY_MODELS } from '../data/models';
import { JerseyModel } from '../types';
import { Jersey3DThumbnail } from './Jersey3DThumbnail';

interface ModelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (model: JerseyModel) => void;
  isLoadingModel: boolean;
  category?: 'jersey' | 'hanger' | 'mannequin';
}

export const ModelsDrawer: React.FC<ModelsDrawerProps> = ({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  isLoadingModel,
  category = 'jersey',
}) => {
  if (!isOpen) return null;

  const catalogTitle =
    category === 'hanger' ? '3D HANGER' : category === 'mannequin' ? '3D MANNEQUIN' : '3D JERSEY';

  return (
    <div className="fixed inset-y-0 left-0 w-[calc(100vw-3rem)] max-w-xs md:relative md:inset-auto md:w-80 bg-[#121212] border-r border-[#262626] flex flex-col z-35 select-none shadow-2xl h-full animate-in slide-in-from-left duration-200">
      {/* Header with Title & Close button */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#ECECEC] tracking-tight">{catalogTitle}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Direct 3D Models Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 custom-scrollbar">
        {JERSEY_MODELS.map((model) => {
          const isSelected = model.id === selectedModelId;
          return (
            <div
              key={model.id}
              onClick={() => onSelectModel(model)}
              className="group relative p-1 flex flex-col items-center cursor-pointer transition-colors bg-transparent border-none"
            >
              {/* Card 3D visual preview thumbnail */}
              <div
                className={`w-full aspect-[4/5] rounded bg-[#0D0D0D] border relative flex items-center justify-center overflow-hidden mb-2 transition-colors ${
                  isSelected ? 'border-white' : 'border-[#222222] group-hover:border-[#444444]'
                }`}
              >
                <Jersey3DThumbnail model={model} isSelected={isSelected} />

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Model Info - Just the name */}
              <div className="w-full text-center">
                <h3
                  className={`text-xs font-semibold truncate transition-colors ${
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
        <div className="p-3 bg-[#1A1A1A] border-t border-[#262626] flex items-center gap-2 text-xs text-[#A3A3A3]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          <span>Loading 3D model geometry...</span>
        </div>
      )}
    </div>
  );
};
