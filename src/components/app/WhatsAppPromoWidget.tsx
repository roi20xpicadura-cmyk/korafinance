import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

export default function WhatsAppPromoWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.functions.invoke('whatsapp-verify', {
      body: { userId: user.id, action: 'status' },
    }).then(({ data }) => {
      setConnected(!!data?.connection);
    }).catch(() => setConnected(false));
  }, [user]);

  if (connected === null || connected) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      onClick={() => navigate('/app/settings')}
      className="group relative w-full overflow-hidden rounded-2xl transition-all active:scale-[0.985]"
      style={{
        background:
          'linear-gradient(135deg, var(--color-green-50) 0%, var(--color-bg-surface) 60%, var(--color-bg-surface) 100%)',
        border: '1px solid var(--color-green-200, var(--color-border-base))',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Glow accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--color-green-200) 0%, transparent 70%)' }}
      />

      <div className="relative flex items-center gap-3 p-3.5">
        {/* WhatsApp icon */}
        <div
          className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background:
              'linear-gradient(135deg, var(--color-green-500), var(--color-green-700))',
            boxShadow: '0 4px 12px -2px var(--color-green-500-alpha-30, rgba(16,185,129,0.35))',
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className="truncate text-[13.5px] font-bold leading-tight"
              style={{ color: 'var(--color-text-strong, var(--color-text-base))' }}
            >
              Registre gastos pelo WhatsApp
            </p>
            <span
              className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                background: 'var(--color-green-100, var(--color-success-bg))',
                color: 'var(--color-green-700, var(--color-success-text))',
              }}
            >
              <Zap size={9} strokeWidth={3} /> Novo
            </span>
          </div>
          <p
            className="mt-0.5 truncate text-[11.5px]"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            <span style={{ fontStyle: 'italic' }}>"gastei 50 no mercado"</span> → registrado na hora
          </p>
        </div>

        {/* CTA */}
        <div
          className="flex flex-shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[11.5px] font-bold transition-transform group-hover:translate-x-0.5"
          style={{
            background:
              'linear-gradient(135deg, var(--color-green-600), var(--color-green-700))',
            color: 'white',
            boxShadow: '0 2px 8px -2px var(--color-green-700-alpha-40, rgba(5,150,105,0.4))',
          }}
        >
          Conectar <ArrowRight size={12} strokeWidth={3} />
        </div>
      </div>
    </motion.button>
  );
}
