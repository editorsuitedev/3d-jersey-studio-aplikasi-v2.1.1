import React from 'react';
import { X, Crown, Check, Sparkles, Zap, Shield, Image, Film } from 'lucide-react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onOpenLogin }) => {
  if (!isOpen) return null;

  const proFeatures = [
    {
      icon: Crown,
      title: 'All 10 3D Sport Jersey Models',
      desc: 'Full access to O-Neck, V-Neck, Raglan, Polo, Long Sleeve, Cycling & Basketball kits',
    },
    {
      icon: Image,
      title: 'Full 4096px × 4096px UV Textures',
      desc: 'Export and preview ultra-crisp vector-grade jersey artwork at maximum 4K fidelity',
    },
    {
      icon: Film,
      title: 'Cinematic 4K & 60 FPS Turntables',
      desc: 'Seamless 360° video encoding in both MP4 and transparent WebM formats',
    },
    {
      icon: Sparkles,
      title: 'Advanced Lighting & Floor Reflections',
      desc: 'Studio, outdoor stadium, rim lighting presets and ray-quality contact shadows',
    },
    {
      icon: Zap,
      title: 'Unlimited Custom Backgrounds',
      desc: 'Upload high-res stadium imagery, custom linear gradients, and clean studio backdrops',
    },
    {
      icon: Shield,
      title: 'Commercial License & Cloud Storage',
      desc: 'Use all rendered mockups for client deliverables and commercial sportswear production',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#121212] border border-[#2E2E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Crown / King theme */}
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
            className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature List */}
        <div className="p-5 space-y-4 text-xs">
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

          {/* CTA */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full py-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-[0.99] cursor-pointer"
            >
              <Crown className="w-4 h-4 text-white" />
              <span>Sign In / Activate Pro Access</span>
            </button>
            <p className="text-[10px] text-[#555555] text-center">
              Instant access • No subscriptions • Lifetime license
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
