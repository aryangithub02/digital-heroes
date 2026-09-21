/**
 * Digital Heroes — Official Brand Logo Component
 * Pixel-accurate vector implementation of the official logo:
 * - Green "D" shield with swinging golfer silhouette
 * - Golden sun, green fairway with flagstick
 * - Left golden swoosh with emerald leaves
 * - Bold "Digital Heroes" typography with heart cutout in 'o'
 * - Tagline: "PLAY • GIVE • CREATE IMPACT"
 */

import React from 'react';

export interface DigitalHeroesLogoProps {
  variant?: 'horizontal' | 'stacked' | 'emblem';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export const DigitalHeroesLogo: React.FC<DigitalHeroesLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showTagline = true,
  className = '',
  theme = 'light',
}) => {
  // Size dimensions
  const dimensions = {
    xs: { emblem: 24, text: 'text-sm', sub: 'text-[8px]', height: 'h-6' },
    sm: { emblem: 32, text: 'text-base', sub: 'text-[9px]', height: 'h-8' },
    md: { emblem: 42, text: 'text-xl', sub: 'text-[10px]', height: 'h-10' },
    lg: { emblem: 56, text: 'text-2xl', sub: 'text-xs', height: 'h-14' },
    xl: { emblem: 72, text: 'text-3xl', sub: 'text-sm', height: 'h-18' },
  }[size];

  const EmblemSVG = ({ sizePx }: { sizePx: number }) => (
    <svg
      viewBox="100 50 300 320"
      width={sizePx}
      height={sizePx}
      className="shrink-0 drop-shadow-xs"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`dhEmbGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#083822" />
          <stop offset="45%" stopColor="#0b4a2e" />
          <stop offset="100%" stopColor="#052c1a" />
        </linearGradient>

        <linearGradient id={`dhFairway-${size}`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#146c43" />
          <stop offset="100%" stopColor="#093f26" />
        </linearGradient>

        <linearGradient id={`dhSun-${size}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>

        <linearGradient id={`dhGold-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3c650" />
          <stop offset="50%" stopColor="#d99f26" />
          <stop offset="100%" stopColor="#b47814" />
        </linearGradient>

        <linearGradient id={`dhLeaf-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#073b22" />
          <stop offset="60%" stopColor="#157a46" />
          <stop offset="100%" stopColor="#1ba85f" />
        </linearGradient>
      </defs>

      {/* Base D Body */}
      <path
        d="M 148 76 C 245 76 372 102 372 216 C 372 312 272 348 216 348 C 160 348 135 328 132 300 L 140 100 Z"
        fill={`url(#dhEmbGrad-${size})`}
      />

      {/* Sun on the horizon */}
      <circle cx="308" cy="235" r="42" fill={`url(#dhSun-${size})`} />

      {/* Rolling Fairway */}
      <path
        d="M 175 348 C 220 290 280 250 372 260 L 372 312 C 340 335 272 348 216 348 Z"
        fill={`url(#dhFairway-${size})`}
      />

      {/* Golf Flagstick & Triangular Flag */}
      <line x1="318" y1="218" x2="318" y2="262" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      <polygon points="318,218 333,224 318,230" fill="#ffffff" />

      {/* White Golfer Silhouette in Follow-Through Swing */}
      <g fill="#ffffff">
        <ellipse cx="261" cy="138" rx="14" ry="15" />
        <path d="M 252 135 C 255 125 272 124 282 131 C 285 133 275 138 252 135 Z" />
        <path d="M 250 152 C 242 165 238 185 240 215 C 242 245 246 270 248 285 L 268 275 C 265 245 264 210 270 180 C 274 162 265 152 250 152 Z" />
        <path d="M 245 156 C 235 150 216 160 212 180 C 210 190 218 192 224 185 C 230 176 238 168 248 165 Z" />
        <path d="M 255 152 C 248 140 236 128 226 138 C 220 144 225 155 232 154 C 238 153 245 158 250 165 Z" />
        <path d="M 235 134 C 240 128 254 135 258 146 Z" />
        <line x1="236" y1="130" x2="340" y2="182" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="342" cy="183" rx="6.5" ry="4.5" transform="rotate(28 342 183)" />
        <path d="M 242 270 C 240 295 245 320 252 342 C 256 342 264 330 262 300 C 260 280 258 270 242 270 Z" />
      </g>

      {/* Gold Flourish Head/Ball */}
      <circle cx="174" cy="192" r="17" fill={`url(#dhGold-${size})`} />

      {/* Gold Dynamic Ribbon Curve */}
      <path
        d="M 129 164 C 145 205 140 255 178 300 C 192 316 206 332 216 345 C 205 330 190 300 178 268 C 166 236 156 198 129 164 Z"
        fill={`url(#dhGold-${size})`}
      />

      {/* Green Leaves */}
      <path
        d="M 133 226 C 130 280 152 338 206 358 C 182 350 158 318 148 280 C 138 245 135 232 133 226 Z"
        fill={`url(#dhLeaf-${size})`}
      />
      <path
        d="M 160 270 C 168 310 188 340 210 354 C 196 344 180 320 174 290 C 168 268 164 265 160 270 Z"
        fill="#0d5231"
      />
    </svg>
  );

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <EmblemSVG sizePx={dimensions.emblem} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <EmblemSVG sizePx={dimensions.emblem * 1.5} />
        <div className="mt-3 flex items-baseline justify-center tracking-tight">
          <span className={`font-display font-extrabold ${dimensions.text} text-slate-900`}>
            Digital
          </span>
          <span className={`font-display font-extrabold ${dimensions.text} text-emerald-800 ml-1.5 relative inline-flex items-center`}>
            Her
            <span className="relative inline-flex items-center justify-center">
              o
              <svg
                viewBox="0 0 24 24"
                className="w-2.5 h-2.5 fill-white stroke-none absolute"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -45%)' }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            es
          </span>
        </div>
        {showTagline && (
          <div className={`mt-1 font-bold ${dimensions.sub} tracking-[0.25em] text-slate-500 uppercase flex items-center justify-center gap-1.5`}>
            <span>PLAY</span>
            <span className="text-amber-500">•</span>
            <span>GIVE</span>
            <span className="text-amber-500">•</span>
            <span>CREATE IMPACT</span>
          </div>
        )}
      </div>
    );
  }

  // Default: horizontal layout (ideal for navbar)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <EmblemSVG sizePx={dimensions.emblem} />
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-baseline tracking-tight">
          <span className={`font-display font-black ${dimensions.text} text-slate-900`}>
            Digital
          </span>
          <span className={`font-display font-black ${dimensions.text} text-emerald-800 ml-1 relative inline-flex items-center`}>
            Her
            <span className="relative inline-flex items-center justify-center">
              o
              <svg
                viewBox="0 0 24 24"
                className="w-2 h-2 fill-white stroke-none absolute"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -45%)' }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            es
          </span>
        </div>
        {showTagline && size !== 'xs' && (
          <div className="mt-0.5 font-bold text-[8.5px] tracking-[0.18em] text-slate-500 uppercase flex items-center gap-1 whitespace-nowrap">
            <span>PLAY</span>
            <span className="text-amber-500 text-[9px]">•</span>
            <span>GIVE</span>
            <span className="text-amber-500 text-[9px]">•</span>
            <span>CREATE IMPACT</span>
          </div>
        )}
      </div>
    </div>
  );
};
