import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Maximize2,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { JerseyModel, MockupSettings, DesignLayer } from '../types';
import { HexColorInput } from './HexColorInput';

interface CompactPillSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  isLocked?: boolean;
  onChange: (value: number) => void;
}

const CompactPillSlider: React.FC<CompactPillSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '%',
  isLocked = false,
  onChange,
}) => {
  const safeRange = max - min || 1;
  const clampedValue = Math.min(max, Math.max(min, value));
  const percent = ((clampedValue - min) / safeRange) * 100;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  // Keep thumb cleanly within rounded track corners (between 5% and 95%)
  const thumbPercent = Math.min(94, Math.max(6, clampedPercent));

  return (
    <div
      className={`relative h-8 rounded-lg border overflow-hidden flex items-center select-none shadow-xs transition-all duration-150 ${
        isLocked
          ? 'bg-[#121212] border-[#222222] opacity-50 cursor-not-allowed'
          : 'bg-[#141414] border-[#262626] hover:border-[#383838] group cursor-ew-resize'
      }`}
    >
      {/* Active Fill Track Bar (following Roughness slider UI) */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-[#262626] group-hover:bg-[#2C2C2C] pointer-events-none will-change-[width] transition-colors duration-150"
        style={{ width: `${clampedPercent}%` }}
      />

      {/* Label on the left */}
      <div className="relative z-10 pl-2.5 flex items-center gap-1 pointer-events-none truncate max-w-[55%]">
        <span className="text-[11px] font-normal text-[#9ca3af] group-hover:text-[#ECECEC] transition-colors duration-150 truncate">
          {label}
        </span>
        {isLocked && <Lock className="w-2.5 h-2.5 text-[#EAB308] shrink-0" />}
      </div>

      {/* Numeric Value on the right */}
      <span className="relative z-10 pr-2.5 ml-auto font-mono text-[10px] text-[#D4D4D4] group-hover:text-white transition-colors duration-150 pointer-events-none shrink-0">
        {Math.round(clampedValue * 100)}{unit}
      </span>

      {/* Vertical White Pill Thumb (following Roughness slider UI) */}
      {!isLocked && (
        <div
          className="absolute top-1.5 bottom-1.5 w-1.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.45)] group-hover:shadow-[0_0_10px_rgba(255,255,255,0.75)] group-hover:w-2 group-active:scale-95 pointer-events-none z-10 will-change-[left] transition-all duration-150 ease-out"
          style={{
            left: `${thumbPercent}%`,
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Interactive Range Input Overlay */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={isLocked}
        value={clampedValue}
        onChange={(e) => {
          if (isLocked) return;
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) onChange(val);
        }}
        className={`absolute inset-0 w-full h-full opacity-0 z-20 ${
          isLocked ? 'cursor-not-allowed' : 'cursor-ew-resize active:cursor-grabbing'
        }`}
        title={
          isLocked
            ? 'Buka kunci gembok untuk mengubah ukuran'
            : `${label}: ${Math.round(clampedValue * 100)}${unit}`
        }
      />
    </div>
  );
};

interface InteractiveUVCanvasProps {
  currentModel: JerseyModel;
  mockup: MockupSettings;
  onChangeMockup: (updates: Partial<MockupSettings>) => void;
  onUploadDesign: (file: File) => void;
  onLiveUpdateLayers?: (layers: DesignLayer[]) => void;
}

export const InteractiveUVCanvas: React.FC<InteractiveUVCanvasProps> = ({
  currentModel,
  mockup,
  onChangeMockup,
  onUploadDesign,
  onLiveUpdateLayers,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerDomMapRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const [showGuide, setShowGuide] = useState(true);

  const activeLayer = mockup.layers.find((l) => l.id === mockup.activeLayerId) || mockup.layers[0] || null;

  // Real-time smooth drag session via Ref to completely bypass React re-renders on pointermove
  const dragSessionRef = useRef<{
    activeHandle: string;
    targetLayerId: string;
    startX: number;
    startY: number;
    layerX: number;
    layerY: number;
    layerW: number;
    layerH: number;
    layerRotation: number;
    aspectRatio: number;
    hasMoved: boolean;
  } | null>(null);

  const pendingUpdatesRef = useRef<Partial<DesignLayer> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const layersRef = useRef(mockup.layers);
  layersRef.current = mockup.layers;

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Helper to update a single layer in React state
  const updateLayer = (layerId: string, updates: Partial<DesignLayer>) => {
    const nextLayers = layersRef.current.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    layersRef.current = nextLayers;
    onChangeMockup({ layers: nextLayers });
    if (onLiveUpdateLayers) {
      onLiveUpdateLayers(nextLayers);
    }
  };

  // Handle Layer Drag / Resize start
  const handlePointerDown = (e: React.PointerEvent, handleType: string, layerId: string) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (mockup.activeLayerId !== layerId) {
      onChangeMockup({ activeLayerId: layerId });
    }

    const targetLayer = layersRef.current.find((l) => l.id === layerId);
    if (!targetLayer) return;

    // If layer is locked, prevent moving, resizing, or rotating
    if (targetLayer.locked) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const startX = (e.clientX - rect.left) / rect.width;
    const startY = (e.clientY - rect.top) / rect.height;

    const aspect = (targetLayer.aspectRatio && targetLayer.aspectRatio > 0)
      ? targetLayer.aspectRatio
      : (targetLayer.width / (targetLayer.height || 1)) || 1;

    dragSessionRef.current = {
      activeHandle: handleType,
      targetLayerId: layerId,
      startX,
      startY,
      layerX: targetLayer.x,
      layerY: targetLayer.y,
      layerW: targetLayer.width,
      layerH: targetLayer.height,
      layerRotation: targetLayer.rotation || 0,
      aspectRatio: aspect,
      hasMoved: false,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const session = dragSessionRef.current;
    if (!session || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    const dx = currentX - session.startX;
    const dy = currentY - session.startY;

    let updates: Partial<DesignLayer> | null = null;

    if (session.activeHandle === 'move') {
      // Translation
      const newX = Math.max(0, Math.min(1, session.layerX + dx));
      const newY = Math.max(0, Math.min(1, session.layerY + dy));
      updates = { x: newX, y: newY };
    } else if (session.activeHandle === 'rotate') {
      // Rotation relative to layer center
      const rad = Math.atan2(currentY - session.layerY, currentX - session.layerX);
      let deg = Math.round((rad * 180) / Math.PI) + 90;
      if (deg < 0) deg += 360;
      updates = { rotation: deg };
    } else if (session.activeHandle === 'se') {
      // Scale from bottom-right corner preserving aspect ratio
      const newW = Math.max(0.04, Math.min(1.0, session.layerW + dx * 2));
      const newH = Math.max(0.04, Math.min(1.0, newW / session.aspectRatio));
      updates = { width: newW, height: newH };
    } else if (session.activeHandle === 'sw') {
      // Scale from bottom-left corner preserving aspect ratio
      const newW = Math.max(0.04, Math.min(1.0, session.layerW - dx * 2));
      const newH = Math.max(0.04, Math.min(1.0, newW / session.aspectRatio));
      updates = { width: newW, height: newH };
    } else if (session.activeHandle === 'ne') {
      // Scale from top-right corner preserving aspect ratio
      const newW = Math.max(0.04, Math.min(1.0, session.layerW + dx * 2));
      const newH = Math.max(0.04, Math.min(1.0, newW / session.aspectRatio));
      updates = { width: newW, height: newH };
    } else if (session.activeHandle === 'nw') {
      // Scale from top-left corner preserving aspect ratio
      const newW = Math.max(0.04, Math.min(1.0, session.layerW - dx * 2));
      const newH = Math.max(0.04, Math.min(1.0, newW / session.aspectRatio));
      updates = { width: newW, height: newH };
    }

    if (!updates) return;
    session.hasMoved = true;
    pendingUpdatesRef.current = updates;

    // Use requestAnimationFrame for hardware-accelerated rendering without React re-render
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const curSession = dragSessionRef.current;
        const curUpdates = pendingUpdatesRef.current;
        if (!curSession || !curUpdates) return;

        const layerId = curSession.targetLayerId;

        // 1. Direct DOM transform updates (60/120 FPS buttery smooth)
        const domEl = layerDomMapRef.current.get(layerId);
        if (domEl) {
          const targetL = layersRef.current.find((l) => l.id === layerId);
          const posX = (curUpdates.x !== undefined ? curUpdates.x : targetL?.x ?? 0.5) * 100;
          const posY = (curUpdates.y !== undefined ? curUpdates.y : targetL?.y ?? 0.5) * 100;
          const posW = (curUpdates.width !== undefined ? curUpdates.width : targetL?.width ?? 0.3) * 100;
          const posH = (curUpdates.height !== undefined ? curUpdates.height : targetL?.height ?? 0.3) * 100;
          const rot = curUpdates.rotation !== undefined ? curUpdates.rotation : targetL?.rotation ?? 0;

          domEl.style.left = `${posX}%`;
          domEl.style.top = `${posY}%`;
          domEl.style.width = `${posW}%`;
          domEl.style.height = `${posH}%`;
          domEl.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
        }

        // 2. Synchronize in-memory layer coordinates
        const updatedLayers = layersRef.current.map((l) =>
          l.id === layerId ? { ...l, ...curUpdates } : l
        );
        layersRef.current = updatedLayers;

        // 3. Fast persistent Three.js texture update without shader recompile
        if (onLiveUpdateLayers) {
          onLiveUpdateLayers(updatedLayers);
        }
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const session = dragSessionRef.current;
    if (session && session.hasMoved) {
      // Commit the final position to React state once at the end of the gesture
      onChangeMockup({ layers: [...layersRef.current] });
    }

    dragSessionRef.current = null;
    pendingUpdatesRef.current = null;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer release fails
    }
  };

  // Fit active design preserving aspect ratio
  const handleFitDesign = () => {
    if (!activeLayer || activeLayer.locked) return;
    const aspect = (activeLayer.aspectRatio && activeLayer.aspectRatio > 0)
      ? activeLayer.aspectRatio
      : (activeLayer.width / (activeLayer.height || 1)) || 1;

    let fitW = 1.0;
    let fitH = 1.0;
    if (aspect >= 1) {
      fitH = Math.max(0.04, Math.min(1.0, 1.0 / aspect));
    } else {
      fitW = Math.max(0.04, Math.min(1.0, 1.0 * aspect));
    }

    updateLayer(activeLayer.id, {
      x: 0.5,
      y: 0.5,
      width: fitW,
      height: fitH,
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

  return (
    <div className="space-y-3 select-none">
      {/* 2D Interactive UV Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full aspect-square bg-[#262626] border border-[#333333] rounded-2xl relative overflow-hidden flex items-center justify-center touch-none shadow-inner"
      >
        {/* Floating Guide toggle in top-right corner of canvas */}
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#181818]/90 backdrop-blur-xs border border-[#3A3A3A] hover:border-white/50 text-xs text-white hover:bg-[#242424] active:scale-95 transition-all duration-150 shadow-sm cursor-pointer"
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
              ref={(el) => {
                if (el) {
                  layerDomMapRef.current.set(layer.id, el);
                } else {
                  layerDomMapRef.current.delete(layer.id);
                }
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move', layer.id)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                left: `${layer.x * 100}%`,
                top: `${layer.y * 100}%`,
                width: `${layer.width * 100}%`,
                height: `${layer.height * 100}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
              }}
              className={`absolute touch-none flex items-center justify-center ${
                layer.locked ? 'cursor-default' : 'cursor-move'
              } ${isActive ? 'z-20' : 'z-10'}`}
            >
              {/* Layer graphic */}
              <img
                src={layer.dataUrl}
                alt="Design Layer"
                className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-md"
              />

              {/* Active Selection Bounding Box & Transform Handles */}
              {isActive && (
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    layer.locked
                      ? 'border border-dashed border-[#EAB308]/80'
                      : 'border-2 border-white'
                  }`}
                >
                  {layer.locked ? (
                    /* Locked Badge Indicator on UV Canvas */
                    <div className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-[#EAB308] text-black flex items-center justify-center shadow-md">
                      <Lock className="w-3 h-3" />
                    </div>
                  ) : (
                    <>
                      {/* Corner Resize Handles */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'nw', layer.id)}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nwse-resize shadow-xs hover:scale-135 active:scale-110 transition-transform duration-150"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'ne', layer.id)}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nesw-resize shadow-xs hover:scale-135 active:scale-110 transition-transform duration-150"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'se', layer.id)}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                        className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nwse-resize shadow-xs hover:scale-135 active:scale-110 transition-transform duration-150"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'sw', layer.id)}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{ width: 'calc(var(--spacing) * 1.5)', height: 'calc(var(--spacing) * 1.5)' }}
                        className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 rounded-full bg-white border border-black/30 pointer-events-auto cursor-nesw-resize shadow-xs hover:scale-135 active:scale-110 transition-transform duration-150"
                      />

                      {/* Top rotation stem & handle */}
                      <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white pointer-events-none" />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'rotate', layer.id)}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className="absolute -top-6.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-black/30 pointer-events-auto cursor-grab active:cursor-grabbing shadow-md hover:scale-135 active:scale-110 transition-transform duration-150"
                        title="Drag to rotate design"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Row 1: Color button & Fit Design button */}
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
          disabled={!activeLayer || activeLayer.locked}
          className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 shadow-xs group ${
            activeLayer?.locked
              ? 'bg-[#141414] border-[#222222] text-[#555555] cursor-not-allowed opacity-50'
              : 'bg-[#141414] hover:bg-[#1E1E1E] border-[#262626] hover:border-[#444444] text-[#ECECEC] hover:text-white active:scale-98 cursor-pointer hover:shadow-sm'
          }`}
          title={activeLayer?.locked ? 'Buka kunci gembok untuk mengubah ukuran' : 'Fit Design'}
        >
          <Maximize2
            className={`w-3.5 h-3.5 transition-colors duration-150 ${
              activeLayer?.locked ? 'text-[#555555]' : 'text-[#A3A3A3] group-hover:text-white'
            }`}
          />
          <span>Fit Design</span>
        </button>
      </div>

      {/* Row 2: Full width Upload Design button */}
      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-4 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#444444] text-[#ECECEC] hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-98 cursor-pointer shadow-xs hover:shadow-sm group"
        >
          <Upload className="w-3.5 h-3.5 text-[#A3A3A3] group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-150" />
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

      {/* Row 3: Section label */}
      <div className="pt-2">
        <span className="text-xs font-semibold tracking-tight text-white">
          LAYERS ({mockup.layers.length})
        </span>
      </div>

      {/* Row 4: Layer list item */}
      <div className="space-y-3">
        {mockup.layers.map((layer, index) => {
          const isActive = layer.id === (activeLayer?.id || '');
          return (
            <div key={layer.id} className="space-y-2">
              <div
                onClick={() => onChangeMockup({ activeLayerId: layer.id })}
                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer select-none transition-all duration-150 active:scale-[0.99] ${
                  isActive
                    ? 'bg-[#181818] border-[#383838] shadow-xs'
                    : 'bg-[#141414] border-[#262626] hover:bg-[#1A1A1A] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {/* Layer Thumbnail Preview only (no file name text) */}
                  <div
                    className={`w-9 h-9 rounded-md bg-[#1c1c1c] flex items-center justify-center overflow-hidden shrink-0 border transition-all duration-150 relative ${
                      isActive ? 'border-white/40 shadow-xs' : 'border-[#333333]'
                    } ${!layer.visible ? 'opacity-30' : ''}`}
                  >
                    <img
                      src={layer.dataUrl}
                      alt="Design preview"
                      className="w-full h-full object-contain p-0.5"
                    />
                    {layer.locked && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl bg-[#EAB308] text-black flex items-center justify-center shadow-xs">
                        <Lock className="w-2 h-2 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Move Up, Move Down, Hide/Unhide, Lock/Unlock, Delete */}
                <div
                  className="flex items-center gap-1 text-[#737373]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={index === 0}
                    onClick={() => moveLayer(index, 'up')}
                    className="hover:text-white hover:bg-[#262626] rounded p-1.5 disabled:opacity-20 transition-all duration-150 cursor-pointer active:scale-90"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    disabled={index === mockup.layers.length - 1}
                    onClick={() => moveLayer(index, 'down')}
                    className="hover:text-white hover:bg-[#262626] rounded p-1.5 disabled:opacity-20 transition-all duration-150 cursor-pointer active:scale-90"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Hide / Unhide Button (disamping kiri icon gembok & delete) */}
                  <button
                    onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                    className={`rounded p-1.5 transition-all duration-150 cursor-pointer active:scale-90 ${
                      layer.visible
                        ? 'text-[#A3A3A3] hover:text-white hover:bg-[#262626]'
                        : 'text-[#666666] hover:text-[#A3A3A3] bg-[#222222]/80'
                    }`}
                    title={layer.visible ? 'Sembunyikan design (Hide)' : 'Tampilkan design (Unhide)'}
                  >
                    {layer.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Lock / Unlock Button (disamping kiri icon delete) */}
                  <button
                    onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                    className={`rounded p-1.5 transition-all duration-150 cursor-pointer active:scale-90 ${
                      layer.locked
                        ? 'text-[#EAB308] bg-[#EAB308]/15 hover:bg-[#EAB308]/25 shadow-xs'
                        : 'text-[#A3A3A3] hover:text-white hover:bg-[#262626]'
                    }`}
                    title={
                      layer.locked
                        ? 'Design terkunci (klik untuk membuka agar bisa digeser)'
                        : 'Kunci design (klik agar tidak dapat bergeser lagi)'
                    }
                  >
                    {layer.locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="hover:text-[#EF4444] hover:bg-[#2A1515] rounded p-1.5 transition-all duration-150 cursor-pointer active:scale-90 text-[#737373]"
                    title="Hapus layer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 5: Scale & Opacity dibagi dua, ikuti UI Roughness & compact */}
              {isActive && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-accordion-reveal">
                  <CompactPillSlider
                    label="Scale"
                    value={layer.width}
                    min={0.05}
                    max={1.0}
                    step={0.01}
                    isLocked={layer.locked}
                    onChange={(newW) => {
                      const aspect = (layer.aspectRatio && layer.aspectRatio > 0)
                        ? layer.aspectRatio
                        : (layer.width / (layer.height || 1)) || 1;
                      updateLayer(layer.id, { width: newW, height: newW / aspect });
                    }}
                  />

                  <CompactPillSlider
                    label="Opacity"
                    value={layer.opacity ?? 1}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(newOp) => updateLayer(layer.id, { opacity: newOp })}
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
