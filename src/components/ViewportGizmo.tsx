import React from 'react';
import { RotateCcw, Plus, Minus } from 'lucide-react';

interface ViewportGizmoProps {
  onSnapView: (view: 'front' | 'back' | 'left' | 'right' | 'top') => void;
  onReset: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  fov?: number;
  currentRotationY?: number;
}

export const ViewportGizmo: React.FC<ViewportGizmoProps> = ({
  onSnapView,
  onReset,
  onZoomIn,
  onZoomOut,
  currentRotationY = 0,
}) => {
  // Angle for the interactive compass indicator
  const deg = ((currentRotationY * 180) / Math.PI) % 360;

  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-center gap-3.5 sm:gap-4 select-none">
      {/* 3D Orientation Gizmo Sphere (Enlarged and placed on top) */}
      <div className="relative group flex items-center justify-center">
        <div
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#181818]/90 border border-[#444444] shadow-2xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:border-[#666666]"
          title="Snap Viewport Angles"
        >
          {/* Axis Rings */}
          <div
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-dashed border-[#595959] relative transition-transform duration-300"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            {/* Front indicator dot */}
            <button
              onClick={() => onSnapView('front')}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#E5E5E5] border border-[#1A1A1A] hover:scale-135 transition-all shadow-[0_0_8px_rgba(255,255,255,0.6)] cursor-pointer"
              title="Front View"
            />
            {/* Back indicator dot */}
            <button
              onClick={() => onSnapView('back')}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#E5E5E5] border border-[#1A1A1A] hover:scale-135 transition-all shadow-[0_0_8px_rgba(255,255,255,0.6)] cursor-pointer"
              title="Back View"
            />
            {/* Left indicator dot */}
            <button
              onClick={() => onSnapView('left')}
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E5E5E5] border border-[#1A1A1A] hover:scale-135 transition-all shadow-[0_0_8px_rgba(255,255,255,0.6)] cursor-pointer"
              title="Left View"
            />
            {/* Right indicator dot */}
            <button
              onClick={() => onSnapView('right')}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E5E5E5] border border-[#1A1A1A] hover:scale-135 transition-all shadow-[0_0_8px_rgba(255,255,255,0.6)] cursor-pointer"
              title="Right View"
            />
            {/* Center Top Dot */}
            <button
              onClick={() => onSnapView('top')}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white hover:scale-135 transition-all border border-black/60 shadow-xs cursor-pointer"
              title="Top View"
            />
          </div>
        </div>

        {/* Quick View Tooltip popover on hover (Desktop) */}
        <div className="hidden sm:block absolute -left-24 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#1F1F1F] border border-[#595959] px-2 py-0.5 rounded text-[10px] text-[#D4D4D4] whitespace-nowrap shadow-lg">
          Snap Viewport
        </div>
      </div>

      {/* Action Buttons directly UNDER the Gizmo: vertically stacked (+), below it (-), below it reset */}
      <div className="flex flex-col items-center bg-[#181818]/90 border border-[#404040] rounded-xl p-0.5 shadow-2xl backdrop-blur-md gap-0.5">
        {/* Zoom In (+) */}
        <button
          onClick={onZoomIn}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-all duration-200 flex items-center justify-center active:scale-90 active:bg-[#333333] cursor-pointer"
          title="Zoom In (Smooth FOV)"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Zoom Out (-) */}
        <button
          onClick={onZoomOut}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-all duration-200 flex items-center justify-center active:scale-90 active:bg-[#333333] cursor-pointer"
          title="Zoom Out (Smooth FOV)"
        >
          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="w-4 h-[1px] bg-[#333333] my-0.5" />

        {/* Reset Camera Button */}
        <button
          onClick={onReset}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-all duration-200 flex items-center justify-center active:scale-90 active:bg-[#333333] cursor-pointer"
          title="Reset Camera & Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
