import React from 'react';

interface WorldWiresLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'emblem';
  textColor?: 'dark' | 'light';
}

export const WorldWiresLogo: React.FC<WorldWiresLogoProps> = ({
  className = '',
  variant = 'full',
  textColor = 'dark',
}) => {
  if (variant === 'emblem') {
    return (
      <svg
        viewBox="0 0 280 160"
        className={className || 'h-10 w-auto'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Circle: White with dark slate border */}
        <circle cx="80" cy="80" r="66" fill="#FFFFFF" stroke="#1E293B" strokeWidth="8" />

        {/* Right Circle: Solid Teal */}
        <circle cx="200" cy="80" r="70" fill="#008E9B" />

        {/* Left W (Dark Charcoal) */}
        <path
          d="M 40 50 L 62 114 L 84 55 L 104 114 L 124 50"
          fill="none"
          stroke="#1E293B"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Connecting bridge */}
        <line
          x1="124"
          y1="50"
          x2="156"
          y2="50"
          stroke="#1E293B"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Right W (Pure White) */}
        <path
          d="M 156 50 L 178 114 L 200 55 L 222 114 L 244 50"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Visual Emblem */}
      <svg
        viewBox="0 0 280 160"
        className="h-10 sm:h-12 w-auto shrink-0 drop-shadow-2xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Circle */}
        <circle cx="80" cy="80" r="66" fill="#FFFFFF" stroke="#1E293B" strokeWidth="8" />

        {/* Right Circle */}
        <circle cx="200" cy="80" r="70" fill="#008E9B" />

        {/* Left W */}
        <path
          d="M 40 50 L 62 114 L 84 55 L 104 114 L 124 50"
          fill="none"
          stroke="#1E293B"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Connecting Bridge */}
        <line
          x1="124"
          y1="50"
          x2="156"
          y2="50"
          stroke="#1E293B"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Right W */}
        <path
          d="M 156 50 L 178 114 L 200 55 L 222 114 L 244 50"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`text-lg sm:text-2xl font-black tracking-tight ${
              textColor === 'light' ? 'text-white' : 'text-slate-900'
            }`}
          >
            WORLD
          </span>
          <span className="text-lg sm:text-2xl font-black tracking-tight text-teal-600">
            WIRES
          </span>
          <span className="ml-0.5 text-xs sm:text-sm font-black text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded tracking-wide uppercase">
            KFT.
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase ${
              textColor === 'light' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Raktári Adatbázis Rendszer
          </span>
        </div>
      </div>
    </div>
  );
};
