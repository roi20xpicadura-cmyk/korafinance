import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { COLORS, fmt } from "./_shared";

interface Props {
  title: string;
  data: { name: string; value: number }[];
  currency: string;
  colors?: string[];
}

function PieChartCard({ title, data, currency, colors = COLORS }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const top = data[0];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0EEF8',
        borderRadius: 20,
        padding: 18,
        boxShadow: '0 4px 20px -8px rgba(124,58,237,0.12), 0 2px 6px -2px rgba(0,0,0,0.04)',
      }}
    >
      <h3 className="font-bold text-[15px] mb-4" style={{ color: '#1A0D35' }}>{title}</h3>

      <div className="flex items-center gap-4">
        {/* Donut com label central */}
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={68}
                innerRadius={48}
                dataKey="value"
                paddingAngle={data.length > 1 ? 3 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Total</span>
            <span className="font-black text-[15px] leading-none mt-1" style={{ color: '#1A0D35' }}>
              {currency} {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Legend list com barra de % */}
        <div className="flex-1 min-w-0 space-y-2">
          {data.slice(0, 5).map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            const color = colors[i % colors.length];
            return (
              <div key={d.name} className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="inline-block flex-shrink-0" style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
                    <span className="text-[11.5px] font-semibold truncate" style={{ color: '#1A0D35' }}>{d.name}</span>
                  </div>
                  <span className="text-[11px] font-bold tabular-nums flex-shrink-0" style={{ color: '#6B7280' }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Sem dados</p>
          )}
        </div>
      </div>

      {/* Maior categoria em destaque */}
      {top && total > 0 && (
        <div
          className="mt-4 pt-3 flex items-center justify-between text-[11.5px]"
          style={{ borderTop: '1px dashed #F0EEF8' }}
        >
          <span style={{ color: '#6B7280' }}>Maior: <strong style={{ color: '#1A0D35' }}>{top.name}</strong></span>
          <span className="font-bold" style={{ color: colors[0] }}>{fmt(top.value, currency)}</span>
        </div>
      )}
    </div>
  );
}

export default memo(PieChartCard);
