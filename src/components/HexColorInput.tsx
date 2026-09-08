import React, { useState, useEffect, useRef } from 'react';

interface HexColorInputProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  showHash?: boolean;
}

export const HexColorInput: React.FC<HexColorInputProps> = ({
  value,
  onChange,
  className = '',
  size = 'md',
  showHash = true,
}) => {
  const [text, setText] = useState<string>(value || '#000000');
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Keep local text state in sync when external prop changes
  useEffect(() => {
    setText(value || '#000000');
  }, [value]);

  const normalizeHex = (hex: string): string | null => {
    let clean = hex.trim();
    if (clean.startsWith('#')) {
      clean = clean.slice(1);
    }
    if (clean.length === 3) {
      // expand 3-digit hex like f00 -> ff0000
      clean = clean
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      return '#' + clean.toUpperCase();
    }
    return null;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);

    const validHex = normalizeHex(raw);
    if (validHex) {
      onChange(validHex);
    }
  };

  const handleBlur = () => {
    const validHex = normalizeHex(text);
    if (validHex) {
      setText(validHex);
      onChange(validHex);
    } else {
      // Revert to last valid prop value
      setText(value || '#000000');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.toUpperCase();
    setText(newColor);
    onChange(newColor);
  };

  // Safe color for native picker (must be 7 characters #RRGGBB)
  const safePickerValue = /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value
    : normalizeHex(value) || '#000000';

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-1 rounded bg-[#141414] border border-[#262626] hover:border-[#444444] transition-colors focus-within:border-white/70 ${className}`}
    >
      {/* Clickable Swatch */}
      <div
        onClick={() => colorPickerRef.current?.click()}
        className={`${
          isSmall ? 'w-4 h-4' : 'w-5 h-5'
        } rounded-xs border border-[#444444] shadow-xs shrink-0 cursor-pointer relative hover:scale-105 active:scale-95 transition-transform`}
        style={{ backgroundColor: safePickerValue }}
        title="Open color picker"
      >
        <input
          ref={colorPickerRef}
          type="color"
          value={safePickerValue}
          onChange={handlePickerChange}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-none"
          tabIndex={-1}
        />
      </div>

      {/* Hex Text Input */}
      <div className="flex items-center">
        {showHash && (
          <span className="text-[11px] font-mono text-[#737373] select-none mr-0.5">#</span>
        )}
        <input
          type="text"
          value={showHash && text.startsWith('#') ? text.slice(1) : text}
          onChange={(e) => {
            const val = e.target.value;
            handleTextChange({
              ...e,
              target: { ...e.target, value: showHash ? (val ? '#' + val : '') : val },
            });
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          maxLength={showHash ? 7 : 6}
          placeholder="2B2B2B"
          className="w-16 bg-transparent text-white font-mono text-[11px] uppercase tracking-wider outline-none p-0"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
