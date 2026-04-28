import { useMemo, useState } from 'react';
import { KNOWN_SERVICES } from '@/lib/subscriptionDetector';

interface Props {
  matchPattern?: string | null;
  serviceName: string;
  fallbackEmoji?: string | null;
  size?: number;
  rounded?: number;
}

// Mapa key → domain construído uma vez
const KEY_TO_DOMAIN: Record<string, string | undefined> = Object.fromEntries(
  KNOWN_SERVICES.map(s => [s.key, s.domain])
);

// Cores de fundo determinísticas (paleta neutra/violeta) para fallback
const PALETTE = [
  { bg: '#EDE9FE', fg: '#6D28D9' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FFE4E6', fg: '#BE123C' },
  { bg: '#E0E7FF', fg: '#4338CA' },
  { bg: '#CFFAFE', fg: '#0E7490' },
];

function hashIdx(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ServiceLogo({
  matchPattern,
  serviceName,
  fallbackEmoji,
  size = 48,
  rounded = 12,
}: Props) {
  const domain = useMemo(() => {
    if (!matchPattern) return null;
    const m = matchPattern.match(/^known:(.+)$/);
    if (!m) return null;
    return KEY_TO_DOMAIN[m[1]] ?? null;
  }, [matchPattern]);

  const [imgFailed, setImgFailed] = useState(false);
  const palette = PALETTE[hashIdx(serviceName, PALETTE.length)];

  // Fonte preferencial: Google s2 favicons (alta resolução, sem chave)
  const logoUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: rounded,
    background: palette.bg,
    color: palette.fg,
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0,0,0,0.04)',
  };

  if (logoUrl && !imgFailed) {
    return (
      <div style={containerStyle}>
        <img
          src={logoUrl}
          alt={serviceName}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{
            width: '70%',
            height: '70%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Fallback 1: emoji do catálogo
  if (fallbackEmoji) {
    return (
      <div style={{ ...containerStyle, fontSize: size * 0.5 }}>
        {fallbackEmoji}
      </div>
    );
  }

  // Fallback 2: iniciais coloridas
  return (
    <div style={{ ...containerStyle, fontSize: size * 0.36, fontWeight: 800, letterSpacing: '-0.02em' }}>
      {initials(serviceName)}
    </div>
  );
}
