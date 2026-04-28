import { useMemo, lazy, Suspense } from "react";
import { Transaction, Investment } from "@/types/findash";
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

const BarChartCard = lazy(() => import("../charts/BarChartCard"));
const PieChartCard = lazy(() => import("../charts/PieChartCard"));

interface Props {
  filteredTx: Transaction[];
  investments: Investment[];
  currency: string;
  rangeStart: Date;
  rangeEnd: Date;
}

const TOP_N = 6;

function topNWithOthers(entries: { name: string; value: number }[]) {
  if (entries.length <= TOP_N) return entries;
  const top = entries.slice(0, TOP_N - 1);
  const rest = entries.slice(TOP_N - 1).reduce((s, e) => s + e.value, 0);
  return rest > 0 ? [...top, { name: "Outros", value: rest }] : top;
}

function ChartSkeleton() {
  return (
    <div style={{ background: '#fff', border: '1px solid #F0EEF8', borderRadius: 20, padding: 18 }}>
      <div className="h-5 w-40 rounded bg-[var(--color-bg-subtle,#f3f4f6)] animate-pulse mb-4" />
      <div className="h-[220px] rounded bg-[var(--color-bg-subtle,#f3f4f6)] animate-pulse" />
    </div>
  );
}

function fmtCur(v: number, c: string) {
  return `${c} ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ChartsTab({ filteredTx, currency, rangeStart, rangeEnd }: Props) {
  const { dailyData, catData, incCatData, originData, totals } = useMemo(() => {
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    const dayMap = new Map<string, { receitas: number; despesas: number }>();
    for (const d of days) dayMap.set(format(d, "yyyy-MM-dd"), { receitas: 0, despesas: 0 });

    const expenseCats: Record<string, number> = {};
    const incomeCats: Record<string, number> = {};
    let bizSum = 0, personalSum = 0;
    let totalRec = 0, totalDesp = 0;

    for (const t of filteredTx) {
      const isIncome = t.type === 'income';
      const v = t.val;
      if (isIncome) totalRec += v; else totalDesp += v;

      const slot = dayMap.get(t.date);
      if (slot) { if (isIncome) slot.receitas += v; else slot.despesas += v; }

      if (isIncome) incomeCats[t.cat] = (incomeCats[t.cat] || 0) + v;
      else expenseCats[t.cat] = (expenseCats[t.cat] || 0) + v;

      const signed = isIncome ? v : -v;
      if (t.origin === 'business') bizSum += signed;
      else if (t.origin === 'personal') personalSum += signed;
    }

    const dailyData = Array.from(dayMap.entries())
      .filter(([, v]) => v.receitas > 0 || v.despesas > 0)
      .map(([k, v]) => ({
        date: format(new Date(k + 'T00:00:00'), "dd/MM", { locale: ptBR }),
        receitas: v.receitas,
        despesas: v.despesas,
      }));

    const catData = topNWithOthers(
      Object.entries(expenseCats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    );
    const incCatData = topNWithOthers(
      Object.entries(incomeCats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    );
    const originData = [
      { name: 'Negócio', value: Math.abs(bizSum) },
      { name: 'Pessoal', value: Math.abs(personalSum) },
    ].filter(d => d.value > 0);

    return { dailyData, catData, incCatData, originData, totals: { rec: totalRec, desp: totalDesp, saldo: totalRec - totalDesp } };
  }, [filteredTx, rangeStart, rangeEnd]);

  const periodLabel = `${format(rangeStart, "dd 'de' MMM", { locale: ptBR })} — ${format(rangeEnd, "dd 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="space-y-4">
      {/* HERO — Saldo do período */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
        style={{
          borderRadius: 22,
          padding: '20px 18px 22px',
          background: 'radial-gradient(120% 80% at 0% 0%, rgba(124,58,237,0.4) 0%, rgba(124,58,237,0) 55%), linear-gradient(160deg, #1E0B4D 0%, #2E1065 50%, #3B1397 100%)',
          boxShadow: '0 14px 32px -16px rgba(30,11,77,0.55), 0 2px 8px -2px rgba(30,11,77,0.35)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 99, backdropFilter: 'blur(8px)' }}
            >
              <Wallet size={11} /> Saldo do período
            </span>
            <p
              className="font-black mt-3 leading-none tracking-tight"
              style={{ fontSize: 'clamp(30px, 8.5vw, 40px)', color: '#fff' }}
            >
              {fmtCur(totals.saldo, currency)}
            </p>
            <p className="mt-2 text-[11.5px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {periodLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 14, padding: '10px 12px',
          }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={11} style={{ color: '#A78BFA' }} />
              <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.78)' }}>Receitas</p>
            </div>
            <p className="font-black leading-none" style={{ fontSize: 16, color: '#fff' }}>{fmtCur(totals.rec, currency)}</p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 14, padding: '10px 12px',
          }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={11} style={{ color: '#FBA5C5' }} />
              <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.78)' }}>Despesas</p>
            </div>
            <p className="font-black leading-none" style={{ fontSize: 16, color: '#fff' }}>{fmtCur(totals.desp, currency)}</p>
          </div>
        </div>
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <BarChartCard title="Receitas vs Despesas" data={dailyData} currency={currency} />
          </Suspense>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <PieChartCard title="Despesas por Categoria" data={catData} currency={currency} />
          </Suspense>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Suspense fallback={<ChartSkeleton />}>
            <PieChartCard title="Receitas por Categoria" data={incCatData} currency={currency} />
          </Suspense>
        </motion.div>

        {originData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Suspense fallback={<ChartSkeleton />}>
              <PieChartCard title="Negócio vs Pessoal" data={originData} currency={currency} colors={['#7C3AED', '#F59E0B']} />
            </Suspense>
          </motion.div>
        )}
      </div>
    </div>
  );
}
