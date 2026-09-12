import React, { useState } from 'react';
import { JerseyModel } from '../types';

interface Jersey3DThumbnailProps {
  model: JerseyModel;
  isSelected: boolean;
}

export const Jersey3DThumbnail: React.FC<Jersey3DThumbnailProps> = ({ model, isSelected }) => {
  const [imgError, setImgError] = useState(false);

  // If external thumbnail image is available and loads properly, render it
  if (model.thumbnailUrl && !imgError) {
    return (
      <div className="w-full h-full relative flex items-center justify-center p-2 select-none overflow-hidden bg-gradient-to-b from-[#181818] to-[#0E0E0E]">
        <img
          src={model.thumbnailUrl}
          alt={model.name}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Subtle Bottom Accent Glow if Selected */}
        {isSelected && (
          <div className="absolute inset-x-4 bottom-0 h-0.5 bg-white shadow-[0_0_8px_#ffffff]" />
        )}
      </div>
    );
  }

  // Check for Hanger or Mannequin model types
  const isHanger = model.id.includes('hanger') || model.category === '3D Hanger';
  const isMannequin = model.id.includes('mannequin') || model.category === '3D Mannequin';

  // Determine neck cutout style based on model ID as fallback
  const isVNeck = model.id.includes('v-neck') || model.id.includes('v-cross') || model.id.includes('v-flat');
  const isPolo = model.id.includes('polo');
  const isCross = model.id.includes('v-cross');
  const isRound = model.id.includes('o-neck') || model.id.includes('v-round') || model.id.includes('casual-neck');

  return (
    <div className="w-full h-full relative flex items-center justify-center p-2 select-none overflow-hidden bg-gradient-to-b from-[#161616] to-[#0D0D0D]">
      {/* 3D Realistic Athletic Jersey Silhouette SVG */}
      <svg
        viewBox="0 0 200 240"
        className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Fabric Shading Gradient */}
          <linearGradient id={`torsoGrad-${model.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2A2A2A" />
            <stop offset="25%" stopColor="#404040" />
            <stop offset="50%" stopColor="#4E4E4E" />
            <stop offset="75%" stopColor="#404040" />
            <stop offset="100%" stopColor="#262626" />
          </linearGradient>

          {/* Torso Top Down Depth */}
          <linearGradient id={`verticalGrad-${model.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>

          {/* Sleeve Gradient Left */}
          <linearGradient id={`sleeveLeft-${model.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#424242" />
            <stop offset="100%" stopColor="#222222" />
          </linearGradient>

          {/* Sleeve Gradient Right */}
          <linearGradient id={`sleeveRight-${model.id}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#424242" />
            <stop offset="100%" stopColor="#222222" />
          </linearGradient>
        </defs>

        {/* Hanger Silhouette Overlay when in Hanger category */}
        {isHanger && (
          <g>
            {/* Hook */}
            <path
              d="M 100 24 C 100 12, 114 12, 114 20 C 114 26, 102 28, 100 36"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Wooden or steel hanger bar */}
            <path
              d="M 50 48 L 100 36 L 150 48 Q 100 42 50 48"
              fill="#A0522D"
              stroke="#8B4513"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Mannequin Stand Silhouette overlay when in Mannequin category */}
        {isMannequin && (
          <g>
            {/* Neck cap / finial */}
            <ellipse cx="100" cy="30" rx="14" ry="5" fill="#333333" stroke="#555555" strokeWidth="1" />
            {/* Torso stand pole at bottom */}
            <rect x="97" y="220" width="6" height="18" fill="#555555" />
          </g>
        )}

        {/* Back Collar depth */}
        <ellipse cx="100" cy="38" rx="28" ry="12" fill="#1C1C1C" stroke="#333333" strokeWidth="1" />

        {/* Left Sleeve */}
        <path
          d="M 68 46 L 22 84 C 18 87, 18 94, 23 99 L 36 112 C 40 116, 47 116, 51 111 L 68 90 Z"
          fill={`url(#sleeveLeft-${model.id})`}
          stroke="#555555"
          strokeWidth="0.75"
        />

        {/* Right Sleeve */}
        <path
          d="M 132 46 L 178 84 C 182 87, 182 94, 177 99 L 164 112 C 160 116, 153 116, 149 111 L 132 90 Z"
          fill={`url(#sleeveRight-${model.id})`}
          stroke="#555555"
          strokeWidth="0.75"
        />

        {/* Main Jersey Torso Body */}
        <path
          d="M 68 46 
             C 78 40, 122 40, 132 46 
             L 142 90 
             C 140 120, 138 180, 140 214 
             C 140 219, 136 222, 131 222 
             L 69 222 
             C 64 222, 60 219, 60 214 
             C 62 180, 60 120, 58 90 Z"
          fill={`url(#torsoGrad-${model.id})`}
          stroke="#5A5A5A"
          strokeWidth="0.8"
        />

        {/* Torso Top Highlight / Ambient Shadow Overlay */}
        <path
          d="M 68 46 C 78 40, 122 40, 132 46 L 142 90 C 140 120, 138 180, 140 214 L 60 214 C 62 180, 60 120, 58 90 Z"
          fill={`url(#verticalGrad-${model.id})`}
        />

        {/* Chest 3D Contour lines (athletic cut) */}
        <path d="M 68 76 C 85 96, 95 106, 95 130" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="1.5" fill="none" />
        <path d="M 132 76 C 115 96, 105 106, 105 130" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />

        {/* Bottom Hem seam */}
        <path d="M 60 212 Q 100 216 140 212" stroke="#222222" strokeWidth="1.5" fill="none" />

        {/* Neckline Variations based on Model */}
        {isPolo ? (
          // Polo Collar with Placket & Lapels
          <g>
            <path d="M 78 42 L 88 74 L 100 70 L 100 40 Z" fill="#666666" stroke="#222222" strokeWidth="1" />
            <path d="M 122 42 L 112 74 L 100 70 L 100 40 Z" fill="#555555" stroke="#222222" strokeWidth="1" />
            <rect x="97" y="68" width="6" height="34" rx="2" fill="#2E2E2E" stroke="#444444" strokeWidth="0.75" />
            <circle cx="100" cy="74" r="1.5" fill="#E5E5E5" />
            <circle cx="100" cy="86" r="1.5" fill="#E5E5E5" />
            <circle cx="100" cy="96" r="1.5" fill="#E5E5E5" />
          </g>
        ) : isCross ? (
          // V-Cross Overlapping Collar
          <g>
            <path d="M 76 43 Q 95 72 106 74" stroke="#888888" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 124 43 Q 105 70 94 74" stroke="#777777" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 76 43 Q 100 80 124 43" stroke="#222222" strokeWidth="1.5" fill="none" />
          </g>
        ) : isVNeck ? (
          // V-Neck / V-Flat Collar
          <g>
            <path
              d="M 76 42 Q 88 56 100 78 Q 112 56 124 42"
              fill="none"
              stroke="#888888"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M 78 43 L 100 75 L 122 43"
              fill="#181818"
              stroke="#222222"
              strokeWidth="1"
            />
          </g>
        ) : (
          // O-Neck / Crew Round Collar
          <g>
            <path
              d="M 76 42 C 78 68, 122 68, 124 42"
              fill="none"
              stroke="#888888"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 78 42 C 82 64, 118 64, 122 42"
              fill="#181818"
              stroke="#222222"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>

      {/* Subtle Bottom Accent Glow if Selected */}
      {isSelected && (
        <div className="absolute inset-x-4 bottom-0 h-0.5 bg-white shadow-[0_0_8px_#ffffff]" />
      )}
    </div>
  );
};
