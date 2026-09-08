import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sun,
  Camera,
  Layers,
  Sparkles,
  Sliders,
  Maximize2,
  FileImage,
  X,
} from 'lucide-react';
import {
  MockupSettings,
  BackgroundSettings,
  LightingSettings,
  CameraSettings,
  SceneSettings,
  TransformSettings,
  JerseyModel,
  MaterialPreset,
} from '../types';
import { ENVIRONMENT_PRESETS } from '../data/models';
import { InteractiveUVCanvas } from './InteractiveUVCanvas';
import { HexColorInput } from './HexColorInput';

interface InspectorPanelProps {
  currentModel: JerseyModel;
  mockup: MockupSettings;
  background: BackgroundSettings;
  lighting: LightingSettings;
  camera: CameraSettings;
  scene: SceneSettings;
  transform: TransformSettings;
  onChangeMockup: (updates: Partial<MockupSettings>) => void;
  onChangeBackground: (updates: Partial<BackgroundSettings>) => void;
  onChangeLighting: (updates: Partial<LightingSettings>) => void;
  onChangeCamera: (updates: Partial<CameraSettings>) => void;
  onChangeScene: (updates: Partial<SceneSettings>) => void;
  onChangeTransform: (updates: Partial<TransformSettings>) => void;
  onUploadDesign: (file: File) => void;
  onSnapCamera: (preset: 'front' | 'back' | 'left' | 'right' | 'top') => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  activeTab?: 'DESIGN' | 'EFFECTS';
  onChangeTab?: (tab: 'DESIGN' | 'EFFECTS') => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  currentModel,
  mockup,
  background,
  lighting,
  camera,
  scene,
  transform,
  onChangeMockup,
  onChangeBackground,
  onChangeLighting,
  onChangeCamera,
  onChangeScene,
  onChangeTransform,
  onUploadDesign,
  onSnapCamera,
  isOpenMobile = false,
  onCloseMobile,
  activeTab: controlledTab,
  onChangeTab,
}) => {
  const [internalTab, setInternalTab] = useState<'DESIGN' | 'EFFECTS'>('DESIGN');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: 'DESIGN' | 'EFFECTS') => {
    setInternalTab(tab);
    onChangeTab?.(tab);
  };
  const bgImageInputRef = React.useRef<HTMLInputElement>(null);

  // Exclusive accordion state: starts completely closed ("accordinnya tertutup dulu")
  // and opening one section closes the others ("saat user buka fitur background, yang lain tertutup dan seterusnya")
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveAccordion((prev) => (prev === section ? null : section));
  };

  const handleUploadBgImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChangeBackground({
          type: 'image',
          imageUrl: e.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside
      className={`bg-[#121212] border-l border-[#262626] flex flex-col select-none h-full overflow-hidden text-[#ECECEC] transition-transform duration-300 ease-in-out
        fixed inset-y-0 right-0 z-50 w-full max-w-[340px] shadow-2xl
        md:relative md:inset-auto md:w-84 md:shadow-none md:translate-x-0 md:z-30
        ${isOpenMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}
    >
      {/* Top Tabs: DESIGN | EFFECTS + Mobile Close button */}
      <div className="h-11 border-b border-[#262626] flex items-center justify-between px-4 bg-[#0D0D0D]">
        <div className="flex items-center gap-6 h-full">
          <button
            onClick={() => setActiveTab('DESIGN')}
            className={`h-full text-xs font-semibold tracking-tight transition-colors relative flex items-center ${
              activeTab === 'DESIGN' ? 'text-white' : 'text-[#737373] hover:text-[#ECECEC]'
            }`}
          >
            <span>DESIGN</span>
            {activeTab === 'DESIGN' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('EFFECTS')}
            className={`h-full text-xs font-semibold tracking-tight transition-colors relative flex items-center ${
              activeTab === 'EFFECTS' ? 'text-white' : 'text-[#737373] hover:text-[#ECECEC]'
            }`}
          >
            <span>SET UP</span>
            {activeTab === 'EFFECTS' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        </div>

        {/* Close Button on Mobile */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* ==================== TAB 1: DESIGN ==================== */}
        {activeTab === 'DESIGN' && (
          <InteractiveUVCanvas
            currentModel={currentModel}
            mockup={mockup}
            onChangeMockup={onChangeMockup}
            onUploadDesign={onUploadDesign}
          />
        )}

        {/* ==================== TAB 2: EFFECTS ==================== */}
        {activeTab === 'EFFECTS' && (
          <div className="space-y-1.5 -mx-3 -mt-3 pb-4">
            {/* Material Sliders */}
            <div className="bg-[#121212] border-0 border-b border-[#262626] rounded-none overflow-hidden">
              <button
                onClick={() => toggleSection('material')}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="text-[#ECECEC]">Material</span>
                </div>
                {activeAccordion === 'material' ? (
                  <ChevronUp className="w-4 h-4 text-[#737373]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373]" />
                )}
              </button>

              {activeAccordion === 'material' && (
                <div className="p-4 border-t border-[#262626] space-y-4 text-xs">
                  {/* Roughness Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1.5">
                      <span>Roughness</span>
                      <span className="font-mono text-white">
                        {Math.round(mockup.roughness * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1.0}
                      step={0.01}
                      value={mockup.roughness}
                      onChange={(e) =>
                        onChangeMockup({ roughness: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Metalness / Sheen Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1.5">
                      <span>Sheen</span>
                      <span className="font-mono text-white">
                        {Math.round(mockup.metalness * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      value={mockup.metalness}
                      onChange={(e) =>
                        onChangeMockup({ metalness: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Background Accordion: 3 modes (solid, gradient, image) */}
            <div className="bg-[#121212] border-0 border-b border-[#262626] rounded-none overflow-hidden">
              <button
                onClick={() => toggleSection('background')}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileImage className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="text-[#ECECEC]">Background</span>
                </div>
                {activeAccordion === 'background' ? (
                  <ChevronUp className="w-4 h-4 text-[#737373]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373]" />
                )}
              </button>

              {activeAccordion === 'background' && (
                <div className="p-4 border-t border-[#262626] space-y-4 text-xs">
                  {/* Background Type: Solid, Gradient, Image */}
                  <div className="grid grid-cols-3 gap-1">
                    {(['solid', 'gradient', 'image'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => onChangeBackground({ type })}
                        className={`py-1.5 rounded text-[11px] border capitalize transition-all ${
                          background.type === type
                            ? 'bg-[#262626] text-white border-white font-medium'
                            : 'bg-[#141414] text-[#737373] border-[#2A2A2A] hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Mode 1: Solid Color with Hex Input */}
                  {background.type === 'solid' && (
                    <div className="flex items-center justify-between p-2 rounded bg-[#121212] border border-[#262626]">
                      <span className="text-[#A3A3A3] text-[11px]">Solid Color</span>
                      <HexColorInput
                        value={background.color}
                        onChange={(color) => onChangeBackground({ color })}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Mode 2: Custom Gradient (Color 1 & Color 2 & Angle) with Hex Input */}
                  {background.type === 'gradient' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-[#121212] border border-[#262626]">
                        <span className="text-[#A3A3A3] text-[11px]">Color 1 (Start)</span>
                        <HexColorInput
                          value={background.color}
                          onChange={(color) => onChangeBackground({ color })}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded bg-[#121212] border border-[#262626]">
                        <span className="text-[#A3A3A3] text-[11px]">Color 2 (End)</span>
                        <HexColorInput
                          value={background.color2 || '#181818'}
                          onChange={(color) => onChangeBackground({ color2: color })}
                          size="sm"
                        />
                      </div>

                      {/* Gradient Angle Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1">
                          <span>Gradient Angle</span>
                          <span className="font-mono text-white">
                            {background.gradientAngle ?? 135}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          step={5}
                          value={background.gradientAngle ?? 135}
                          onChange={(e) =>
                            onChangeBackground({ gradientAngle: parseInt(e.target.value) })
                          }
                          className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Custom Uploaded Image */}
                  {background.type === 'image' && (
                    <div className="space-y-2">
                      {background.imageUrl ? (
                        <div className="space-y-2">
                          <div className="w-full h-24 rounded-lg border border-[#333333] overflow-hidden relative bg-[#0D0D0D]">
                            <img
                              src={background.imageUrl}
                              alt="Custom Background"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => bgImageInputRef.current?.click()}
                              className="flex-1 py-1.5 rounded bg-[#1C1C1C] border border-[#333333] hover:border-white text-white text-[11px] font-medium transition-all"
                            >
                              Change Image
                            </button>
                            <button
                              onClick={() => onChangeBackground({ imageUrl: null, type: 'solid' })}
                              className="px-3 py-1.5 rounded bg-[#2D1515] border border-[#7F1D1D] text-[#FCA5A5] text-[11px] font-medium hover:bg-[#3E1A1A] transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => bgImageInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-[#333333] hover:border-[#666666] rounded-lg text-center transition-all bg-[#141414] hover:bg-[#1A1A1A]"
                        >
                          <FileImage className="w-5 h-5 text-[#888888] mx-auto mb-1.5" />
                          <span className="text-xs text-white font-medium block">
                            Upload Background Image
                          </span>
                          <span className="text-[10px] text-[#666666] block mt-0.5">
                            PNG, JPG, or WEBP
                          </span>
                        </button>
                      )}
                      <input
                        ref={bgImageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadBgImage(file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lighting Accordion */}
            <div className="bg-[#121212] border-0 border-b border-[#262626] rounded-none overflow-hidden">
              <button
                onClick={() => toggleSection('lighting')}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="text-[#ECECEC]">Lighting</span>
                </div>
                {activeAccordion === 'lighting' ? (
                  <ChevronUp className="w-4 h-4 text-[#737373]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373]" />
                )}
              </button>

              {activeAccordion === 'lighting' && (
                <div className="p-4 border-t border-[#262626] space-y-4 text-xs">
                  {/* Presets Grid */}
                  <div>
                    <label className="text-[#A3A3A3] block mb-1.5 font-medium text-[11px]">
                      Preset
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ENVIRONMENT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() =>
                            onChangeLighting({
                              environmentPreset: preset.id,
                            })
                          }
                          className={`py-1.5 px-2 rounded text-[11px] border font-medium truncate text-left transition-all ${
                            lighting.environmentPreset === preset.id
                              ? 'bg-[#262626] text-white border-white'
                              : 'bg-[#141414] text-[#737373] border-[#2A2A2A] hover:text-white'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1">
                      <span>Intensity</span>
                      <span className="font-mono text-white">
                        {lighting.environmentIntensity.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.05}
                      value={lighting.environmentIntensity}
                      onChange={(e) =>
                        onChangeLighting({ environmentIntensity: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Light Rotation */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1">
                      <span>Light Angle</span>
                      <span className="font-mono text-white">{lighting.environmentRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={5}
                      value={lighting.environmentRotation}
                      onChange={(e) =>
                        onChangeLighting({ environmentRotation: parseInt(e.target.value) })
                      }
                      className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scene Shadow Accordion */}
            <div className="bg-[#121212] border-0 border-b border-[#262626] rounded-none overflow-hidden">
              <button
                onClick={() => toggleSection('scene')}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="text-[#ECECEC]">Shadow</span>
                </div>
                {activeAccordion === 'scene' ? (
                  <ChevronUp className="w-4 h-4 text-[#737373]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373]" />
                )}
              </button>

              {activeAccordion === 'scene' && (
                <div className="p-4 border-t border-[#262626] space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'soft', 'contact'] as const).map((sh) => (
                      <button
                        key={sh}
                        onClick={() => onChangeScene({ floorShadow: sh })}
                        className={`py-1.5 rounded text-[11px] border capitalize transition-all ${
                          scene.floorShadow === sh
                            ? 'bg-[#262626] text-white border-white font-medium'
                            : 'bg-[#141414] text-[#737373] border-[#2A2A2A] hover:text-white'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>

                  {scene.floorShadow !== 'none' && (
                    <div>
                      <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1">
                        <span>Shadow Opacity</span>
                        <span className="font-mono text-white">
                          {Math.round(scene.shadowIntensity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        value={scene.shadowIntensity}
                        onChange={(e) =>
                          onChangeScene({ shadowIntensity: parseFloat(e.target.value) })
                        }
                        className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transform Controls Accordion */}
            <div className="bg-[#121212] border-0 border-b border-[#262626] rounded-none overflow-hidden">
              <button
                onClick={() => toggleSection('rotation')}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="text-[#ECECEC]">Position</span>
                </div>
                {activeAccordion === 'rotation' ? (
                  <ChevronUp className="w-4 h-4 text-[#737373]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373]" />
                )}
              </button>

              {activeAccordion === 'rotation' && (
                <div className="p-4 border-t border-[#262626] space-y-4 text-xs">
                  {/* Rotation Y */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#A3A3A3] mb-1">
                      <span>Rotation Y (Yaw)</span>
                      <span className="font-mono text-white">{Math.round(transform.rotationY)}°</span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={transform.rotationY}
                      onChange={(e) =>
                        onChangeTransform({ rotationY: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() =>
                      onChangeTransform({
                        rotationX: 0,
                        rotationY: 0,
                        rotationZ: 0,
                        positionX: 0,
                        positionY: 0,
                        positionZ: 0,
                      })
                    }
                    className="w-full py-1.5 rounded bg-[#161616] border border-[#2E2E2E] hover:border-white text-[11px] text-[#A3A3A3] hover:text-white transition-colors"
                  >
                    Reset Transforms
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
