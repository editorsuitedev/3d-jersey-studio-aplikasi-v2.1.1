import React, { useState } from 'react';

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  autoComplete,
  icon,
  rightAction,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || (value && value.length > 0);

  return (
    <div className="relative w-full">
      {/* Left icon if provided */}
      {icon && (
        <div
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
            isFocused ? 'text-white' : 'text-[#666666]'
          }`}
        >
          {icon}
        </div>
      )}

      {/* The input element */}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full bg-[#161616] border rounded-xl py-3 text-sm text-white placeholder-transparent focus:outline-none transition-all duration-200 disabled:opacity-50 ${
          icon ? 'pl-10' : 'pl-3.5'
        } ${rightAction ? 'pr-11' : 'pr-3.5'} ${
          isFocused
            ? 'border-[#ECECEC] bg-[#1A1A1A] shadow-[0_0_0_1px_#ECECEC]'
            : 'border-[#2A2A2A] hover:border-[#383838]'
        }`}
        placeholder={label}
      />

      {/* Floating Animated Label */}
      <label
        htmlFor={id}
        className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
          icon ? (isFloating ? 'left-9' : 'left-10') : 'left-3.5'
        } ${
          isFloating
            ? '-top-2.5 text-[11px] font-medium text-white bg-[#121212] px-1.5 rounded'
            : 'top-1/2 -translate-y-1/2 text-xs sm:text-sm text-[#737373]'
        }`}
      >
        {label}
      </label>

      {/* Optional right button (e.g. eye toggle) */}
      {rightAction && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
          {rightAction}
        </div>
      )}
    </div>
  );
};
