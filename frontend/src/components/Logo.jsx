import React from 'react';

export default function Logo({ size = 'default', showSubtitle = false, className = '' }) {
  const sizes = {
    small: { width: 120, height: 36, iconSize: 24, textSize: 18, subtitleSize: 6 },
    default: { width: 160, height: 48, iconSize: 32, textSize: 24, subtitleSize: 7 },
    large: { width: 240, height: 72, iconSize: 48, textSize: 36, subtitleSize: 10 },
    full: { width: 320, height: 96, iconSize: 64, textSize: 48, subtitleSize: 12 },
  };

  const s = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={s.iconSize}
        height={s.iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Building/School Icon */}
        <rect x="8" y="28" width="48" height="32" rx="4" fill="#2196F3" />
        <rect x="16" y="36" width="10" height="10" rx="2" fill="white" />
        <rect x="30" y="36" width="10" height="10" rx="2" fill="white" />
        <rect x="44" y="36" width="8" height="10" rx="2" fill="white" />
        <rect x="16" y="50" width="10" height="8" rx="1" fill="white" />
        <rect x="30" y="50" width="10" height="8" rx="1" fill="white" />
        <rect x="44" y="50" width="8" height="8" rx="1" fill="white" />
        {/* Roof */}
        <path d="M4 28L32 8L60 28H4Z" fill="#0D47A1" />
        {/* Flag */}
        <rect x="52" y="4" width="4" height="16" rx="1" fill="#0D47A1" />
        <rect x="56" y="4" width="8" height="5" rx="1" fill="#F44336" />
      </svg>
      <div className="flex flex-col">
        <span
          style={{ fontSize: s.textSize, fontWeight: 800, lineHeight: 1 }}
          className="text-[#2196F3] tracking-tight"
        >
          Educa Mais<span className="text-[#F44336]">+</span> Angola
        </span>
        {showSubtitle && (
          <span
            style={{ fontSize: s.subtitleSize, lineHeight: 1.2 }}
            className="text-[#0D47A1] font-medium tracking-wide uppercase"
          >
            Sistema Integrado de Monitorização Escolar
          </span>
        )}
      </div>
    </div>
  );
}

export function LogoIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="8" y="28" width="48" height="32" rx="4" fill="#2196F3" />
      <rect x="16" y="36" width="10" height="10" rx="2" fill="white" />
      <rect x="30" y="36" width="10" height="10" rx="2" fill="white" />
      <rect x="44" y="36" width="8" height="10" rx="2" fill="white" />
      <rect x="16" y="50" width="10" height="8" rx="1" fill="white" />
      <rect x="30" y="50" width="10" height="8" rx="1" fill="white" />
      <rect x="44" y="50" width="8" height="8" rx="1" fill="white" />
      <path d="M4 28L32 8L60 28H4Z" fill="#0D47A1" />
      <rect x="52" y="4" width="4" height="16" rx="1" fill="#0D47A1" />
      <rect x="56" y="4" width="8" height="5" rx="1" fill="#F44336" />
    </svg>
  );
}

export function LogoImage({ size = 'default', className = '' }) {
  const sizes = {
    small: 36,
    default: 44,
    large: 64,
    full: 80,
  };
  const h = sizes[size] || sizes.default;

  return <img src="/Logotipo.png" alt="SIME - Sistema Integrado de Monitorização Escolar" style={{ height: h, width: 'auto' }} className={`object-contain ${className}`} />;
}

export function LogoImageIcon({ size = 32, className = '' }) {
  return <img src="/favicon/android-chrome-192x192.png" alt="SIME" style={{ height: size, width: size }} className={`object-contain rounded-lg ${className}`} />;
}

export function LogoWhite({ size = 'default', className = '' }) {
  const sizes = {
    small: { iconSize: 24, textSize: 18 },
    default: { iconSize: 32, textSize: 24 },
    large: { iconSize: 48, textSize: 36 },
  };

  const s = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={s.iconSize}
        height={s.iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="28" width="48" height="32" rx="4" fill="white" fillOpacity="0.2" />
        <rect x="16" y="36" width="10" height="10" rx="2" fill="white" fillOpacity="0.4" />
        <rect x="30" y="36" width="10" height="10" rx="2" fill="white" fillOpacity="0.4" />
        <rect x="44" y="36" width="8" height="10" rx="2" fill="white" fillOpacity="0.4" />
        <rect x="16" y="50" width="10" height="8" rx="1" fill="white" fillOpacity="0.4" />
        <rect x="30" y="50" width="10" height="8" rx="1" fill="white" fillOpacity="0.4" />
        <rect x="44" y="50" width="8" height="8" rx="1" fill="white" fillOpacity="0.4" />
        <path d="M4 28L32 8L60 28H4Z" fill="white" fillOpacity="0.3" />
        <rect x="52" y="4" width="4" height="16" rx="1" fill="white" fillOpacity="0.3" />
        <rect x="56" y="4" width="8" height="5" rx="1" fill="#F44336" />
      </svg>
      <span
        style={{ fontSize: s.textSize, fontWeight: 800, lineHeight: 1 }}
        className="text-white tracking-tight"
      >
        Educa Mais<span className="text-[#F44336]">+</span> Angola
      </span>
    </div>
  );
}
