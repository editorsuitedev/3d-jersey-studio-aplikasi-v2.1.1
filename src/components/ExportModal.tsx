import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Check,
  Loader2,
  Lock,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JerseyModel, AnimationSettings } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: JerseyModel;
  animation: AnimationSettings;
  onExportImage: (format: 'png' | 'jpg', ratio: '16:9' | '1:1' | '9:16' | '4:5', transparent: boolean) => Promise<void>;
  onExportVideo: (
    fps: number,
    duration: number,
    format: 'webm' | 'mp4',
    ratio: '16:9' | '1:1' | '9:16' | '4:5',
    transparent: boolean
  ) => Promise<void>;
  onDownloadGLB?: () => void;
  onDownloadSVG?: () => void;
  isExportingVideo: boolean;
  videoExportProgress: number; // 0 to 100
  isPro: boolean;
  onOpenPro: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  animation,
  onExportImage,
  onExportVideo,
  isExportingVideo,
  videoExportProgress,
  isPro,
  onOpenPro,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  // Image export options: format, ratio (16:9, 1:1, 9:16, 4:5), transparent
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg'>('png');
  const [ratio, setRatio] = useState<'16:9' | '1:1' | '9:16' | '4:5'>('16:9');
  const [transparentBg, setTransparentBg] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Video export options matching image export UI
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm'>('mp4');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '1:1' | '9:16' | '4:5'>('16:9');
  const [videoTransparentBg, setVideoTransparentBg] = useState(false);

  const handleTriggerImageExport = async () => {
    if (!isPro) {
      onClose();
      onOpenPro();
      return;
    }
    setIsExportingImage(true);
    try {
      await onExportImage(imageFormat, ratio, transparentBg);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleTriggerVideoExport = async () => {
    if (!isPro) {
      onClose();
      onOpenPro();
      return;
    }
    try {
      const exportFps = animation?.fps || 60;
      const exportDuration = animation?.duration || 10;
      await onExportVideo(exportFps, exportDuration, videoFormat, videoRatio, videoTransparentBg);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Dialog Card with smooth spring scale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Top Header */}
            <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#0D0D0D]">
              {/* Tabs: IMAGES | VIDEO */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('image')}
                  className={`text-xs font-semibold pb-1 tracking-tight transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'image' ? 'text-white' : 'text-[#737373] hover:text-[#ECECEC]'
                  }`}
                >
                  <span>IMAGES</span>
                  {activeTab === 'image' && (
                    <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('video')}
                  className={`text-xs font-semibold pb-1 tracking-tight transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'video' ? 'text-white' : 'text-[#737373] hover:text-[#ECECEC]'
                  }`}
                >
                  <span>VIDEO</span>
                  {activeTab === 'video' && (
                    <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        {/* Tab 1: IMAGE */}
        {activeTab === 'image' && (
          <div className="p-5 space-y-4 text-xs">
            {/* Free Plan Lock Notice */}
            {!isPro && (
              <div className="px-3.5 py-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#D4D4D4]">
                  <Lock className="w-3.5 h-3.5 text-[#da0a2c] shrink-0" />
                  <span>Fitur export dikunci</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPro();
                  }}
                  className="text-[#da0a2c] hover:underline font-semibold text-[11px] shrink-0 cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            )}
            {/* Format selection */}
            <div>
              <label className="text-[#A3A3A3] block mb-2 font-medium">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setImageFormat('png')}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    imageFormat === 'png'
                      ? 'bg-[#262626] text-white border-white'
                      : 'bg-[#181818] text-[#737373] border-[#2E2E2E] hover:border-[#444444]'
                  }`}
                >
                  <span>PNG</span>
                  {imageFormat === 'png' && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                </button>
                <button
                  onClick={() => setImageFormat('jpg')}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    imageFormat === 'jpg'
                      ? 'bg-[#262626] text-white border-white'
                      : 'bg-[#181818] text-[#737373] border-[#2E2E2E] hover:border-[#444444]'
                  }`}
                >
                  <span>JPG</span>
                  {imageFormat === 'jpg' && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                </button>
              </div>
            </div>

            {/* Export Aspect Ratio selection */}
            <div>
              <label className="text-[#A3A3A3] block mb-2 font-medium">Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {/* 16:9 Landscape */}
                <button
                  onClick={() => setRatio('16:9')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    ratio === '16:9'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-6 h-3.5 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">16:9</span>
                  <span className="text-[9px] text-[#888888]">Landscape</span>
                </button>

                {/* 1:1 Square */}
                <button
                  onClick={() => setRatio('1:1')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    ratio === '1:1'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-4.5 h-4.5 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">1:1</span>
                  <span className="text-[9px] text-[#888888]">Square</span>
                </button>

                {/* 9:16 Vertical */}
                <button
                  onClick={() => setRatio('9:16')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    ratio === '9:16'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-3.5 h-6 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">9:16</span>
                  <span className="text-[9px] text-[#888888]">Vertical</span>
                </button>

                {/* 4:5 Portrait */}
                <button
                  onClick={() => setRatio('4:5')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    ratio === '4:5'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-4 h-5 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">4:5</span>
                  <span className="text-[9px] text-[#888888]">Portrait</span>
                </button>
              </div>
            </div>

            {/* Transparent background checkbox */}
            {imageFormat === 'png' && (
              <label className="flex items-center gap-2 text-[#A3A3A3] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded bg-[#1A1A1A] border-[#333333] text-white accent-white"
                />
                <span>Transparent Background</span>
              </label>
            )}

            {/* CTA Button */}
            <div className="pt-3">
              {!isPro ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPro();
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] text-white font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Upgrade Sekarang</span>
                </button>
              ) : (
                <button
                  onClick={handleTriggerImageExport}
                  disabled={isExportingImage}
                  className="w-full py-2.5 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {isExportingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering 4K Canvas...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export Image</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: VIDEO */}
        {activeTab === 'video' && (
          <div className="p-5 space-y-4 text-xs">
            {/* Free Plan Lock Notice */}
            {!isPro && (
              <div className="px-3.5 py-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#D4D4D4]">
                  <Lock className="w-3.5 h-3.5 text-[#da0a2c] shrink-0" />
                  <span>Fitur export dikunci</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPro();
                  }}
                  className="text-[#da0a2c] hover:underline font-semibold text-[11px] shrink-0 cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            )}
            {/* Format selection */}
            <div>
              <label className="text-[#A3A3A3] block mb-2 font-medium">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVideoFormat('mp4')}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    videoFormat === 'mp4'
                      ? 'bg-[#262626] text-white border-white'
                      : 'bg-[#181818] text-[#737373] border-[#2E2E2E] hover:border-[#444444]'
                  }`}
                >
                  <span>MP4</span>
                  {videoFormat === 'mp4' && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                </button>
                <button
                  onClick={() => setVideoFormat('webm')}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    videoFormat === 'webm'
                      ? 'bg-[#262626] text-white border-white'
                      : 'bg-[#181818] text-[#737373] border-[#2E2E2E] hover:border-[#444444]'
                  }`}
                >
                  <span>WEBM</span>
                  {videoFormat === 'webm' && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                </button>
              </div>
            </div>

            {/* Export Aspect Ratio selection */}
            <div>
              <label className="text-[#A3A3A3] block mb-2 font-medium">Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {/* 16:9 Landscape */}
                <button
                  onClick={() => setVideoRatio('16:9')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    videoRatio === '16:9'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-6 h-3.5 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">16:9</span>
                  <span className="text-[9px] text-[#888888]">Landscape</span>
                </button>

                {/* 1:1 Square */}
                <button
                  onClick={() => setVideoRatio('1:1')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    videoRatio === '1:1'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-4.5 h-4.5 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">1:1</span>
                  <span className="text-[9px] text-[#888888]">Square</span>
                </button>

                {/* 9:16 Vertical */}
                <button
                  onClick={() => setVideoRatio('9:16')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    videoRatio === '9:16'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-3.5 h-6 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">9:16</span>
                  <span className="text-[9px] text-[#888888]">Vertical</span>
                </button>

                {/* 4:5 Portrait */}
                <button
                  onClick={() => setVideoRatio('4:5')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    videoRatio === '4:5'
                      ? 'bg-[#262626] border-white text-white'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#737373] hover:text-[#ECECEC] hover:border-[#444444]'
                  }`}
                >
                  <div className="w-4 h-5 border-2 border-current rounded-xs" />
                  <span className="text-[11px] font-semibold">4:5</span>
                  <span className="text-[9px] text-[#888888]">Portrait</span>
                </button>
              </div>
            </div>

            {/* Transparent background option (WebM only) */}
            {videoFormat === 'webm' && (
              <label className="flex items-center gap-2 text-[#A3A3A3] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={videoTransparentBg}
                  onChange={(e) => setVideoTransparentBg(e.target.checked)}
                  className="rounded bg-[#1A1A1A] border-[#333333] text-white accent-white"
                />
                <span>Transparent Background</span>
              </label>
            )}

            {/* Turntable duration summary badge */}
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#181818] border border-[#262626]">
              <span className="text-[#A3A3A3]">Duration</span>
              <span className="font-mono text-white font-semibold">{animation?.duration || 10}s</span>
            </div>

            {/* Video progress indicator if recording */}
            {isExportingVideo && (
              <div className="p-2.5 bg-[#1A1A1A] border border-[#333333] rounded-lg">
                <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] transition-all duration-100"
                    style={{ width: `${videoExportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Video CTA */}
            <div className="pt-2">
              {!isPro ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPro();
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#da0a2c] hover:bg-[#b80825] text-white font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Upgrade Sekarang</span>
                </button>
              ) : (
                <button
                  onClick={handleTriggerVideoExport}
                  disabled={isExportingVideo}
                  className="w-full py-2.5 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {isExportingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Exporting ({Math.round(videoExportProgress)}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export Video</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
