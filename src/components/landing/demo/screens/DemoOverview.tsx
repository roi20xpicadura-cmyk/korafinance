import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon, ChevronDown, Eye, EyeOff, TrendingUp, TrendingDown,
  Shield, Target, Flame, PiggyBank, BarChart2, PlusCircle,
} from 'lucide-react';
import {
  CATEGORY_EMOJI,
  formatBRL,
  getMonthSummary,
  useDemoStore,
} from '../demoStore';

/* Replica fiel da OverviewPage real do app — ordem, espaçamento, cores e
   tipografia copiados 1:1. Tudo em memória pra rodar no demo. */

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.06 },
});

function formatCompact(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export default function DemoOverview({ onGo }: { onGo: (tab: string) => void }) {
  const state = useDemoStore((s) => s);
  const goals = state.goals;
  const recent = state.txs.slice(0, 5);
  const summary = getMonthSummary(state);
  const heroBalance = summary.balance;
  const heroIncome = summary.income;
  const heroExpense = summary.expenses;
  const [showValues, setShowValues] = useState(true);
  const score = 724;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  })();

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const periodLabel = new Date()
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());

  const statCards = [
    { label: 'Score', value: `${score}/1000`, icon: Shield, color: 'var(--color-green-600)', bg: 'var(--color-success-bg)' },
    { label: 'Metas ativas', value: `${goals.length}`, icon: Target, color: '#7c3aed', bg: 'hsl(263 90% 51% / 0.12)' },
    { label: 'Streak', value: '12 dias', icon: Flame, color: '#ea580c', bg: 'hsl(21 90% 48% / 0.12)' },
    { label: 'Economizado', value: formatBRL(Math.max(0, heroBalance)), icon: PiggyBank, color: '#0891b2', bg: 'hsl(189 94% 43% / 0.12)' },
  ];

  // Score breakdown — para imitar o cartão de Score Financeiro do app real
  const scoreCriteria = [
    { label: 'Reserva de emergência', points: 8,  max: 25 },
    { label: 'Controle de gastos',     points: 18, max: 25 },
    { label: 'Investimentos',          points: 14, max: 25 },
  ];

  return (
    <div className="space-y-3 pb-4">
      {/* 1. GREETING + PERIOD */}
      <motion.div {...stagger(0)} className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 2 }}>
            {greeting}, Lucas
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{dateLabel}</p>
        </div>
        <button
          className="flex items-center gap-1.5"
          style={{
            height: 30, padding: '0 12px', borderRadius: 99,
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-base)',
            fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
          }}
        >
          <CalendarIcon size={12} style={{ color: 'var(--color-text-subtle)' }} />
          {periodLabel}
          <ChevronDown size={11} style={{ color: 'var(--color-text-subtle)' }} />
        </button>
      </motion.div>

      {/* 2. HERO BALANCE CARD — exatamente como no app */}
      <motion.div
        {...stagger(1)}
        className="p-5 md:p-6"
        style={{
          background: '#1A0D35',
          borderRadius: 22, position: 'relative', overflow: 'hidden',
          border: '1.5px solid rgba(167, 139, 250, 0.20)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16, position: 'relative' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Saldo do mês
          </span>
          <button
            onClick={() => setShowValues(!showValues)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {showValues
              ? <Eye size={15} color="rgba(255,255,255,0.8)" />
              : <EyeOff size={15} color="rgba(255,255,255,0.8)" />}
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          {showValues ? (
            <div>
              <div className="text-[28px] md:text-[38px]" style={{ fontWeight: 900, color: 'white', letterSpacing: '-1.5px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(heroBalance)}
              </div>
              <div className="flex items-center gap-1" style={{ marginTop: 8 }}>
                {heroBalance >= 0
                  ? <TrendingUp size={13} color="#A78BFA" />
                  : <TrendingDown size={13} color="#fca5a5" />}
                <span style={{ fontSize: 13, color: heroBalance >= 0 ? '#A78BFA' : '#fca5a5', fontWeight: 600 }}>
                  vs mês anterior
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 38, fontWeight: 900, color: 'white', letterSpacing: '4px' }}>••••••</div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Receitas</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#DDD6FE', fontVariantNumeric: 'tabular-nums' }}>
              {showValues ? formatBRL(heroIncome) : '••••'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Despesas</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fca5a5', fontVariantNumeric: 'tabular-nums' }}>
              {showValues ? formatBRL(heroExpense) : '••••'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. QUICK STATS — 2x2 */}
      <div className="grid grid-cols-2 gap-2.5">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            {...stagger(i + 2)}
            style={{
              padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
              background: 'var(--color-bg-surface)', borderRadius: 16,
              border: '0.5px solid var(--color-border-weak)',
              boxShadow: '0 1px 3px rgba(109, 40, 217, 0.04)',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-strong)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                {showValues ? s.value : '••••'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 4. SCORE CARD */}
      <motion.div
        {...stagger(7)}
        style={{
          padding: '16px 20px', background: 'var(--color-bg-surface)', borderRadius: 16,
          border: '0.5px solid var(--color-border-weak)',
          boxShadow: '0 1px 3px rgba(109, 40, 217, 0.04)',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Shield size={14} color="var(--color-green-600)" /> Score Financeiro
          </div>
          <button
            onClick={() => onGo('charts')}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-600)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Detalhes →
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-wrap" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: '#7C3AED', letterSpacing: '-2px', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
              {showValues ? score : '•••'}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-mono)' }}>/1000</span>
          </div>
          <div className="inline-flex items-center gap-1" style={{ padding: '4px 10px', borderRadius: 99, background: '#7C3AED18' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C3AED' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>Bom</span>
          </div>
          <div style={{ flex: 1, minWidth: 80 }}>
            <div style={{ height: 6, background: 'var(--color-bg-sunken)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(score / 1000) * 100}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #7C3AED, #22c55e)' }}
              />
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 12, borderTop: '0.5px solid var(--color-border-weak)' }}>
          {scoreCriteria.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flex: 1, fontWeight: 500 }}>{c.label}</span>
              <div style={{ width: 80, height: 4, background: 'var(--color-bg-sunken)', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max((c.points / c.max) * 100, c.points > 0 ? 5 : 0)}%`,
                    height: '100%', borderRadius: 99,
                    background: c.points / c.max > 0.6 ? 'var(--color-green-500)' : c.points / c.max > 0.3 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 32, textAlign: 'right' }}>
                {c.points}/{c.max}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 5. CHART — placeholder simples (sem recharts pra não pesar a landing) */}
      <motion.div
        {...stagger(8)}
        style={{
          padding: '16px 20px', background: 'var(--color-bg-surface)', borderRadius: 16,
          border: '0.5px solid var(--color-border-weak)',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-base)' }}>Evolução do saldo</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Últimos 6 meses</span>
        </div>
        <MiniBalanceChart />
      </motion.div>

      {/* 6. GOALS PREVIEW */}
      <motion.div {...stagger(9)}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-strong)' }}>Minhas Metas</span>
          <button
            onClick={() => onGo('goals')}
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green-600)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todas →
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {goals.slice(0, 4).map((goal) => {
            const pct = Math.min(100, (goal.current / goal.target) * 100);
            const barColor = pct >= 75 ? '#7C3AED' : pct >= 40 ? '#f59e0b' : 'var(--color-border-base)';
            return (
              <div
                key={goal.id}
                onClick={() => onGo('goals')}
                style={{
                  flexShrink: 0, width: 155, background: 'var(--color-bg-surface)',
                  border: '0.5px solid var(--color-border-weak)', borderRadius: 14, padding: 14, cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 10, lineHeight: 1 }}>{goal.emoji}</div>
                <div
                  style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--color-text-base)',
                    marginBottom: 4, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden', minHeight: 33,
                  }}
                >
                  {goal.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 8, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                  R$ {formatCompact(goal.current)}
                  <span style={{ color: 'var(--color-text-disabled)' }}> / R$ {formatCompact(goal.target)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--color-bg-sunken)', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 99, background: barColor }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: barColor }}>{pct.toFixed(0)}%</span>
              </div>
            );
          })}
          <div
            onClick={() => onGo('goals')}
            style={{
              flexShrink: 0, width: 140, background: 'var(--color-bg-sunken)',
              border: '1.5px dashed var(--color-border-base)', borderRadius: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '20px 12px', cursor: 'pointer',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={18} color="var(--color-green-600)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center' }}>Nova meta</span>
          </div>
        </div>
      </motion.div>

      {/* 7. RECENT TRANSACTIONS */}
      <motion.div {...stagger(10)}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-strong)' }}>Lançamentos recentes</span>
          <button
            onClick={() => onGo('transactions')}
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green-600)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todos →
          </button>
        </div>
        <div
          style={{
            overflow: 'hidden', background: 'var(--color-bg-surface)',
            borderRadius: 16, border: '0.5px solid var(--color-border-weak)',
          }}
        >
          {recent.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-subtle)' }}>
              Nenhum lançamento neste período.
            </div>
          ) : (
            recent.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center gap-3"
                style={{
                  padding: '14px 16px',
                  borderBottom: i < recent.length - 1 ? '0.5px solid var(--color-border-weak)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: tx.amount > 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}
                >
                  {CATEGORY_EMOJI[tx.category] ?? '💸'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>
                    {new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {tx.category}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 15, fontWeight: 900, letterSpacing: '-0.3px',
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                    color: tx.amount > 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                  }}
                >
                  {showValues
                    ? `${tx.amount > 0 ? '+' : '-'}${formatBRL(Math.abs(tx.amount))}`
                    : '••••'}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* Mini chart inline — sem recharts pra carregar leve no demo */
function MiniBalanceChart() {
  const points = [1800, 2200, 1700, 2900, 2400, 3200];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = (v: number) => 1 - (v - min) / (max - min || 1);
  const w = 100;
  const h = 100;
  const step = w / (points.length - 1);
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${norm(p) * (h - 10) + 5}`)
    .join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const months = ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'];

  return (
    <div style={{ height: 140 }}>
      {points.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <BarChart2 className="w-8 h-8" style={{ color: 'var(--color-border-base)' }} />
          <p style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>Sem dados ainda</p>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[110px]">
            <defs>
              <linearGradient id="demoBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#demoBalanceGrad)" />
            <path d={pathD} fill="none" stroke="#7C3AED" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="flex justify-between mt-1 px-1">
            {months.map((m) => (
              <span key={m} style={{ fontSize: 10, color: 'var(--color-text-subtle)', fontWeight: 600 }}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

