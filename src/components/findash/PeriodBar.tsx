import { PERIODS } from "@/types/findash";
import { Config } from "@/types/findash";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PeriodBarProps {
  cfg: Config;
  setCfg: (partial: Partial<Config>) => void;
  periodLabel: string;
}

export default function PeriodBar({ cfg, setCfg, periodLabel }: PeriodBarProps) {
  const handlePeriodChange = (p: string) => {
    const now = new Date();
    let pStart = cfg.pStart;
    let pEnd = cfg.pEnd;
    switch (p) {
      case 'Dia': pStart = format(startOfDay(now), 'yyyy-MM-dd'); pEnd = format(endOfDay(now), 'yyyy-MM-dd'); break;
      case 'Semana': pStart = format(startOfWeek(now, { locale: ptBR }), 'yyyy-MM-dd'); pEnd = format(endOfWeek(now, { locale: ptBR }), 'yyyy-MM-dd'); break;
      case 'Mês': pStart = format(startOfMonth(now), 'yyyy-MM-dd'); pEnd = format(endOfMonth(now), 'yyyy-MM-dd'); break;
      case 'Trimestre': pStart = format(startOfQuarter(now), 'yyyy-MM-dd'); pEnd = format(endOfQuarter(now), 'yyyy-MM-dd'); break;
      case 'Ano': pStart = format(startOfYear(now), 'yyyy-MM-dd'); pEnd = format(endOfYear(now), 'yyyy-MM-dd'); break;
    }
    setCfg({ period: p, pStart, pEnd });
  };

  return (
    <div className="bg-surface border-b border-border/40 px-5 md:px-8 py-3 flex flex-wrap items-center gap-3">
      <span className="label-upper">Período</span>
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
              cfg.period === p
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {cfg.period === 'Personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={cfg.pStart}
            onChange={e => setCfg({ pStart: e.target.value })}
            className="px-3 py-1.5 text-[13px] rounded-lg border border-border bg-surface"
          />
          <input
            type="date"
            value={cfg.pEnd}
            onChange={e => setCfg({ pEnd: e.target.value })}
            className="px-3 py-1.5 text-[13px] rounded-lg border border-border bg-surface"
          />
        </div>
      )}
      <span className="text-[13px] font-semibold text-primary ml-auto">{periodLabel}</span>
    </div>
  );
}
