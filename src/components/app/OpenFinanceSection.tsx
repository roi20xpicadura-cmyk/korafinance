import { Landmark, Sparkles } from 'lucide-react';

/**
 * Open Finance — temporariamente desabilitado.
 * A integração com Pluggy está sendo finalizada; exibimos apenas um placeholder
 * "Em breve" até liberarmos o fluxo completo.
 */
export default function OpenFinanceSection() {
  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow decorativo */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'hsl(var(--primary) / 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Landmark style={{ width: 24, height: 24, color: 'hsl(var(--primary))' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <h3 style={{ color: 'var(--color-text-strong)', fontSize: 16, fontWeight: 800, margin: 0 }}>
              Open Finance
            </h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.5,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'hsl(var(--primary) / 0.15)',
                color: 'hsl(var(--primary))',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                textTransform: 'uppercase',
              }}
            >
              <Sparkles style={{ width: 11, height: 11 }} />
              Em breve
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            Conecte suas contas bancárias e cartões para importar transações automaticamente.
            Estamos finalizando a integração com bancos brasileiros — em breve disponível para todos.
          </p>
        </div>
      </div>
    </div>
  );
}
