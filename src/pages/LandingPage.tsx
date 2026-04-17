import { lazy, Suspense } from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import TrustStrip from '@/components/landing/TrustStrip';
import SEO from '@/components/SEO';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { PLAN_BENEFITS } from '@/lib/plans';

// Lazy-load below-the-fold sections
const MetricsSection = lazy(() => import('@/components/landing/MetricsSection'));
const FeaturesSection = lazy(() => import('@/components/landing/FeaturesSection'));
const UseCasesSection = lazy(() => import('@/components/landing/UseCasesSection'));
const HowItWorks = lazy(() => import('@/components/landing/HowItWorks'));
const ComparisonSection = lazy(() => import('@/components/landing/ComparisonSection'));
const PricingSection = lazy(() => import('@/components/landing/PricingSection'));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection'));
const SecuritySection = lazy(() => import('@/components/landing/SecuritySection'));
const FAQSection = lazy(() => import('@/components/landing/FAQSection'));
const CTASection = lazy(() => import('@/components/landing/CTASection'));
const Footer = lazy(() => import('@/components/landing/Footer'));

function SectionFallback() {
  return <div className="py-20" />;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Controle total das suas finanças — pessoal e negócio"
        description="O painel financeiro mais completo do Brasil. Controle pessoal e empresarial, DRE automático, IA financeira e conexão bancária via Open Finance. Grátis para começar."
        url="https://korafinance.com.br"
      />
      <Navbar />
      <HeroSection />
      <TrustStrip />
      <Suspense fallback={<SectionFallback />}>
        <MetricsSection />
        <FeaturesSection />
        <UseCasesSection />
        <HowItWorks />
        <ComparisonSection />
        <TestimonialsSection />
        <PricingSection />
        <SecuritySection />
        <FAQSection />
        <CTASection />
        <Footer />
      </Suspense>
    </div>
  );
}

// Reusable pricing cards component — kept here for import compatibility
export function PricingCards({ currentPlan, onUpgrade, compact }: { currentPlan?: string; onUpgrade?: (plan: string) => void; compact?: boolean }) {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: 'Free', price: 0, priceAnnual: 0, badge: null,
      features: PLAN_BENEFITS.free.items.filter(i => i.included).map(i => i.label),
      excluded: PLAN_BENEFITS.free.items.filter(i => !i.included).map(i => i.label),
      cta: 'Começar grátis', href: '/register', dark: false,
    },
    {
      name: 'Pro', price: 29, priceAnnual: 23, badge: 'Mais popular',
      features: PLAN_BENEFITS.pro.items.filter(i => i.included).map(i => i.label),
      excluded: [],
      cta: 'Assinar Pro', href: '/register', dark: false,
    },
    {
      name: 'Business', price: 79, priceAnnual: 63, badge: null,
      features: PLAN_BENEFITS.business.items.filter(i => i.included).map(i => i.label),
      excluded: [],
      cta: 'Assinar Business', href: '/register', dark: true,
    },
  ];

  return (
    <div>
      <div className={`flex items-center justify-center gap-3 ${compact ? 'mb-5' : 'mb-10'}`}>
        <span className={`text-sm font-semibold ${!annual ? 'text-foreground' : 'text-muted'}`}>Mensal</span>
        <button onClick={() => setAnnual(!annual)} className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${annual ? 'bg-[#7C3AED]' : 'bg-[#e2e8f0]'}`}>
          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm font-semibold ${annual ? 'text-foreground' : 'text-muted'}`}>Anual</span>
        {annual && <span className="text-xs font-bold text-[#854d0e] bg-[#fef9c3] px-2 py-0.5 rounded-full">Economize 20%</span>}
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-3 items-start ${compact ? 'gap-3' : 'gap-5'}`}>
        {plans.map(p => {
          const isCurrent = currentPlan === p.name.toLowerCase();
          const price = annual ? p.priceAnnual : p.price;
          const isPro = p.name === 'Pro';
          return (
            <div
              key={p.name}
              className={`relative transition-all duration-200 ${compact ? 'rounded-2xl p-4' : 'rounded-[20px] p-7'} ${
                p.dark
                  ? 'bg-[#0f172a] text-white border-[1.5px] border-[#1e293b]'
                  : isPro
                  ? `bg-white border-2 border-[#7C3AED] ${compact ? '' : 'scale-[1.02]'}`
                  : 'bg-white border-[1.5px] border-[#e2e8f0]'
              }`}
            >
              {isPro && (
                <span className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED] text-white font-extrabold ${compact ? '-top-2.5 px-3 py-0.5 text-[10px]' : '-top-3.5 px-5 py-1 text-xs'}`}>
                  Mais popular
                </span>
              )}
              <h3 className={`font-extrabold ${compact ? 'text-base' : 'text-lg'} ${p.dark ? 'text-white' : 'text-[#0f172a]'}`}>{p.name}</h3>
              <div className={compact ? 'mt-1 mb-3' : 'mt-2 mb-5'}>
                <span className={`font-black ${compact ? 'text-2xl' : 'text-3xl'} ${p.dark ? 'text-white' : isPro ? 'text-[#7C3AED]' : 'text-[#0f172a]'}`}>
                  {price === 0 ? 'Grátis' : `R$ ${price}`}
                </span>
                {price > 0 && <span className={`${compact ? 'text-xs' : 'text-sm'} text-[#94a3b8]`}>/mês</span>}
              </div>
              <ul className={compact ? 'space-y-1.5 mb-4' : 'space-y-2.5 mb-7'}>
                {p.features.map(f => (
                  <li key={f} className={`flex items-center gap-2 ${compact ? 'text-[12px] leading-[1.5]' : 'text-[13px] leading-[1.8]'}`}>
                    <div className={`rounded-full bg-[#7C3AED]/15 flex items-center justify-center flex-shrink-0 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}>
                      <Check className={compact ? 'w-2 h-2 text-[#7C3AED]' : 'w-2.5 h-2.5 text-[#7C3AED]'} />
                    </div>
                    <span className={p.dark ? 'text-[#cbd5e1]' : 'text-[#0f172a]'}>{f}</span>
                  </li>
                ))}
                {p.excluded.map(f => (
                  <li key={f} className={`flex items-center gap-2 text-[#94a3b8] line-through ${compact ? 'text-[12px]' : 'text-[13px]'}`}>{f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <div className={`w-full rounded-[9px] bg-[#F5F3FF] text-[#7C3AED] font-bold text-center ${compact ? 'py-2 text-xs' : 'py-3 text-sm'}`}>Plano atual</div>
              ) : onUpgrade ? (
                <button onClick={() => onUpgrade(p.name.toLowerCase())} className={`w-full rounded-[9px] font-extrabold transition-all duration-200 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} ${
                  p.dark ? 'bg-white text-[#0f172a] hover:bg-[#f1f5f9]' : 'bg-[#7C3AED] text-white hover:bg-[#1A0D35]'
                }`}>
                  {p.cta}
                </button>
              ) : (
                <Link to={p.href} className={`block w-full rounded-[9px] font-extrabold text-center transition-all duration-200 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} ${
                  p.dark ? 'bg-white text-[#0f172a] hover:bg-[#f1f5f9]' : 'bg-[#7C3AED] text-white hover:bg-[#1A0D35]'
                }`}>
                  {p.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
