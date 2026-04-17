import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { PLANS } from '@/lib/plans';

const PRO_BENEFITS = [
  '✅ Lançamentos ilimitados',
  '✅ Kora IA desbloqueada',
  '✅ WhatsApp IA ativo',
  '✅ Módulo de Dívidas',
  '✅ Simulador financeiro',
  '✅ Relatório mensal por e-mail',
  '✅ Notificações WhatsApp',
  '✅ Orçamentos e exportação',
];

const BUSINESS_BENEFITS = [
  '✅ Lançamentos ilimitados',
  '✅ Kora IA desbloqueada',
  '✅ WhatsApp IA ativo',
  '✅ Módulo de Dívidas',
  '✅ Simulador financeiro',
  '✅ Lançamentos Negócio (PJ)',
  '✅ DRE automático',
  '✅ Suporte prioritário',
];

export default function PlanoSucessoPage() {
  const { profile, refetch } = useProfile();
  const navigate = useNavigate();
  const plan = profile?.plan || 'free';
  const [checking, setChecking] = useState(plan === 'free');

  useEffect(() => {
    if (plan !== 'free') { setChecking(false); return; }
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      await refetch();
      if (attempts > 15) { clearInterval(interval); setChecking(false); }
    }, 2000);
    return () => clearInterval(interval);
  }, [plan, refetch]);

  if (checking && plan === 'free') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
        <div style={{
          color: 'var(--color-text-strong)', fontSize: 18, fontWeight: 800,
          marginBottom: 8, textAlign: 'center',
        }}>
          Confirmando seu pagamento...
        </div>
        <p style={{
          color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', lineHeight: 1.6,
        }}>
          Aguarde alguns segundos enquanto ativamos seu plano.
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const planInfo = plan !== 'free' ? PLANS[plan as 'pro' | 'business'] : { name: 'Pro', color: '#7C3AED' };
  const benefits = plan === 'business' ? BUSINESS_BENEFITS : PRO_BENEFITS;

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        style={{ fontSize: 64, marginBottom: 20 }}
      >
        🎉
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', width: '100%', maxWidth: 360 }}
      >
        <h1 style={{
          color: 'var(--color-text-strong)', fontSize: 26, fontWeight: 900,
          letterSpacing: '-0.5px', marginBottom: 8,
        }}>
          Plano {planInfo.name} ativado!
        </h1>
        <p style={{
          color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24,
        }}>
          Seu plano foi ativado com sucesso. Todos os benefícios já estão disponíveis!
        </p>
        <div style={{
          background: 'var(--color-bg-surface)',
          border: `1px solid ${planInfo.color}30`,
          borderRadius: 16, padding: 18, marginBottom: 24, textAlign: 'left',
        }}>
          {benefits.map(b => (
            <div key={b} style={{
              color: 'var(--color-text-strong)', fontSize: 13, padding: '4px 0', lineHeight: 1.5,
            }}>
              {b}
            </div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/app')}
          style={{
            width: '100%', height: 52, background: planInfo.color, border: 'none',
            borderRadius: 14, color: '#FFFFFF', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', boxShadow: `0 4px 20px ${planInfo.color}40`,
          }}
        >
          Começar a usar →
        </motion.button>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 12 }}>
          Você receberá um e-mail de confirmação
        </p>
      </motion.div>
    </div>
  );
}
