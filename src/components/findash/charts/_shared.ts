// Paleta vibrante e harmoniosa (violeta principal + suporte)
export const COLORS = [
  '#7C3AED', // violeta primário
  '#EC4899', // rosa
  '#F59E0B', // âmbar
  '#10B981', // esmeralda
  '#3B82F6', // azul
  '#8B5CF6', // violeta claro
  '#EF4444', // vermelho
  '#06B6D4', // ciano
  '#84CC16', // verde-lima
];

export const axisStyle = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 10, fill: '#94A3B8', fontWeight: 500 as const },
};

export const tooltipStyle = {
  contentStyle: {
    background: '#1A0D35',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 12px 32px -8px rgba(26,13,53,0.4)',
    padding: '10px 14px',
    fontSize: '12.5px',
    color: '#fff',
  },
  labelStyle: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: 600 as const,
    marginBottom: '4px',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  itemStyle: { color: '#fff' },
  cursor: { fill: 'rgba(124,58,237,0.06)' },
};

export function fmt(v: number, c: string) {
  return `${c} ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtCompact(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return `${v.toFixed(0)}`;
}
