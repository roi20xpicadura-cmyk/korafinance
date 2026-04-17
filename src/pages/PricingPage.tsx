import { PricingCards } from './LandingPage';
import { Link } from 'react-router-dom';
import koraIcon from '@/assets/korafinance-icon.png';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={koraIcon} alt="KoraFinance" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-black text-foreground">KoraFinance</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-muted hover:text-foreground">Entrar</Link>
            <Link to="/register" className="px-4 py-2 rounded-[9px] bg-primary text-primary-foreground text-sm font-extrabold">Começar grátis</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-black text-fin-green-dark text-center mb-2">Planos e preços</h1>
        <p className="text-center text-muted mb-12">Escolha o plano ideal para suas necessidades</p>
        <PricingCards />
      </div>
    </div>
  );
}
