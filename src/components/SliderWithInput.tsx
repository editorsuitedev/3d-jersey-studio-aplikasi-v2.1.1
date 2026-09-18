import React, { useState, useEffect } from 'react';

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  decimals?: number;
  useComma?: boolean;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const SliderWithInput: React.FC<SliderWithInputProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  decimals = 2,
  useComma = true,
  unit = '',
  onChange,
  className = '',
}) => {
  // Format numeric value for display
  const formatValue = (val: number): string => {
    const formatted = val.toFixed(decimals);
    return useComma ? formatted.replace('.', ',') : formatted;
  };

  const [inputValue, setInputValue] = useState<string>(() => formatValue(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Synchronize internal text state when value changes externally and input is not being typed in
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatValue(value));
    }
  }, [value, decimals, useComma, isFocused]);

  // Calculate percentage for progress fill and thumb position
  const safeRange = max - min || 1;
  const clampedValue = Math.min(max, Math.max(min, value));
  const percent = ((clampedValue - min) / safeRange) * 100;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  // Keep thumb cleanly within rounded track corners (between 3% and 97%)
  const thumbPercent = Math.min(97, Math.max(3, clampedPercent));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    // Normalize comma to dot for parsing
    const normalized = raw.replace(',', '.');
    const parsed = parseFloat(normalized);

    if (!isNaN(parsed) && isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const normalized = inputValue.replace(',', '.');
    const parsed = parseFloat(normalized);

    if (!isNaN(parsed) && isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setInputValue(formatValue(clamped));
    } else {
      setInputValue(formatValue(value));
    }
  };

  return (
    <div className={`flex items-center gap-2.5 w-full select-none ${className}`}>
      {/* Slider Pill Container */}
      <div className="relative flex-1 h-10 rounded-lg bg-[#141414] border border-[#262626] hover:border-[#383838] overflow-hidden flex items-center group shadow-xs transition-all duration-150 cursor-ew-resize">
        {/* Active Fill Track Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-[#262626] group-hover:bg-[#2C2C2C] pointer-events-none will-change-[width] transition-colors duration-150"
          style={{ width: `${clampedPercent}%` }}
        />

        {/* Subtle Tick Marks */}
        <div className="absolute inset-0 flex justify-between items-center px-10 sm:px-12 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-150">
          <div className="w-[1px] h-3 bg-white" />
          <div className="w-[1px] h-3 bg-white" />
          <div className="w-[1px] h-3 bg-white" />
          <div className="w-[1px] h-3 bg-white" />
        </div>

        {/* Label text inside track on the left */}
        <span className="relative z-10 pl-3.5 text-xs font-normal text-[#9ca3af] group-hover:text-[#ECECEC] transition-colors duration-150 pointer-events-none truncate max-w-[55%]">
          {label}
        </span>

        {/* Vertical White Pill Thumb */}
        <div
          className="absolute top-1.5 bottom-1.5 w-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.45)] group-hover:shadow-[0_0_12px_rgba(255,255,255,0.75)] group-hover:w-2 group-active:scale-90 pointer-events-none z-10 will-change-[left] transition-all duration-150 ease-out"
          style={{
            left: `${thumbPercent}%`,
            transform: 'translateX(-50%)',
          }}
        />

        {/* Interactive Native Range Input Overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          onInput={(e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val)) onChange(val);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize active:cursor-grabbing z-20"
          title={`${label}: ${formatValue(clampedValue)}${unit}`}
        />
      </div>

      {/* Numeric Value Input Box */}
      <div className="w-16 h-10 rounded-lg bg-[#141414] border border-[#262626] hover:border-[#383838] flex items-center justify-center shrink-0 focus-within:border-white/70 focus-within:ring-1 focus-within:ring-white/20 transition-all duration-150 shadow-xs cursor-text">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full h-full bg-transparent text-center font-mono text-xs text-white font-medium focus:outline-none px-1 cursor-text"
          title={`Input custom ${label}`}
        />
      </div>
    </div>
  );
};
