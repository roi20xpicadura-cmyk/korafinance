import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { detectSubscriptions, monthlyTotal, type DetectedSubscription } from '@/lib/subscriptionDetector';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, CheckCircle2, AlertCircle, Sparkles, Calendar, TrendingDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

type Status = 'active' | 'cancelled' | 'ignored';

interface Row {
  id: string;
  match_pattern: string;
  service_name: string;
  category: string | null;
  icon: string | null;
  estimated_amount: number;
  frequency: string;
  last_charge_date: string | null;
  next_expected_date: string | null;
  occurrences: number;
  status: Status;
  user_acknowledged: boolean;
  notes: string | null;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('detected_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('estimated_amount', { ascending: false });
    setRows((data as Row[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Auto-scan no primeiro carregamento se não houver nenhum registro
  useEffect(() => {
    if (!loading && rows.length === 0 && user) {
      scan(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const scan = useCallback(async (silent = false) => {
    if (!user) return;
    setScanning(true);
    try {
      // Busca últimos 12 meses de despesas
      const since = new Date();
      since.setMonth(since.getMonth() - 12);
      const { data: txs, error } = await supabase
        .from('transactions')
        .select('id, description, amount, date, category, type')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .is('deleted_at', null)
        .gte('date', since.toISOString().slice(0, 10))
        .order('date', { ascending: true })
        .limit(2000);

      if (error) throw error;

      const detected = detectSubscriptions(
        (txs || []).map(t => ({ ...t, amount: Number(t.amount) }))
      );

      // Busca existentes para diff
      const { data: existing } = await supabase
        .from('detected_subscriptions')
        .select('id, match_pattern, status')
        .eq('user_id', user.id);
      const existingMap = new Map((existing || []).map(e => [e.match_pattern, e]));

      let newCount = 0;
      const upserts: any[] = [];
      for (const d of detected) {
        const prev = existingMap.get(d.match_pattern);
        if (!prev) newCount++;
        upserts.push({
          user_id: user.id,
          match_pattern: d.match_pattern,
          service_name: d.service_name,
          category: d.category,
          icon: d.icon,
          estimated_amount: d.estimated_amount,
          frequency: d.frequency,
          last_charge_date: d.last_charge_date,
          next_expected_date: d.next_expected_date,
          occurrences: d.occurrences,
          // mantém status do usuário se já existir
          ...(prev ? {} : { status: 'active', user_acknowledged: false }),
        });
      }

      if (upserts.length) {
        const { error: upErr } = await supabase
          .from('detected_subscriptions')
          .upsert(upserts, { onConflict: 'user_id,match_pattern' });
        if (upErr) throw upErr;
      }

      await load();
      if (!silent) {
        if (newCount > 0) toast.success(`${newCount} nova${newCount > 1 ? 's' : ''} assinatura${newCount > 1 ? 's' : ''} detectada${newCount > 1 ? 's' : ''}!`);
        else toast.success('Análise concluída — nada de novo.');
      }
    } catch (e: any) {
      toast.error('Erro ao analisar: ' + (e.message || ''));
    } finally {
      setScanning(false);
    }
  }, [user, load]);

  const updateStatus = async (id: string, status: Status) => {
    const prev = rows;
    setRows(rs => rs.map(r => r.id === id ? { ...r, status, user_acknowledged: true } : r));
    const { error } = await supabase
      .from('detected_subscriptions')
      .update({ status, user_acknowledged: true })
      .eq('id', id);
    if (error) {
      setRows(prev);
      toast.error('Falha ao atualizar');
    } else {
      toast.success(status === 'cancelled' ? 'Marcada como cancelada' : status === 'active' ? 'Reativada' : 'Ignorada');
    }
  };

  const acknowledgeAll = async () => {
    if (!user) return;
    await supabase.from('detected_subscriptions').update({ user_acknowledged: true }).eq('user_id', user.id).eq('user_acknowledged', false);
    setRows(rs => rs.map(r => ({ ...r, user_acknowledged: true })));
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (search && !r.service_name.toLowerCase().includes(search.toLowerCase()) && !(r.category || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter, search]);

  const total = useMemo(() => monthlyTotal(rows), [rows]);
  const activeCount = rows.filter(r => r.status === 'active').length;
  const cancelledCount = rows.filter(r => r.status === 'cancelled').length;
  const cancelledSavings = useMemo(() =>
    monthlyTotal(rows.filter(r => r.status === 'cancelled').map(r => ({ ...r, status: 'active' }))),
    [rows]);
  const newOnes = rows.filter(r => !r.user_acknowledged && r.status === 'active');
  const yearlyTotal = total * 12;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <SEO title="Centro de Assinaturas | KoraFinance" description="Detecte, acompanhe e cancele suas assinaturas recorrentes." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--color-text-strong)' }}>
            Centro de Assinaturas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Detectamos suas cobranças recorrentes nos últimos 12 meses.
          </p>
        </div>
        <button
          onClick={() => scan(false)}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: 'var(--color-green-600)', color: 'white' }}
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Analisando…' : 'Analisar agora'}
        </button>
      </div>

      {/* Novos detectados — alerta */}
      <AnimatePresence>
        {newOnes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'var(--color-warning-bg, #fef3c7)', border: '1px solid var(--color-warning-border, #fde68a)' }}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning-solid, #d97706)' }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: 'var(--color-warning-text, #78350f)' }}>
                {newOnes.length} nova{newOnes.length > 1 ? 's' : ''} assinatura{newOnes.length > 1 ? 's' : ''} detectada{newOnes.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-warning-text, #78350f)', opacity: 0.85 }}>
                {newOnes.slice(0, 3).map(s => s.service_name).join(', ')}{newOnes.length > 3 ? '…' : ''}
              </p>
            </div>
            <button onClick={acknowledgeAll} className="text-xs font-semibold underline" style={{ color: 'var(--color-warning-text, #78350f)' }}>
              Marcar como vistas
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total mensal" value={fmt(total)} icon={<Calendar className="w-4 h-4" />} accent="green" />
        <Kpi label="No ano" value={fmt(yearlyTotal)} icon={<TrendingDown className="w-4 h-4" />} accent="amber" />
        <Kpi label="Ativas" value={String(activeCount)} icon={<CheckCircle2 className="w-4 h-4" />} accent="blue" />
        <Kpi label="Economia ao cancelar" value={fmt(cancelledSavings)} icon={<X className="w-4 h-4" />} accent={cancelledCount > 0 ? 'green' : 'gray'} sub={`${cancelledCount} cancelada${cancelledCount !== 1 ? 's' : ''}`} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'active', 'cancelled', 'ignored'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
            style={{
              background: filter === f ? 'var(--color-green-600)' : 'var(--color-bg-sunken)',
              color: filter === f ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : f === 'cancelled' ? 'Canceladas' : 'Ignoradas'}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="pl-9 pr-3 py-2 text-[13px] rounded-xl w-40 sm:w-56"
            style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-base)' }} />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border-base)' }}>
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-subtle)' }} />
          <p className="font-semibold" style={{ color: 'var(--color-text-base)' }}>
            {rows.length === 0 ? 'Nenhuma assinatura detectada ainda' : 'Nada nesse filtro'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {rows.length === 0 ? 'Adicione transações ou clique em "Analisar agora".' : 'Tente outro filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(r => (
              <motion.div key={r.id}
                layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-weak)',
                  opacity: r.status === 'active' ? 1 : 0.65,
                }}
              >
                <div className="flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-sunken)' }}>
                  {r.icon || '🔁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate" style={{ color: 'var(--color-text-strong)' }}>
                      {r.service_name}
                    </p>
                    {!r.user_acknowledged && r.status === 'active' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: '#fbbf24', color: '#78350f' }}>NOVA</span>
                    )}
                    {r.status === 'cancelled' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-sunken)', color: 'var(--color-text-muted)' }}>CANCELADA</span>
                    )}
                    {r.status === 'ignored' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-sunken)', color: 'var(--color-text-muted)' }}>IGNORADA</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {r.category} • {r.occurrences}× • {r.frequency === 'monthly' ? 'mensal' : r.frequency === 'yearly' ? 'anual' : 'semanal'}
                    {r.next_expected_date && r.status === 'active' && (
                      <> • próxima: {format(parseISO(r.next_expected_date), "dd 'de' MMM", { locale: ptBR })}</>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black" style={{ color: 'var(--color-text-strong)' }}>{fmt(r.estimated_amount)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                    /{r.frequency === 'monthly' ? 'mês' : r.frequency === 'yearly' ? 'ano' : 'sem'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {r.status === 'active' ? (
                    <>
                      <button onClick={() => updateStatus(r.id, 'cancelled')}
                        title="Marcar como cancelada"
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(r.id, 'ignored')}
                        title="Ignorar"
                        className="hidden sm:block p-2 rounded-lg transition-colors text-xs font-semibold"
                        style={{ background: 'var(--color-bg-sunken)', color: 'var(--color-text-muted)' }}>
                        Ignorar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => updateStatus(r.id, 'active')}
                      className="p-2 rounded-lg transition-colors text-xs font-semibold px-3"
                      style={{ background: 'var(--color-green-50)', color: 'var(--color-green-700)' }}>
                      Reativar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon, accent, sub }: { label: string; value: string; icon: React.ReactNode; accent: 'green' | 'amber' | 'blue' | 'gray'; sub?: string }) {
  const bg =
    accent === 'green' ? 'var(--color-green-50)' :
    accent === 'amber' ? 'var(--color-warning-bg, #fef3c7)' :
    accent === 'blue' ? '#eff6ff' :
    'var(--color-bg-sunken)';
  const fg =
    accent === 'green' ? 'var(--color-green-700)' :
    accent === 'amber' ? 'var(--color-warning-solid, #d97706)' :
    accent === 'blue' ? '#1d4ed8' :
    'var(--color-text-muted)';
  return (
    <div className="rounded-2xl p-3.5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-weak)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center" style={{ width: 26, height: 26, borderRadius: 8, background: bg, color: fg }}>{icon}</div>
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      </div>
      <p className="text-lg md:text-xl font-black" style={{ color: 'var(--color-text-strong)' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{sub}</p>}
    </div>
  );
}
