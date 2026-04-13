import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/plans';
import { OBJECTIVES, SMART_TIPS } from '@/lib/objectives';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Hash, Zap,
  ArrowRight, ArrowUpRight, ArrowDownRight, Lightbulb, X as XIcon,
  PlusCircle, ReceiptText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

function useCountUp(target: number, duration = 600) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(target * ease);
      if (t < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function AnimatedCurrency({ value, currency }: { value: number; currency: string }) {
  const animated = useCountUp(value);
  return <>{formatCurrency(animated, currency)}</>;
}

function ProgressBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(pct, 100)), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  const color = pct < 30 ? 'bg-[#ef4444]' : pct < 70 ? 'bg-[#f59e0b]' : 'bg-[#16a34a]';
  return (
    <div className="h-[6px] bg-[#f1f5f9] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-800 ease-out ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const { config } = useProfile();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedTips, setDismissedTips] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_tips') || '[]'); } catch { return []; }
  });
  const currency = config?.currency || 'R$';
  const profileType = config?.profile_type || 'personal';
  const objectives = config?.financial_objectives || [];

  useEffect(() => {
    if (!user) return;
    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', start).lte('date', end).order('date', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
    ]).then(([txRes, invRes, goalRes]) => {
      setTransactions(txRes.data || []);
      setInvestments(invRes.data || []);
      setGoals(goalRes.data || []);
      setLoading(false);
    });
  }, [user]);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');
    const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = expense.reduce((s, t) => s + Number(t.amount), 0);
    const netBalance = totalIncome - totalExpense;
    const bizIncome = income.filter(t => t.origin === 'business').reduce((s, t) => s + Number(t.amount), 0);
    const bizExpense = expense.filter(t => t.origin === 'business').reduce((s, t) => s + Number(t.amount), 0);
    const personalIncome = income.filter(t => t.origin === 'personal').reduce((s, t) => s + Number(t.amount), 0);
    const personalExpense = expense.filter(t => t.origin === 'personal').reduce((s, t) => s + Number(t.amount), 0);
    const bizProfit = bizIncome - bizExpense;
    const personalBalance = personalIncome - personalExpense;
    const investTotal = investments.reduce((s, i) => s + Number(i.current_amount), 0);
    const patrimonio = investTotal + Math.max(0, netBalance);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const roiBiz = bizExpense > 0 ? (bizProfit / bizExpense) * 100 : 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const avgPerDay = netBalance / daysInMonth;
    return { totalIncome, totalExpense, netBalance, bizIncome, bizExpense, personalExpense, personalIncome, bizProfit, personalBalance, patrimonio, savingsRate, roiBiz, avgPerDay, txCount: transactions.length };
  }, [transactions, investments]);

  const dismissTip = (key: string) => {
    const next = [...dismissedTips, key];
    setDismissedTips(next);
    localStorage.setItem('dismissed_tips', JSON.stringify(next));
  };

  const activeTip = objectives.find(k => SMART_TIPS[k] && !dismissedTips.includes(k));

  if (loading) return <Skeleton />;

  const recent = transactions.slice(0, 8);

  const kpis = profileType === 'personal' ? [
    { label: 'Saldo', value: stats.netBalance, icon: TrendingUp, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
    { label: 'Total Receitas', value: stats.totalIncome, icon: DollarSign, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
    { label: 'Total Despesas', value: stats.totalExpense, icon: TrendingDown, iconBg: 'bg-[#fef2f2]', iconColor: 'text-[#ef4444]' },
    { label: 'Total Guardado', value: Math.max(0, stats.netBalance), icon: DollarSign, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
    { label: 'Metas Ativas', value: goals.filter(g => Number(g.current_amount) < Number(g.target_amount)).length, icon: Hash, iconBg: 'bg-[#f5f3ff]', iconColor: 'text-[#7c3aed]', isCount: true },
    { label: 'Taxa Poupança', value: stats.savingsRate, icon: Percent, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]', isPct: true, bar: Math.min(stats.savingsRate, 100) },
  ] : [
    { label: 'Receita', value: stats.totalIncome, icon: TrendingUp, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
    { label: 'Custos', value: stats.totalExpense, icon: TrendingDown, iconBg: 'bg-[#fef2f2]', iconColor: 'text-[#ef4444]' },
    { label: 'Lucro', value: stats.bizProfit, icon: DollarSign, iconBg: 'bg-[#f0fdf4]', iconColor: 'text-[#16a34a]' },
    { label: 'ROI', value: stats.roiBiz, icon: Percent, iconBg: 'bg-[#f5f3ff]', iconColor: 'text-[#7c3aed]', isPct: true },
    { label: 'Lançamentos', value: stats.txCount, icon: Hash, iconBg: 'bg-[#f8fafc]', iconColor: 'text-[#64748b]', isCount: true },
    { label: 'Média/Dia', value: stats.avgPerDay, icon: Zap, iconBg: 'bg-[#fffbeb]', iconColor: 'text-[#d97706]' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="space-y-5">

      {/* Smart Tip */}
      {activeTip && (
        <div className="bg-white border border-[#e2e8f0] border-l-[3px] border-l-[#16a34a] rounded-r-[10px] rounded-l-none flex items-start gap-3 px-4 py-3">
          <Lightbulb className="w-4 h-4 text-[#16a34a] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase font-bold text-[#16a34a] tracking-wide mb-0.5">Dica do dia</p>
            <p className="text-[13px] text-[#374151] leading-relaxed">{SMART_TIPS[activeTip]}</p>
          </div>
          <button onClick={() => dismissTip(activeTip)} className="text-[#cbd5e1] hover:text-[#ef4444] transition-colors flex-shrink-0">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Cards */}
      {profileType === 'both' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Negócio card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full bg-[#f0fdf4] opacity-40" />
            <div className="relative">
              <p className="text-[10px] font-extrabold tracking-widest text-[#16a34a] flex items-center gap-1.5">
                💼 NEGÓCIO
              </p>
              <p className={`text-4xl font-black tracking-tighter mt-2 ${stats.bizProfit >= 0 ? 'text-[#14532d]' : 'text-[#dc2626]'}`}>
                <AnimatedCurrency value={stats.bizProfit} currency={currency} />
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#16a34a]" />
                <span className="text-[12px] font-semibold text-[#16a34a]">vs mês anterior</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#f8faf8] rounded-[10px] p-3">
                  <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wide">Receita</p>
                  <p className="text-base font-black text-[#16a34a]">{formatCurrency(stats.bizIncome, currency)}</p>
                </div>
                <div className="bg-[#f8faf8] rounded-[10px] p-3">
                  <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wide">Despesas</p>
                  <p className="text-base font-black text-[#dc2626]">{formatCurrency(stats.bizExpense, currency)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pessoal card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full bg-[#eff6ff] opacity-40" />
            <div className="relative">
              <p className="text-[10px] font-extrabold tracking-widest text-[#2563eb] flex items-center gap-1.5">
                🏠 PESSOAL
              </p>
              <p className={`text-4xl font-black tracking-tighter mt-2 ${stats.personalBalance >= 0 ? 'text-[#14532d]' : 'text-[#dc2626]'}`}>
                <AnimatedCurrency value={stats.personalBalance} currency={currency} />
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#16a34a]" />
                <span className="text-[12px] font-semibold text-[#16a34a]">vs mês anterior</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#f8faf8] rounded-[10px] p-3">
                  <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wide">Receita</p>
                  <p className="text-base font-black text-[#16a34a]">{formatCurrency(stats.personalIncome, currency)}</p>
                </div>
                <div className="bg-[#f8faf8] rounded-[10px] p-3">
                  <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wide">Despesas</p>
                  <p className="text-base font-black text-[#dc2626]">{formatCurrency(stats.personalExpense, currency)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-[180px] h-[180px] rounded-full bg-[#f0fdf4] opacity-40" />
          <div className="relative">
            <p className="text-[10px] font-extrabold tracking-widest text-[#16a34a]">
              {profileType === 'personal' ? 'SALDO DO MÊS' : 'RESULTADO DO NEGÓCIO'}
            </p>
            <p className={`text-4xl font-black tracking-tighter mt-2 ${stats.netBalance >= 0 ? 'text-[#14532d]' : 'text-[#dc2626]'}`}>
              <AnimatedCurrency value={stats.netBalance} currency={currency} />
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'Receitas', val: stats.totalIncome, color: 'text-[#16a34a]' },
                { label: 'Despesas', val: stats.totalExpense, color: 'text-[#dc2626]' },
                { label: profileType === 'business' ? 'Receita Neg.' : 'Patrimônio', val: profileType === 'business' ? stats.bizIncome : stats.patrimonio, color: 'text-[#16a34a]' },
                { label: profileType === 'business' ? 'Gasto Neg.' : 'Poupança', val: profileType === 'business' ? stats.bizExpense : Math.max(0, stats.netBalance), color: profileType === 'business' ? 'text-[#dc2626]' : 'text-[#16a34a]' },
              ].map(s => (
                <div key={s.label} className="bg-[#f8faf8] rounded-[10px] p-3">
                  <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wide">{s.label}</p>
                  <p className={`text-base font-black ${s.color}`}>{formatCurrency(s.val, currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border-[1.5px] border-[#e2e8f0] rounded-[14px] p-[18px] transition-all duration-200 hover:border-[#86efac] hover:-translate-y-[2px] group">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wide">{k.label}</p>
              <div className={`w-8 h-8 rounded-[9px] ${k.iconBg} flex items-center justify-center`}>
                <k.icon className={`w-4 h-4 ${k.iconColor}`} />
              </div>
            </div>
            <p className="text-[22px] font-black tracking-tight mt-2.5 leading-none text-[#14532d]">
              {k.isCount ? k.value : k.isPct ? `${k.value.toFixed(1)}%` : formatCurrency(k.value, currency)}
            </p>
            {k.bar !== undefined && (
              <div className="mt-2">
                <ProgressBar pct={k.bar} delay={200 + i * 100} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-extrabold text-[#14532d]">Seus Objetivos</h3>
            <Link to="/app/goals" className="text-[12px] font-bold text-[#16a34a] hover:underline flex items-center gap-1">
              Gerenciar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {objectives.map((key, i) => {
              const obj = OBJECTIVES.find(o => o.key === key);
              if (!obj) return null;
              const goal = goals.find(g => g.objective_type === key);
              const pct = goal ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100) : 0;
              const daysLeft = goal?.deadline ? Math.max(0, differenceInDays(parseISO(goal.deadline), new Date())) : null;
              const isUrgent = obj.urgent;

              return (
                <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex-shrink-0 w-[220px] min-w-[220px] rounded-[14px] p-[18px] transition-all duration-200 hover:-translate-y-[2px] cursor-pointer ${
                    goal
                      ? `bg-white border-[1.5px] ${isUrgent ? 'border-[#fecaca]' : 'border-[#e2e8f0]'} hover:border-[#86efac]`
                      : 'bg-white border-[1.5px] border-dashed border-[#d4edda] hover:border-[#16a34a]'
                  }`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 ${isUrgent ? 'bg-[#fef2f2]' : 'bg-[#f0fdf4]'}`}>
                      {obj.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold text-[#14532d] truncate">{obj.label}</p>
                      {isUrgent && (
                        <span className="inline-block mt-0.5 text-[9px] font-extrabold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] px-[7px] py-[2px] rounded-[5px]">
                          Urgente
                        </span>
                      )}
                    </div>
                  </div>

                  {goal ? (
                    <div className="mt-3">
                      <ProgressBar pct={pct} delay={300 + i * 100} />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[13px] font-extrabold text-[#16a34a]">{formatCurrency(Number(goal.current_amount), currency)}</span>
                        <span className="text-[12px] font-bold text-[#94a3b8]">{pct.toFixed(0)}%</span>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        {pct >= 100 ? '✓ Meta atingida!' : daysLeft !== null ? `${daysLeft} dias restantes` : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center mt-4">
                      <PlusCircle className="w-6 h-6 text-[#cbd5e1]" />
                      <Link to="/app/goals" className="text-[12px] font-bold text-[#16a34a] mt-2 hover:underline">
                        Criar meta
                      </Link>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white border-[1.5px] border-[#e2e8f0] rounded-[14px] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-[#f8fafc]">
          <h3 className="text-[15px] font-extrabold text-[#14532d]">Lançamentos Recentes</h3>
          <Link to="/app/transactions" className="text-[12px] font-bold text-[#16a34a] hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <ReceiptText className="w-10 h-10 text-[#e2e8f0] mb-3" />
            <p className="text-[15px] font-bold text-[#374151]">Nenhum lançamento ainda</p>
            <p className="text-[13px] text-[#94a3b8] mt-1">Adicione seu primeiro lançamento para começar.</p>
            <Link to="/app/transactions"
              className="mt-4 inline-flex items-center gap-1.5 px-[18px] py-2 border-[1.5px] border-[#16a34a] text-[#16a34a] bg-white rounded-lg text-[13px] font-bold hover:bg-[#f0fdf4] transition-colors">
              <PlusCircle className="w-4 h-4" /> Adicionar lançamento
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafcfa]">
                  <th className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wide font-bold text-[#94a3b8]">Data</th>
                  <th className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wide font-bold text-[#94a3b8]">Descrição</th>
                  <th className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wide font-bold text-[#94a3b8]">Categoria</th>
                  <th className="text-right px-5 py-2.5 text-[10px] uppercase tracking-wide font-bold text-[#94a3b8]">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(tx => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id}
                      className={`border-b border-[#f8fafc] hover:bg-[#fafffe] transition-colors border-l-[3px] ${isIncome ? 'border-l-[#16a34a]' : 'border-l-[#ef4444]'}`}>
                      <td className="px-5 py-3 text-[12px] font-medium text-[#94a3b8]">
                        {format(parseISO(tx.date), 'dd/MM', { locale: ptBR })}
                      </td>
                      <td className="px-5 py-3 text-[13px] font-bold text-[#1a2e1a]">{tx.description}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-[3px] rounded-full text-[11px] font-bold border ${
                          isIncome
                            ? 'bg-[#f0fdf4] text-[#166534] border-[#d4edda]'
                            : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right text-[14px] font-black ${isIncome ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                        {isIncome ? '+' : '−'}{formatCurrency(Number(tx.amount), currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="bg-white border-[1.5px] border-[#e2e8f0] rounded-2xl p-6 h-48 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border-[1.5px] border-[#e2e8f0] rounded-[14px] p-[18px] h-24 animate-pulse" />
        ))}
      </div>
      <div className="bg-white border-[1.5px] border-[#e2e8f0] rounded-[14px] p-5 h-64 animate-pulse" />
    </div>
  );
}
