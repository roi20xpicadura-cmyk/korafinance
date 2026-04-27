import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Bell,
  Search,
  Plus,
} from 'lucide-react';
import { demoStore } from './demoStore';
import koraIcon from '@/assets/korafinance-icon.png';
import DemoOverview from './screens/DemoOverview';
import DemoTransactions from './screens/DemoTransactions';
import DemoGoals from './screens/DemoGoals';
import DemoCards from './screens/DemoCards';
import DemoInvestments from './screens/DemoInvestments';
import DemoDRE from './screens/DemoDRE';

const TABS = [
  { key: 'overview',     label: 'Visão Geral',    icon: LayoutDashboard },
  { key: 'transactions', label: 'Lançamentos',    icon: ArrowLeftRight },
  { key: 'goals',        label: 'Metas',          icon: Target },
  { key: 'cards',        label: 'Cartões',        icon: CreditCard },
  { key: 'investments',  label: 'Investimentos',  icon: TrendingUp },
  { key: 'dre',          label: 'DRE',            icon: FileText },
] as const;

const TAB_TITLES: Record<string, string> = {
  overview: 'Visão Geral',
  transactions: 'Lançamentos',
  goals: 'Metas',
  cards: 'Cartões de Crédito',
  investments: 'Investimentos',
  dre: 'DRE',
  charts: 'Gráficos',
};

type TabKey = typeof TABS[number]['key'] | 'charts';

