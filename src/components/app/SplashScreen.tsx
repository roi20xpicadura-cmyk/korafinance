import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import koraIcon from '@/assets/korafinance-icon.png';

const SplashScreen = forwardRef<HTMLDivElement>(function SplashScreen(_, ref) {
  const reduceMotion = useReducedMotion();
  const deviceMemory = typeof navigator !== 'undefined'
    ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8)
    : 8;
  const performanceMode = reduceMotion || deviceMemory <= 4;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden isolate"
      role="status"
      aria-live="polite"
      style={{
        background:
          'radial-gradient(ellipse at 50% 24%, hsl(var(--primary) / 0.13), transparent 42%), linear-gradient(180deg, var(--color-bg-elevated, hsl(var(--background))) 0%, var(--color-bg-base, hsl(var(--background))) 56%, var(--color-bg-sunken, hsl(var(--secondary))) 100%)',
        transform: 'translateZ(0)',
      }}
    >
      {!performanceMode && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.18), transparent 64%)',
            willChange: 'opacity, transform',
          }}
          animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.03, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
        style={{ gap: 18 }}
      >
        <div className="relative flex items-center justify-center" style={{ width: 116, height: 116 }}>
          <motion.span
            aria-hidden
            className="absolute"
            style={{
              inset: 14,
              borderRadius: 30,
              border: '1px solid hsl(var(--primary) / 0.20)',
              boxShadow: '0 0 0 9px hsl(var(--primary) / 0.045), 0 22px 64px hsl(var(--primary) / 0.22)',
              willChange: performanceMode ? undefined : 'transform, opacity',
            }}
            animate={performanceMode ? undefined : { scale: [0.98, 1.06, 0.98], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            background: 'linear-gradient(135deg, var(--color-green-500), var(--color-green-700))',
            boxShadow: '0 20px 54px hsl(var(--primary) / 0.28), 0 0 0 1px hsl(var(--primary-foreground) / 0.16), inset 0 1px 0 hsl(var(--primary-foreground) / 0.22)',
          }}
        >
          <img
            src={koraIcon}
            alt=""
            draggable={false}
            decoding="sync"
            loading="eager"
            width={84}
            height={84}
            style={{ width: 84, height: 84, objectFit: 'cover' }}
          />
        </motion.div>
        </div>

        <div className="flex items-center" style={{ gap: 4 }}>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text-strong)' }}
          >
            Kora
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-green-600)' }}
          >
            Finance
          </motion.span>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ fontSize: 13, color: 'var(--color-text-subtle)', fontWeight: 500 }}
        >
          Controle total das suas finanças
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute flex"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 20px) + 48px)', gap: 6 }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={reduceMotion ? { opacity: 0.65 } : { scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-green-500)',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
});

export default SplashScreen;
