import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Camera, Repeat, Check, X, Sliders, Settings2, Download } from 'lucide-react';
import { AnimationSettings } from '../types';

interface TimelineBarProps {
  animation: AnimationSettings;
  onChangeAnimation: (updates: Partial<AnimationSettings>) => void;
  onQuickCapture: () => void;
  onOpenExport: () => void;
  onOpenEdit?: () => void;
  onOpenSetup?: () => void;
}

type EasingPreset = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export const TimelineBar: React.FC<TimelineBarProps> = ({
  animation,
  onChangeAnimation,
  onQuickCapture,
  onOpenExport,
  onOpenEdit,
  onOpenSetup,
}) => {
  const [isEasingOpen, setIsEasingOpen] = useState(false);
  const easingPopRef = useRef<HTMLDivElement | null>(null);

  // Close easing popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (easingPopRef.current && !easingPopRef.current.contains(e.target as Node)) {
        setIsEasingOpen(false);
      }
    };
    if (isEasingOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEasingOpen]);

  // Format current seconds into 0:00:00
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const frames = Math.floor((secs % 1) * 30);
    return `${minutes}:${remainingSecs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onChangeAnimation({ currentTime: newTime });
  };

  const togglePlay = () => {
    onChangeAnimation({ isPlaying: !animation.isPlaying });
  };

  const toggleSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(animation.speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    onChangeAnimation({ speed: nextSpeed });
  };

  const toggleFps = () => {
    const fpsOptions: (24 | 30 | 60)[] = [24, 30, 60];
    const currentFps = (animation.fps || 60) as 24 | 30 | 60;
    const currentIndex = fpsOptions.indexOf(currentFps);
    const nextFps = fpsOptions[(currentIndex + 1) % fpsOptions.length];
    onChangeAnimation({ fps: nextFps });
  };

  const currentEasing: EasingPreset = animation.easing || 'linear';

  const easingPresets: {
    id: EasingPreset;
    label: string;
    description: string;
    path: string;
  }[] = [
    {
      id: 'easeIn',
      label: 'IN',
      description: 'Slow start, fast end',
      path: 'M 4 20 C 14 20, 18 10, 20 4',
    },
    {
      id: 'easeOut',
      label: 'OUT',
      description: 'Fast start, slow end',
      path: 'M 4 20 C 6 10, 10 4, 20 4',
    },
    {
      id: 'easeInOut',
      label: 'IN OUT',
      description: 'Smooth slow start & end',
      path: 'M 4 20 C 12 20, 12 4, 20 4',
    },
    {
      id: 'linear',
      label: 'LINEAR',
      description: 'Constant turntable speed',
      path: 'M 4 20 L 20 4',
    },
  ];

  return (
    <>
      {/* Timeline Bar: Floating on mobile, docked on desktop */}
      <div
        className={`z-30 select-none text-[#A3A3A3] transition-all duration-200
          /* Mobile Floating Style */
          fixed bottom-14 left-2 right-2 sm:left-4 sm:right-4 h-11 bg-[#141414]/95 border border-[#3A3A3A] rounded-2xl px-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between
          /* Desktop Docked Style */
          md:relative md:bottom-auto md:left-auto md:right-auto md:h-12 md:bg-[#121212] md:border-t md:border-b-0 md:border-x-0 md:border-[#2A2A2A] md:rounded-none md:px-4 md:shadow-none md:backdrop-blur-none
        `}
      >
        {/* Left controls: Play/Pause, Timecode, Loop, Easing, Speed */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={togglePlay}
          className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            animation.isPlaying
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-[#262626] text-white hover:bg-[#333333] border border-[#595959]/50'
          }`}
          title={animation.isPlaying ? 'Pause Turntable' : 'Play 360 Turntable'}
        >
          {animation.isPlaying ? (
            <Pause className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
          ) : (
            <Play className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <span className="font-mono text-[10px] sm:text-xs text-[#E5E5E5] tracking-tight w-12 sm:w-16">
          {formatTime(animation.currentTime)}
        </span>

        {/* Toggle Repeat */}
        <button
          onClick={() => onChangeAnimation({ loop: !animation.loop })}
          className={`p-1 sm:p-1.5 rounded transition-colors cursor-pointer ${
            animation.loop ? 'text-white bg-[#262626]' : 'text-[#666666] hover:text-[#A3A3A3]'
          }`}
          title="Toggle Repeat"
        >
          <Repeat className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
        </button>

        {/* Easing Editor next to Repeat */}
        <div className="relative" ref={easingPopRef}>
          <button
            onClick={() => setIsEasingOpen(!isEasingOpen)}
            className={`p-1 sm:p-1.5 rounded transition-colors flex items-center gap-0.5 sm:gap-1 cursor-pointer ${
              isEasingOpen || currentEasing !== 'linear'
                ? 'text-white bg-[#262626] border border-[#595959]/60'
                : 'text-[#666666] hover:text-[#A3A3A3]'
            }`}
            title={`Easing Editor (${currentEasing.toUpperCase()})`}
          >
            <svg
              className="w-3 sm:w-3.5 h-3 sm:h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20 C 10 20, 14 4, 20 4" />
              <circle cx="4" cy="20" r="2" fill="currentColor" />
              <circle cx="20" cy="4" r="2" fill="currentColor" />
            </svg>
            {currentEasing !== 'linear' && (
              <span className="text-[8px] sm:text-[9px] font-bold text-[#E5E5E5] uppercase tracking-tighter">
                {currentEasing === 'easeIn' ? 'IN' : currentEasing === 'easeOut' ? 'OUT' : 'IN OUT'}
              </span>
            )}
          </button>

          {/* Easing Popover above button */}
          {isEasingOpen && (
            <div className="absolute bottom-full mb-2.5 left-0 z-50 w-64 bg-[#141414] border border-[#2E2E2E] rounded-xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626] mb-2.5">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 20 C 10 20, 14 4, 20 4" />
                  </svg>
                  <span className="text-[11px] font-semibold text-white tracking-wide">
                    EASING PRESETS
                  </span>
                </div>
                <button
                  onClick={() => setIsEasingOpen(false)}
                  className="w-5 h-5 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Preset List */}
              <div className="space-y-1.5">
                {easingPresets.map((preset) => {
                  const isSelected = currentEasing === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onChangeAnimation({ easing: preset.id });
                        setIsEasingOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#222222] border-white text-white'
                          : 'bg-[#181818] border-[#2A2A2A] text-[#A3A3A3] hover:bg-[#1E1E1E] hover:border-[#404040] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Visual Curve Box */}
                        <div className="w-7 h-7 rounded bg-[#0D0D0D] border border-[#333333] flex items-center justify-center p-1 shrink-0">
                          <svg
                            className={`w-full h-full ${isSelected ? 'text-white' : 'text-[#888888]'}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d={preset.path} />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold leading-none tracking-tight">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-[#737373] leading-none mt-1">
                            {preset.description}
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FPS Setting (24, 30, 60) styled like Playback Speed */}
        <button
          onClick={toggleFps}
          className="text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded bg-[#262626] border border-[#404040] text-[#D4D4D4] hover:border-[#666666] transition-colors cursor-pointer font-mono"
          title="Turntable FPS (24, 30, 60)"
        >
          {animation.fps || 60}fps
        </button>

        {/* Playback Speed */}
        <button
          onClick={toggleSpeed}
          className="text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded bg-[#262626] border border-[#404040] text-[#D4D4D4] hover:border-[#666666] transition-colors cursor-pointer"
          title="Playback Speed"
        >
          {animation.speed}x
        </button>
      </div>

      {/* Center Timeline Scrubber */}
      <div className="flex-1 min-w-[50px] max-w-2xl mx-2 sm:mx-6 flex flex-col justify-center relative">
        {/* Tick labels (Desktop / Tablet) */}
        <div className="hidden sm:flex justify-between text-[9px] text-[#555555] font-mono mb-1 px-1">
          <span>0:00</span>
          <span>0:02</span>
          <span>0:04</span>
          <span>0:06</span>
          <span>0:08</span>
          <span>0:10</span>
        </div>

        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={animation.duration}
            step={0.05}
            value={animation.currentTime}
            onChange={handleScrub}
            className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-white"
          />
          {/* Subtle scrubber track line & progress fill */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-white/40 pointer-events-none rounded-lg"
            style={{ width: `${(animation.currentTime / animation.duration) * 100}%` }}
          />
        </div>
      </div>

      {/* Right actions: Capture / Export */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onQuickCapture}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded bg-[#262626] border border-[#595959] text-xs text-white hover:bg-[#333333] hover:border-[#888888] transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Instant Snapshot"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Capture</span>
        </button>
      </div>
      </div>

      {/* Mobile Quick Action Buttons: EDIT, SET UP, EXPORT */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-13 bg-[#0D0D0D] border-t border-[#262626] px-2.5 flex items-center justify-between gap-2 z-30 select-none">
        <button
          onClick={onOpenEdit}
          className="flex-1 h-9 rounded-lg bg-[#262626] border border-[#595959] hover:bg-[#303030] active:bg-[#383838] text-[#ECECEC] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Sliders className="w-3.5 h-3.5 text-[#ECECEC]" />
          <span className="tracking-tight">EDIT</span>
        </button>

        <button
          onClick={onOpenSetup}
          className="flex-1 h-9 rounded-lg bg-[#262626] border border-[#595959] hover:bg-[#303030] active:bg-[#383838] text-[#ECECEC] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Settings2 className="w-3.5 h-3.5 text-[#ECECEC]" />
          <span className="tracking-tight">SET UP</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex-1 h-9 rounded-lg bg-[#262626] border border-[#595959] hover:bg-[#303030] active:bg-[#383838] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#ECECEC]" />
          <span className="tracking-tight">EXPORT</span>
        </button>
      </div>
    </>
  );
};
