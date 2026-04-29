import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { generateMonthlyPDF } from '@/lib/pdfExport';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { FileText, Table, Download, ChevronLeft, ChevronRight, Loader2, Sparkles, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { toast } from 'sonner';

type Tx = {
  date: string; description: string; amount: number;
  type: string; category: string; origin: string;
};

export function ExportPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const targetDate = subMonths(new Date(), monthOffset);
  const period = format(targetDate, "MMMM 'de' yyyy", { locale: ptBR });
  const periodCapitalized = period.charAt(0).toUpperCase() + period.slice(1);

  useEffect(() => {
    if (!user) return;
    const date = subMonths(new Date(), monthOffset);
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    setLoading(true);
    supabase.from('transactions').select('date,description,amount,type,category,origin')
      .eq('user_id', user.id).gte('date', start).lte('date', end).is('deleted_at', null)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setTxs((data || []) as Tx[]);
        setLoading(false);
      });
  }, [user, monthOffset]);

  const totals = useMemo(() => {
    const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { inc, exp, net: inc - exp };
  }, [txs]);

  const handlePDF = async () => {
    if (txs.length === 0) {
      toast.error('Nenhum lançamento neste período');
      return;
    }
    setGenerating(true);
    try {
      generateMonthlyPDF({
        transactions: txs,
        userName: profile?.full_name || 'Usuário',
        period: periodCapitalized,
        currency: 'R$',
      });
      toast.success('PDF gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar PDF');
    }
    setGenerating(false);
  };

  const handleCSV = () => {
    if (txs.length === 0) {
      toast.error('Nenhum lançamento neste período');
      return;
    }
    const header = "Data,Descrição,Valor,Tipo,Origem,Categoria\n";
    const rows = txs.map(t =>
      `${t.date},"${t.description}",${t.amount},${t.type === 'income' ? 'Receita' : 'Despesa'},${t.origin === 'business' ? 'Negócio' : 'Pessoal'},"${t.category}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kora-lancamentos-${format(targetDate, 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  const handleJSON = () => {
    const blob = new Blob([JSON.stringify(txs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kora-backup-${format(targetDate, 'yyyy-MM')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exportado!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Header — gradiente roxo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--color-green-600) 0%, var(--color-green-500) 50%, var(--color-green-700) 100%)',
          boxShadow: '0 20px 40px -12px hsl(262 83% 58% / 0.35)',
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-8 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, white, transparent 70%)' }} />

        <div className="relative flex items-center justify-between">
          <button
            onClick={() => setMonthOffset(prev => prev + 1)}
            className="flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white' }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.9)' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Período
              </p>
            </div>
            <p className="text-xl font-black text-white">{periodCapitalized}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {loading ? 'Carregando…' : `${txs.length} ${txs.length === 1 ? 'lançamento' : 'lançamentos'}`}
            </p>
          </div>

          <button
            onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
            disabled={monthOffset === 0}
            className="flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white' }}
          >
            <ChevronRight style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Receitas', value: totals.inc, Icon: TrendingUp, color: 'var(--color-success-solid)', bg: 'var(--color-success-bg)' },
          { label: 'Despesas', value: totals.exp, Icon: TrendingDown, color: 'var(--color-danger-solid)', bg: 'var(--color-danger-bg)' },
          { label: 'Saldo', value: totals.net, Icon: Wallet, color: totals.net >= 0 ? 'var(--color-success-solid)' : 'var(--color-danger-solid)', bg: totals.net >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="relative p-4 rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-weak)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="flex items-center justify-center mb-2"
              style={{ width: 32, height: 32, borderRadius: 10, background: bg }}
            >
              <Icon style={{ width: 16, height: 16, color }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>
              {label}
            </p>
            <p className="text-base font-black mt-0.5 tabular-nums" style={{ color }}>
              {loading ? '—' : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Export Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* PDF — destaque com gradiente roxo */}
        <button
          onClick={handlePDF}
          disabled={generating || loading}
          className="group relative overflow-hidden p-5 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-green-600) 0%, var(--color-green-500) 100%)',
            boxShadow: '0 12px 28px -10px hsl(262 83% 58% / 0.45)',
            color: 'white',
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-125" style={{ background: 'radial-gradient(circle, white, transparent 70%)' }} />
          <div
            className="relative flex items-center justify-center mb-3"
            style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}
          >
            {generating ? (
              <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: 'white' }} />
            ) : (
              <FileText style={{ width: 24, height: 24, color: 'white' }} />
            )}
          </div>
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.22)' }}>
                Recomendado
              </span>
            </div>
            <p className="font-black text-base">Relatório PDF</p>
            <p className="text-[12px] mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.88)' }}>
              Resumo visual com gráficos, categorias e todos os lançamentos
            </p>
          </div>
        </button>

        {/* CSV */}
        <button
          onClick={handleCSV}
          disabled={loading}
          className="group relative overflow-hidden p-5 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1.5px solid var(--color-border-base)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--color-green-100) 0%, var(--color-green-200) 100%)',
            }}
          >
            <Table style={{ width: 24, height: 24, color: 'var(--color-green-700)' }} />
          </div>
          <p className="font-black text-base" style={{ color: 'var(--color-text-strong)' }}>
            Planilha CSV
          </p>
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-text-subtle)' }}>
            Abra no Excel ou Google Sheets
          </p>
        </button>

        {/* JSON */}
        <button
          onClick={handleJSON}
          disabled={loading}
          className="group relative overflow-hidden p-5 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1.5px solid var(--color-border-base)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--color-info-bg) 0%, color-mix(in srgb, var(--color-info-solid) 25%, transparent) 100%)',
            }}
          >
            <Download style={{ width: 24, height: 24, color: 'var(--color-info-solid)' }} />
          </div>
          <p className="font-black text-base" style={{ color: 'var(--color-text-strong)' }}>
            Backup JSON
          </p>
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-text-subtle)' }}>
            Dados brutos para backup completo
          </p>
        </button>
      </motion.div>
    </div>
  );
}
