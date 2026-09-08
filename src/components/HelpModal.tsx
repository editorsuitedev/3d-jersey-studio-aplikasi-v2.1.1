import React from 'react';
import { X, MousePointer, RotateCw, ZoomIn, Move, Sparkles, Video, ExternalLink } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141414] border border-[#2E2E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#0D0D0D]">
          <h2 className="text-sm font-bold tracking-wider text-white">INFO</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs text-[#D4D4D4] overflow-y-auto custom-scrollbar">
          {/* Section 1: 3D Viewport Controls */}
          <div>
            <h3 className="text-[#A3A3A3] font-semibold uppercase tracking-wider text-[10px] mb-2">
              3D Viewport Controls
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center gap-2.5">
                <RotateCw className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                <div>
                  <span className="font-medium text-white block">Orbit / Rotate</span>
                  <span className="text-[10px] text-[#737373]">Left Click + Drag</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center gap-2.5">
                <ZoomIn className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                <div>
                  <span className="font-medium text-white block">Zoom In / Out</span>
                  <span className="text-[10px] text-[#737373]">Mouse Wheel / Buttons</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center gap-2.5">
                <Move className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                <div>
                  <span className="font-medium text-white block">Pan Viewport</span>
                  <span className="text-[10px] text-[#737373]">Right Click + Drag</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center gap-2.5">
                <MousePointer className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                <div>
                  <span className="font-medium text-white block">Snap Angles</span>
                  <span className="text-[10px] text-[#737373]">Click Gizmo Dots</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Changelog & Video Export Notes */}
          <div>
            <h3 className="text-[#A3A3A3] font-semibold uppercase tracking-wider text-[10px] mb-2">
              Changelog & System Notes
            </h3>
            <div className="space-y-2.5">
              {/* App Changelog */}
              <div className="p-3 rounded-lg bg-[#181818] border border-[#262626] space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="font-semibold text-white text-[11px]">Changelog Aplikasi v2.1.0</span>
                </div>
                <ul className="text-[11px] text-[#8C8C8C] space-y-1 list-disc list-inside leading-relaxed pl-1">
                  <li>Pembaruan Viewport Gizmo di kanan atas dengan kontrol Field of View (+ / -) & Reset.</li>
                  <li>Dukungan input kode warna Hex manual pada seluruh Color Picker (Model & Background).</li>
                  <li>Optimalisasi seamless 360° turntable video export dengan variasi FPS (24/30/60fps) dan kurva easing.</li>
                  <li>Sinkronisasi model apparel jersey atletik dengan presisi UV vector layout.</li>
                </ul>
              </div>

              {/* Video Export Note */}
              <div className="p-3 rounded-lg bg-[#181818] border border-[#262626] space-y-1.5">
                <div className="flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span className="font-semibold text-white text-[11px]">Catatan Export Video</span>
                </div>
                <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                  Catatan Export Video: Proses encoding dilakukan langsung di browser dan dapat membutuhkan RAM serta waktu pemrosesan yang cukup besar. Untuk hasil export yang lebih optimal, disarankan menggunakan desktop/laptop dengan koneksi internet yang stabil.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Legal / Policy Links */}
          <div className="pt-2 border-t border-[#262626]">
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <a
                href="https://editorsuite.id/license/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A3A3A3] hover:text-white underline underline-offset-4 decoration-[#3E3E3E] hover:decoration-white transition-colors flex items-center gap-1"
              >
                <span>License</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <span className="text-[#3E3E3E]">•</span>
              <a
                href="https://editorsuite.id/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A3A3A3] hover:text-white underline underline-offset-4 decoration-[#3E3E3E] hover:decoration-white transition-colors flex items-center gap-1"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <span className="text-[#3E3E3E]">•</span>
              <a
                href="https://editorsuite.id/terms-conditions/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A3A3A3] hover:text-white underline underline-offset-4 decoration-[#3E3E3E] hover:decoration-white transition-colors flex items-center gap-1"
              >
                <span>Terms & Conditions</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Got it Button */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-[#262626] border border-[#595959] text-white font-semibold hover:bg-[#333333] hover:border-white transition-all cursor-pointer active:scale-98"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
