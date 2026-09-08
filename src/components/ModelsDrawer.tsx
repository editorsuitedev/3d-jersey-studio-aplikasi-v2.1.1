import React from 'react';
import { X, Check, Loader2, Lock, Crown, Sparkles } from 'lucide-react';
import { JERSEY_MODELS, FREE_MODEL_ID } from '../data/models';
import { JerseyModel } from '../types';
import { Jersey3DThumbnail } from './Jersey3DThumbnail';

interface ModelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (model: JerseyModel) => void;
  isLoadingModel: boolean;
  category?: 'jersey' | 'hanger' | 'mannequin';
  userPlan?: string | null;
  onUpgradePro?: (modelName?: string) => void;
}

export const ModelsDrawer: React.FC<ModelsDrawerProps> = ({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  isLoadingModel,
  category = 'jersey',
  userPlan = 'free',
  onUpgradePro,
}) => {
  if (!isOpen) return null;

  const isPro = userPlan === 'pro';
  const catalogTitle =
    category === 'hanger' ? '3D HANGER' : category === 'mannequin' ? '3D MANNEQUIN' : '3D JERSEY';

  const handleCardClick = (model: JerseyModel) => {
    const isFreeModel = model.id === FREE_MODEL_ID;
    if (!isPro && !isFreeModel) {
      if (onUpgradePro) {
        onUpgradePro(model.name);
      }
      return;
    }
    onSelectModel(model);
  };

  return (
    <div className="fixed inset-y-0 left-0 w-[calc(100vw-3rem)] max-w-xs md:relative md:inset-auto md:w-80 bg-[#121212] border-r border-[#262626] flex flex-col z-35 select-none shadow-2xl h-full animate-in slide-in-from-left duration-200">
      {/* Header with Title & Close button */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-[#ECECEC] tracking-tight">{catalogTitle}</h2>
          {!isPro ? (
            <span className="px-1.5 py-0.5 rounded bg-[#262626] border border-[#3A3A3A] text-[10px] font-semibold text-[#A3A3A3]">
              Free: POLO V2
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-[#da0a2c]/20 border border-[#da0a2c]/40 text-[10px] font-bold text-[#FF6B81] flex items-center gap-1">
              <Crown className="w-2.5 h-2.5" /> All Unlocked
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Free Plan Notice Banner */}
      {!isPro && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-gradient-to-r from-[#da0a2c]/15 to-transparent border border-[#da0a2c]/30 flex items-start gap-2.5">
          <div className="p-1 rounded bg-[#da0a2c]/20 text-[#FF6B81] shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-white">Paket Free: 1 Model Aktif</div>
            <p className="text-[10px] text-[#A3A3A3] leading-tight mt-0.5">
              Hanya model <span className="text-emerald-400 font-bold">POLO V2</span> yang terbuka. Upgrade ke PRO untuk membuka 10 model 3D lengkap.
            </p>
            <button
              type="button"
              onClick={() => onUpgradePro && onUpgradePro()}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#FF6B81] hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Buka Semua Model via Xendit &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Direct 3D Models Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 custom-scrollbar">
        {JERSEY_MODELS.map((model) => {
          const isSelected = model.id === selectedModelId;
          const isFreeModel = model.id === FREE_MODEL_ID;
          const isLocked = !isPro && !isFreeModel;

          return (
            <div
              key={model.id}
              onClick={() => handleCardClick(model)}
              className="group relative p-1 flex flex-col items-center cursor-pointer transition-colors bg-transparent border-none"
            >
              {/* Card 3D visual preview thumbnail */}
              <div
                className={`w-full aspect-[4/5] rounded bg-[#0D0D0D] border relative flex items-center justify-center overflow-hidden mb-2 transition-all ${
                  isSelected
                    ? 'border-white'
                    : isLocked
                    ? 'border-[#222222] group-hover:border-[#da0a2c]/70'
                    : 'border-[#222222] group-hover:border-[#444444]'
                }`}
              >
                <Jersey3DThumbnail model={model} isSelected={isSelected} />

                {/* Free Badge for POLO V2 on Free Plan */}
                {!isPro && isFreeModel && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-extrabold tracking-wider shadow">
                    FREE
                  </div>
                )}

                {/* Locked Badge for Non-Free Models on Free Plan */}
                {isLocked && (
                  <>
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#da0a2c] text-white text-[9px] font-extrabold flex items-center gap-1 shadow-md">
                      <Lock className="w-2.5 h-2.5" />
                      <span>PRO</span>
                    </div>
                    {/* Hover Lock Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                      <div className="px-2 py-1 rounded bg-[#da0a2c] text-white text-[10px] font-bold flex items-center gap-1 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        <Crown className="w-3 h-3" />
                        <span>Buka PRO</span>
                      </div>
                    </div>
                  </>
                )}

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Model Info */}
              <div className="w-full text-center flex items-center justify-center gap-1">
                {isLocked && <Lock className="w-3 h-3 text-[#da0a2c] shrink-0" />}
                <h3
                  className={`text-xs font-semibold truncate transition-colors ${
                    isSelected
                      ? 'text-white'
                      : isLocked
                      ? 'text-[#8E8E8E] group-hover:text-white'
                      : 'text-[#D4D4D4] group-hover:text-white'
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
