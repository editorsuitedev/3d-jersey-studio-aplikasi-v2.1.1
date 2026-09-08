import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Maximize2,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Layers as LayersIcon,
  Check,
} from 'lucide-react';
import { JerseyModel, MockupSettings, DesignLayer } from '../types';
import { HexColorInput } from './HexColorInput';

interface InteractiveUVCanvasProps {
  currentModel: JerseyModel;
  mockup: MockupSettings;
  onChangeMockup: (updates: Partial<MockupSettings>) => void;
  onUploadDesign: (file: File) => void;
}

export const InteractiveUVCanvas: React.FC<InteractiveUVCanvasProps> = ({
  currentModel,
  mockup,
  onChangeMockup,
  onUploadDesign,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [showGuide, setShowGuide] = useState(true);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    startX: number;
    startY: number;
    layerX: number;
    layerY: number;
    layerW: number;
    layerH: number;
  } | null>(null);

  const activeLayer = mockup.layers.find((l) => l.id === mockup.activeLayerId) || mockup.layers[0] || null;

  // Handle Layer Drag / Resize
  const handlePointerDown = (e: React.PointerEvent, handleType: string, layerId: string) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    onChangeMockup({ activeLayerId: layerId });

    const targetLayer = mockup.layers.find((l) => l.id === layerId);
    if (!targetLayer) return;

    const rect = container.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / rect.width;
    const startY = (e.clientY - rect.top) / rect.height;

    setActiveHandle(handleType);
    setDragStart({
      startX,
      startY,
      layerX: targetLayer.x,
      layerY: targetLayer.y,
      layerW: targetLayer.width,
      layerH: targetLayer.height,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStart || !activeLayer || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const dx = currentX - dragStart.startX;
    const dy = currentY - dragStart.startY;

    if (activeHandle === 'move') {
      // Move entire layer
      const newX = Math.max(0, Math.min(1, dragStart.layerX + dx));
      const newY = Math.max(0, Math.min(1, dragStart.layerY + dy));

      updateLayer(activeLayer.id, { x: newX, y: newY });
    } else if (activeHandle === 'rotate') {
      // Drag rotation handle relative to layer center
      const rad = Math.atan2(currentY - activeLayer.y, currentX - activeLayer.x);
      let deg = Math.round((rad * 180) / Math.PI) + 90;
      if (deg < 0) deg += 360;
      updateLayer(activeLayer.id, { rotation: deg });
    } else if (activeHandle === 'se') {
      // Scale from bottom-right corner up to 1.0 (4096px)
      const newW = Math.max(0.05, Math.min(1.0, dragStart.layerW + dx * 2));
      const aspect = dragStart.layerW / dragStart.layerH;
      const newH = Math.min(1.0, newW / aspect);

      updateLayer(activeLayer.id, { width: newW, height: newH });
    } else if (activeHandle === 'sw') {
      // Scale from bottom-left corner up to 1.0 (4096px)
      const newW = Math.max(0.05, Math.min(1.0, dragStart.layerW - dx * 2));
      const aspect = dragStart.layerW / dragStart.layerH;
      const newH = Math.min(1.0, newW / aspect);

      updateLayer(activeLayer.id, { width: newW, height: newH });
    } else if (activeHandle === 'ne') {
      // Scale from top-right corner up to 1.0 (4096px)
      const newW = Math.max(0.05, Math.min(1.0, dragStart.layerW + dx * 2));
      const aspect = dragStart.layerW / dragStart.layerH;
      const newH = Math.min(1.0, newW / aspect);

      updateLayer(activeLayer.id, { width: newW, height: newH });
    } else if (activeHandle === 'nw') {
      // Scale from top-left corner up to 1.0 (4096px)
      const newW = Math.max(0.05, Math.min(1.0, dragStart.layerW - dx * 2));
      const aspect = dragStart.layerW / dragStart.layerH;
      const newH = Math.min(1.0, newW / aspect);

      updateLayer(activeLayer.id, { width: newW, height: newH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      setActiveHandle(null);
      setDragStart(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Helper to update a single layer
  const updateLayer = (layerId: string, updates: Partial<DesignLayer>) => {
    const nextLayers = mockup.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    onChangeMockup({ layers: nextLayers });
  };

  // Fit active design to 100% full 4096px x 4096px UV bounds
  const handleFitDesign = () => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, {
      x: 0.5,
      y: 0.5,
      width: 1.0,
      height: 1.0,
      rotation: 0,
    });
  };

  // Layer Reordering
  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mockup.layers.length) return;

    const nextLayers = [...mockup.layers];
    const [moved] = nextLayers.splice(index, 1);
    nextLayers.splice(targetIndex, 0, moved);

    onChangeMockup({ layers: nextLayers });
  };

  // Delete Layer
  const handleDeleteLayer = (layerId: string) => {
    const nextLayers = mockup.layers.filter((l) => l.id !== layerId);
    onChangeMockup({
      layers: nextLayers,
      activeLayerId: nextLayers.length > 0 ? nextLayers[0].id : null,
    });
  };

  // Toggle Visibility
  const toggleVisibility = (layerId: string) => {
    const target = mockup.layers.find((l) => l.id === layerId);
    if (target) {
      updateLayer(layerId, { visible: !target.visible });
    }
  };

  return (
    <div className="space-y-3 select-none">
      {/* 2D Interactive UV Canvas (Matching image.png: rounded-2xl bg-[#262626] with Guide pill) */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full aspect-square bg-[#262626] border border-[#333333] rounded-2xl relative overflow-hidden flex items-center justify-center touch-none shadow-inner"
      >
        {/* Floating Guide toggle in top-right corner of canvas */}
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#181818]/80 backdrop-blur-xs border border-[#3A3A3A] text-xs text-white hover:bg-[#222222] transition-colors shadow-sm cursor-pointer"
          title={showGuide ? 'Hide UV layout guide' : 'Show UV layout guide'}
        >
          {showGuide ? (
            <Eye className="w-3.5 h-3.5 text-[#CCCCCC]" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-[#888888]" />
          )}
          <span className="font-medium text-[11px]">Guide</span>
        </button>

        {/* UV Vector Pattern Wireframe Overlay */}
        {showGuide && (
          <img
            src={currentModel.uvMapUrl}
            alt="UV Map Wireframe"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-45 filter invert contrast-150 select-none"
          />
        )}

        {/* All Rendered Layers */}
        {mockup.layers.map((layer) => {
          if (!layer.visible) return null;
          const isActive = layer.id === (activeLayer?.id || '');

          return (
            <div
              key={layer.id}
              onPointerDown={(e) => handlePointerDown(e, 'move', layer.id)}
              style={{
                left: `${layer.x * 100}%`,
                top: `${layer.y * 100}%`,
                width: `${layer.width * 100}%`,
                height: `${layer.height * 100}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
              }}
              className={`absolute cursor-move touch-none flex items-center justify-center ${
                isActive ? 'z-20' : 'z-10'
              }`}
            >
              {/* Layer graphic */}
              <img
                src={layer.dataUrl}
                alt={layer.name}
                className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-md"
              />

              {/* Active Selection Bounding Box & Transform Handles matching image.png */}
              {isActive && (
                <div className="absolute inset-0 border-2 border-white pointer-events-none">
                  {/* Corner Resize Handles (Small calc(var(--spacing) * 1.5) size per user request) */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw', layer.id)}
                    style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                    className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nwse-resize shadow-xs hover:scale-125 transition-transform"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne', layer.id)}
                    style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                    className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nesw-resize shadow-xs hover:scale-125 transition-transform"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se', layer.id)}
                    style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                    className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nwse-resize shadow-xs hover:scale-125 transition-transform"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw', layer.id)}
                    style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                    className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nesw-resize shadow-xs hover:scale-125 transition-transform"
                  />

                  {/* Top rotation stem & handle matching image.png */}
                  <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white pointer-events-none" />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'rotate', layer.id)}
                    className="absolute -top-6.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-black/30 pointer-events-auto cursor-grab active:cursor-grabbing shadow-md hover:scale-125 transition-transform"
                    title="Drag to rotate design"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Row 1: Two buttons side by side matching image.png (Color button & Fit Design button) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Color Input with Swatch Picker & Direct Hex Typing */}
        <div className="flex items-center">
          <HexColorInput
            value={mockup.baseColor}
            onChange={(color) => onChangeMockup({ baseColor: color })}
            className="w-full h-full py-2 px-3 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#404040]"
          />
        </div>

        {/* Fit Design Button */}
        <button
          onClick={handleFitDesign}
          className="py-2.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#404040] text-[#ECECEC] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#A3A3A3]" />
          <span>Fit Design</span>
        </button>
      </div>

      {/* Row 2: Full width Upload Design button matching Fit Design styling */}
      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-4 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#404040] text-[#ECECEC] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#A3A3A3]" />
          <span>Upload Design</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUploadDesign(file);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Row 3: Section label matching tab style */}
      <div className="pt-2">
        <span className="text-xs font-semibold tracking-tight text-white">
          LAYERS ({mockup.layers.length})
        </span>
      </div>

      {/* Row 4: Layer list item matching image.png */}
      <div className="space-y-3">
        {mockup.layers.map((layer, index) => {
          const isActive = layer.id === (activeLayer?.id || '');
          return (
            <div key={layer.id} className="space-y-3">
              <div
                onClick={() => onChangeMockup({ activeLayerId: layer.id })}
                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#181818] border-[#383838]'
                    : 'bg-[#141414] border-[#262626] hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {/* Layer Thumbnail with transparent bg */}
                  <div className="w-7 h-7 rounded bg-transparent flex items-center justify-center overflow-hidden shrink-0 border border-[#333333]">
                    <img
                      src={layer.dataUrl}
                      alt={layer.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Layer Name */}
                  <span className="text-xs font-medium text-white truncate">
                    {layer.name}
                  </span>
                </div>

                {/* Actions: Move Up, Move Down, Delete matching image.png */}
                <div
                  className="flex items-center gap-2 text-[#737373]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={index === 0}
                    onClick={() => moveLayer(index, 'up')}
                    className="hover:text-white disabled:opacity-20 transition-colors p-0.5 cursor-pointer"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    disabled={index === mockup.layers.length - 1}
                    onClick={() => moveLayer(index, 'down')}
                    className="hover:text-white disabled:opacity-20 transition-colors p-0.5 cursor-pointer"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="hover:text-[#EF4444] transition-colors p-0.5 cursor-pointer"
                    title="Delete layer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 5: Two sleek horizontal sliders matching image.png */}
              {isActive && (
                <div className="space-y-3 px-0.5">
                  {/* Slider 1: Scale / Size */}
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.01}
                    value={layer.width}
                    onChange={(e) => {
                      const newW = parseFloat(e.target.value);
                      const aspect = layer.width / (layer.height || 1);
                      updateLayer(layer.id, { width: newW, height: newW / aspect });
                    }}
                    className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white block"
                    title="Scale"
                  />

                  {/* Slider 2: Opacity */}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={layer.opacity ?? 1}
                    onChange={(e) =>
                      updateLayer(layer.id, { opacity: parseFloat(e.target.value) })
                    }
                    className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white block"
                    title="Opacity"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
