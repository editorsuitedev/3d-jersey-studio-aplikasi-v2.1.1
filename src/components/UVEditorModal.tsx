import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Check,
  Eye,
  EyeOff,
  Layers,
  Palette,
  Type,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { JerseyModel, MockupSettings } from '../types';
import { COLOR_SWATCHES } from '../data/models';

interface UVEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: JerseyModel;
  mockup: MockupSettings;
  onChangeMockup: (updates: Partial<MockupSettings>) => void;
  onDownloadUV: () => void;
  onUploadCustomTexture: (file: File) => void;
  onUploadLogo: (file: File) => void;
}

export const UVEditorModal: React.FC<UVEditorModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  mockup,
  onChangeMockup,
  onDownloadUV,
  onUploadCustomTexture,
  onUploadLogo,
}) => {
  const [showWireframe, setShowWireframe] = useState(true);
  const [activeTab, setActiveTab] = useState<'colors' | 'graphics' | 'text' | 'upload'>('colors');

  if (!isOpen) return null;

  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCustomTexture(e.target.files[0]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadLogo(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[88vh] bg-[#141414] border border-[#2E2E2E] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#262626] px-5 flex items-center justify-between bg-[#0D0D0D]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#222222] border border-[#3E3E3E] flex items-center justify-center text-white">
              <Layers className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                2D UV Texture Studio — {currentModel.name}
              </h2>
              <p className="text-[11px] text-[#737373]">
                Design texture map aligned with 3D model coordinates (1095×1095)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWireframe(!showWireframe)}
              className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                showWireframe
                  ? 'bg-[#222222] text-white border-[#555555]'
                  : 'bg-[#181818] text-[#737373] border-[#2E2E2E]'
              }`}
            >
              {showWireframe ? <Eye className="w-3.5 h-3.5 text-[#22C55E]" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>UV Guides</span>
            </button>

            <button
              onClick={onDownloadUV}
              className="px-3 py-1.5 rounded bg-[#1F1F1F] border border-[#3E3E3E] hover:bg-[#282828] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
              title="Download official SVG UV Template"
            >
              <Download className="w-3.5 h-3.5 text-[#A3A3A3]" />
              <span>Download SVG Wireframe</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all ml-2"
            >
              Done & Sync
            </button>
          </div>
        </div>

        {/* Modal Body: Left Tools & Right Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbox */}
          <div className="w-80 bg-[#121212] border-r border-[#262626] flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4 text-xs">
            {/* Nav Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-[#1A1A1A] p-1 rounded-lg border border-[#2A2A2A]">
              {[
                { id: 'colors', label: 'Color', icon: Palette },
                { id: 'graphics', label: 'Patterns', icon: Layers },
                { id: 'text', label: 'Names', icon: Type },
                { id: 'upload', label: 'Upload', icon: Upload },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-1.5 rounded flex flex-col items-center gap-1 transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#2A2A2A] text-white shadow-sm'
                        : 'text-[#737373] hover:text-[#ECECEC]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB: COLORS */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                {/* Base Body Color */}
                <div>
                  <span className="text-[#A3A3A3] block mb-1.5 font-medium">Main Jersey Color</span>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={mockup.baseColor}
                      onChange={(e) => onChangeMockup({ baseColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={mockup.baseColor}
                      onChange={(e) => onChangeMockup({ baseColor: e.target.value })}
                      className="flex-1 bg-[#1A1A1A] border border-[#333333] px-2 py-1 rounded text-white font-mono uppercase"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        onClick={() => onChangeMockup({ baseColor: c })}
                        className={`w-6 h-6 rounded-full border ${
                          mockup.baseColor.toLowerCase() === c.toLowerCase()
                            ? 'border-white scale-110'
                            : 'border-black/50'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Collar Accent Color */}
                <div className="pt-2 border-t border-[#262626]">
                  <span className="text-[#A3A3A3] block mb-1.5 font-medium">Collar / Rib Trim</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={mockup.collarColor}
                      onChange={(e) => onChangeMockup({ collarColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={mockup.collarColor}
                      onChange={(e) => onChangeMockup({ collarColor: e.target.value })}
                      className="flex-1 bg-[#1A1A1A] border border-[#333333] px-2 py-1 rounded text-white font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Sleeves Accent Color */}
                <div className="pt-2 border-t border-[#262626]">
                  <span className="text-[#A3A3A3] block mb-1.5 font-medium">Sleeve Cuffs Trim</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={mockup.sleeveColor}
                      onChange={(e) => onChangeMockup({ sleeveColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={mockup.sleeveColor}
                      onChange={(e) => onChangeMockup({ sleeveColor: e.target.value })}
                      className="flex-1 bg-[#1A1A1A] border border-[#333333] px-2 py-1 rounded text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PATTERNS */}
            {activeTab === 'graphics' && (
              <div className="space-y-3">
                <span className="text-[#A3A3A3] block font-medium">Sublimation Pattern</span>
                {[
                  { id: 'solid', name: 'Solid Uniform', desc: 'Clean monochrome appearance' },
                  { id: 'stripes', name: 'Athletic Stripes', desc: 'Classic vertical club stripes' },
                  { id: 'retro_slash', name: 'Diagonal Sash', desc: 'Iconic national team sash' },
                  { id: 'cyber_hex', name: 'Cyber Hex Mesh', desc: 'Modern high-tech honeycomb' },
                  { id: 'camo', name: 'Sport Camo', desc: 'Subtle tone-on-tone camouflage' },
                  { id: 'carbon', name: 'Carbon Weave', desc: 'Aerodynamic carbon fiber' },
                  { id: 'gradient', name: 'Fade Gradient', desc: 'Smooth top-to-bottom transition' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onChangeMockup({ pattern: p.id as any })}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                      mockup.pattern === p.id
                        ? 'bg-[#222222] border-white shadow-sm'
                        : 'bg-[#161616] border-[#2A2A2A] hover:bg-[#1C1C1C]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{p.name}</span>
                      {mockup.pattern === p.id && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                    </div>
                    <p className="text-[10px] text-[#737373] mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* TAB: TEXT / NUMBERS */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[#A3A3A3] block mb-1 font-medium">Squad Number</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="10"
                    value={mockup.playerNumber}
                    onChange={(e) => onChangeMockup({ playerNumber: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded px-3 py-1.5 text-white font-mono font-bold text-base"
                  />
                  <span className="text-[10px] text-[#666666] mt-1 block">
                    Automatically mapped to chest & back
                  </span>
                </div>

                <div>
                  <label className="text-[#A3A3A3] block mb-1 font-medium">Player Name</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="RONALDO"
                    value={mockup.playerName}
                    onChange={(e) => onChangeMockup({ playerName: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded px-3 py-1.5 text-white uppercase tracking-wider"
                  />
                  <span className="text-[10px] text-[#666666] mt-1 block">
                    Mapped onto back jersey arch
                  </span>
                </div>

                <div>
                  <label className="text-[#A3A3A3] block mb-1 font-medium">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={mockup.textColor}
                      onChange={(e) => onChangeMockup({ textColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={mockup.textColor}
                      onChange={(e) => onChangeMockup({ textColor: e.target.value })}
                      className="flex-1 bg-[#1A1A1A] border border-[#333333] px-2 py-1 rounded text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: UPLOAD FULL ARTWORK */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[#A3A3A3] block font-medium mb-1.5">
                    Full Custom UV Texture
                  </span>
                  <p className="text-[11px] text-[#737373] mb-3">
                    Upload your finished jersey artwork created in Photoshop or Illustrator. It will
                    wrap seamlessly around the 3D model.
                  </p>
                  <label className="w-full p-4 rounded-lg bg-[#181818] border-2 border-dashed border-[#3A3A3A] hover:border-white transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                    <Upload className="w-6 h-6 text-[#A3A3A3]" />
                    <span className="text-white font-medium">Choose Graphic File</span>
                    <span className="text-[10px] text-[#737373]">PNG, JPG, or SVG (1095×1095 recommended)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTextureUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {mockup.customTextureUrl && (
                  <div className="p-3 bg-[#1A1A1A] rounded border border-[#2E2E2E] flex items-center justify-between">
                    <span className="text-[#22C55E] font-medium">Custom Art Applied</span>
                    <button
                      onClick={() => onChangeMockup({ customTextureUrl: null })}
                      className="text-[#EF4444] hover:underline"
                    >
                      Clear Art
                    </button>
                  </div>
                )}

                {/* Team Crest Upload */}
                <div className="pt-3 border-t border-[#262626]">
                  <span className="text-[#A3A3A3] block font-medium mb-1.5">Team Crest / Badge</span>
                  <label className="w-full py-2 px-3 rounded bg-[#1C1C1C] border border-[#333333] hover:border-[#666666] flex items-center justify-center gap-2 cursor-pointer text-white">
                    <FileImage className="w-4 h-4 text-[#737373]" />
                    <span>{mockup.logoUrl ? 'Replace Crest Logo' : 'Upload Crest Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Interactive UV 2D Canvas Display */}
          <div className="flex-1 bg-[#0A0A0A] p-6 flex items-center justify-center relative overflow-hidden">
            {/* Square UV Preview Frame */}
            <div className="relative w-[500px] h-[500px] max-w-full max-h-full aspect-square rounded-xl shadow-2xl border border-[#333333] overflow-hidden flex items-center justify-center"
                 style={{ backgroundColor: mockup.baseColor }}>
              {/* Pattern representation preview */}
              {mockup.pattern === 'stripes' && (
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, ${mockup.accentColor}, ${mockup.accentColor} 30px, transparent 30px, transparent 60px)`,
                  }}
                />
              )}
              {mockup.pattern === 'retro_slash' && (
                <div
                  className="absolute inset-0 opacity-75"
                  style={{
                    background: `linear-gradient(135deg, transparent 40%, ${mockup.accentColor} 40%, ${mockup.accentColor} 58%, transparent 58%)`,
                  }}
                />
              )}
              {mockup.pattern === 'gradient' && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${mockup.baseColor} 0%, ${mockup.accentColor} 50%, ${mockup.baseColor} 100%)`,
                  }}
                />
              )}

              {/* Custom full texture if uploaded */}
              {mockup.customTextureUrl && (
                <img
                  src={mockup.customTextureUrl}
                  alt="Custom Texture"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Team Crest placement preview */}
              {mockup.logoUrl && (
                <div
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${mockup.logoX * 100}%`,
                    top: `${mockup.logoY * 100}%`,
                    width: `${22 * mockup.logoScale}%`,
                  }}
                >
                  <img src={mockup.logoUrl} alt="Logo" className="w-full h-auto object-contain drop-shadow" />
                </div>
              )}

              {/* Player Number & Name visual indicator */}
              {mockup.playerNumber && (
                <>
                  {/* Front small number */}
                  <div
                    className="absolute text-center font-bold font-mono pointer-events-none"
                    style={{
                      left: '38.5%',
                      top: '52%',
                      transform: 'translate(-50%, -50%)',
                      color: mockup.textColor,
                      fontSize: '32px',
                    }}
                  >
                    {mockup.playerNumber}
                  </div>
                  {/* Back large number */}
                  <div
                    className="absolute text-center font-bold font-mono pointer-events-none"
                    style={{
                      left: '72.5%',
                      top: '43%',
                      transform: 'translate(-50%, -50%)',
                      color: mockup.textColor,
                      fontSize: '64px',
                    }}
                  >
                    {mockup.playerNumber}
                  </div>
                </>
              )}

              {mockup.playerName && (
                <div
                  className="absolute text-center font-bold uppercase tracking-widest pointer-events-none text-xs"
                  style={{
                    left: '72.5%',
                    top: '30%',
                    transform: 'translate(-50%, -50%)',
                    color: mockup.textColor,
                  }}
                >
                  {mockup.playerName}
                </div>
              )}

              {/* Wireframe Overlay: Actual SVG from GitHub Raw */}
              {showWireframe && (
                <img
                  src={currentModel.uvMapUrl}
                  alt="UV Wireframe Overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90 filter invert-[0.9] contrast-150"
                />
              )}

              {/* UV Zone labels on top */}
              {showWireframe && (
                <>
                  <span className="absolute top-8 left-[38%] -translate-x-1/2 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white pointer-events-none">
                    FRONT
                  </span>
                  <span className="absolute top-8 left-[72%] -translate-x-1/2 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white pointer-events-none">
                    BACK
                  </span>
                  <span className="absolute bottom-6 left-[38%] -translate-x-1/2 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white pointer-events-none">
                    LEFT SLEEVE
                  </span>
                  <span className="absolute bottom-6 left-[72%] -translate-x-1/2 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white pointer-events-none">
                    RIGHT SLEEVE
                  </span>
                </>
              )}
            </div>

            {/* Info badge */}
            <div className="absolute bottom-4 left-6 bg-[#161616]/90 border border-[#2E2E2E] px-3 py-1 rounded-md text-[11px] text-[#A3A3A3]">
              Canvas scale 1:1 mapped to <span className="text-white font-medium">{currentModel.name}</span> GLB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