export default function LiveDemoSection() {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-white via-[#FAFAFE] to-white">
      {/* Background flair */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] text-[11px] md:text-[12px] font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" /> demo interativa · sem cadastro
          </div>
          <h2 className="text-[28px] md:text-[44px] leading-[1.05] font-[900] text-[#1A0D35] tracking-tight">
            O app de verdade.
            <span className="block bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent">
              Roda aqui na página.
            </span>
          </h2>
          <p className="mt-3 md:mt-4 text-[14px] md:text-[16px] text-[#4A3A6B] max-w-2xl mx-auto">
            Clique, navegue, lance uma transação, crie uma meta. Tudo em tempo real, com dados de exemplo. Quando criar sua conta, é assim — só que com seu dinheiro de verdade.
          </p>
        </div>

        {/* Browser frame */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[24px] overflow-hidden bg-white border border-[rgba(124,58,237,0.15)]"
          style={{ boxShadow: '0 30px 80px -20px rgba(76, 29, 149, 0.35), 0 8px 30px -6px rgba(124,58,237,0.12)' }}
        >
          {/* Browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FAFAFE] border-b border-[rgba(124,58,237,0.10)]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 mx-3 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[rgba(124,58,237,0.10)]">
              <span className="w-3 h-3 rounded-full bg-[#16A34A] flex-shrink-0" />
              <span className="text-[11px] font-mono text-[#4A3A6B] truncate">app.korafinance.app/<span className="text-[#7C3AED] font-bold">{tab}</span></span>
            </div>
            <button
              onClick={() => demoStore.reset()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#7B6A9B] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors"
              title="Resetar demo"
            >
              <RefreshCw className="w-3 h-3" /> resetar
            </button>
          </div>

          {/* App body — replica fiel do AppLayout */}
          <div
            className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[640px] md:min-h-[720px]"
            style={{ background: 'var(--color-bg-base)' }}
          >
            {/* Sidebar (desktop) — espelha AppLayout real */}
            <aside
              className="hidden md:flex flex-col"
              style={{
                background: 'var(--color-bg-surface)',
                borderRight: '0.5px solid var(--color-border-weak)',
                padding: '16px 12px',
              }}
            >
              <div className="flex items-center gap-2 px-2 mb-4">
                <img src={koraIcon} alt="" className="w-8 h-8 rounded-lg" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.3px' }}>KoraFinance</div>
                  <div style={{ fontSize: 9.5, color: 'var(--color-text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    demo interativa
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 8px 8px', fontSize: 10, fontWeight: 800, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Menu principal
              </div>
              <nav className="space-y-0.5 flex-1">
                {TABS.map((t) => {
                  const active = tab === t.key || (t.key === 'overview' && tab === 'charts');
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className="w-full flex items-center gap-2.5"
                      style={{
                        padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        background: active ? 'var(--color-bg-sunken)' : 'transparent',
                        color: active ? 'var(--color-green-600)' : 'var(--color-text-muted)',
                        position: 'relative',
                      }}
                    >
                      {active && (
                        <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--color-green-600)', borderRadius: 99 }} />
                      )}
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div
                className="rounded-xl p-3 mt-3 text-white"
                style={{ background: 'linear-gradient(135deg, #1A0D35 0%, #4C1D95 100%)' }}
              >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                  curtindo?
                </div>
                <p style={{ fontSize: 11.5, lineHeight: 1.35, marginBottom: 10 }}>
                  Crie sua conta grátis e conecte seus bancos via Open Finance.
                </p>
                <Link
                  to="/register"
                  className="block w-full text-center py-1.5 rounded-lg"
                  style={{ background: 'white', color: '#1A0D35', fontSize: 11, fontWeight: 800 }}
                >
                  Começar grátis →
                </Link>
              </div>
            </aside>

            {/* Right column = header + (mobile tabs) + content */}
            <div className="flex flex-col min-w-0">
              {/* App header — espelha o header do AppLayout */}
              <div
                className="hidden md:flex items-center justify-between px-5 h-[52px] flex-shrink-0"
                style={{
                  background: 'var(--color-bg-surface)',
                  borderBottom: '0.5px solid var(--color-border-weak)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.3px' }}>
                  {TAB_TITLES[tab] ?? 'Visão Geral'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    style={{
                      width: 32, height: 32, borderRadius: 9, background: 'var(--color-bg-sunken)',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                  <button
                    style={{
                      width: 32, height: 32, borderRadius: 9, background: 'var(--color-bg-sunken)',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
                    }}
                  >
                    <Bell className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#ef4444', borderRadius: 99 }} />
                  </button>
                  <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border-base)' }} />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-[800]"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}
                    >
                      L
                    </div>
                    <div className="hidden lg:block">
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-strong)', lineHeight: 1.1 }}>Lucas</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', fontWeight: 600 }}>Plano Pro</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile header */}
              <div
                className="md:hidden flex items-center justify-between px-4 h-[48px] flex-shrink-0"
                style={{ background: 'var(--color-bg-surface)', borderBottom: '0.5px solid var(--color-border-weak)' }}
              >
                <div className="flex items-center gap-2">
                  <img src={koraIcon} alt="" className="w-6 h-6 rounded-md" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-strong)' }}>{TAB_TITLES[tab] ?? 'Visão Geral'}</span>
                </div>
                <button
                  style={{
                    width: 28, height: 28, borderRadius: 8, background: 'var(--color-bg-sunken)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Bell className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>

              {/* Mobile tabs */}
              <div
                className="md:hidden flex items-center gap-1 overflow-x-auto px-3 py-2 flex-shrink-0"
                style={{ background: 'var(--color-bg-surface)', borderBottom: '0.5px solid var(--color-border-weak)' }}
              >
                {TABS.map((t) => {
                  const active = tab === t.key;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className="flex items-center gap-1.5 flex-shrink-0"
                      style={{
                        padding: '6px 10px', borderRadius: 9,
                        fontSize: 11.5, fontWeight: 700,
                        background: active ? 'var(--color-green-600)' : 'transparent',
                        color: active ? 'white' : 'var(--color-text-muted)',
                        border: active ? 'none' : '0.5px solid var(--color-border-base)',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <main className="relative flex-1 overflow-hidden" style={{ background: 'var(--color-bg-base)' }}>
                <div
                  className="p-4 md:p-6 overflow-y-auto"
                  style={{ height: '100%', maxHeight: 720 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tab === 'overview' && <DemoOverview onGo={(t) => setTab(t as TabKey)} />}
                      {tab === 'transactions' && <DemoTransactions />}
                      {tab === 'goals' && <DemoGoals />}
                      {tab === 'cards' && <DemoCards />}
                      {tab === 'investments' && <DemoInvestments />}
                      {tab === 'dre' && <DemoDRE />}
                      {tab === 'charts' && <DemoOverview onGo={(t) => setTab(t as TabKey)} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Floating "+" igual ao QuickAddFAB */}
                <button
                  onClick={() => setTab('transactions')}
                  className="md:hidden absolute right-4 bottom-4 w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ background: '#7C3AED', boxShadow: '0 8px 24px rgba(124,58,237,0.45)' }}
                  aria-label="Novo lançamento"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </main>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3.5 bg-gradient-to-r from-[#F5F3FF] to-white border-t border-[rgba(124,58,237,0.10)]">
            <div className="flex items-center gap-2 text-[12px] text-[#4A3A6B]">
              <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
              <span>Dados de exemplo. <strong className="text-[#1A0D35]">Crie sua conta</strong> para conectar seus bancos via Open Finance.</span>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-[800] hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
              style={{ boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
            >
              Começar grátis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        <p className="text-center mt-4 text-[11.5px] text-[#7B6A9B]">
          Tudo o que você editar fica só no seu navegador. Recarregue para resetar.
        </p>
      </div>
    </section>
  );
}
