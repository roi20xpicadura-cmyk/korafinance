import { ReactNode } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  feature: 'dre' | 'export' | 'advanced_charts' | 'budget' | 'ai_chat' | 'recurring';
  children: ReactNode;
  fallback?: ReactNode;
}

export default function UpgradeGate({ feature, children, fallback }: Props) {
  const { canDo } = usePlan();
  const navigate = useNavigate();

  if (canDo(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative" style={{ minHeight: 300 }}>
      <div style={{ filter: 'blur(3px)', opacity: 0.4, pointerEvents: 'none' }}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--color-bg-overlay)' }}>
        <div className="text-center" style={{ maxWidth: 320 }}>
          <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-green-50)', marginBottom: 16 }}>
            <Lock style={{ width: 24, height: 24, color: 'var(--color-green-400)' }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: 6 }}>Recurso exclusivo do Pro</p>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>Faça upgrade para desbloquear acesso ilimitado</p>
          <button onClick={() => navigate('/app/billing')}
            style={{ background: 'var(--color-green-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Ver planos →
          </button>
        </div>
      </div>
    </div>
  );
}
