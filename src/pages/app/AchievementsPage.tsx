import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS, CATEGORIES, getNextLevelName, type Achievement } from '@/lib/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { Lock, Sparkles, Trophy, Flame, Target, Zap, ChevronRight, Award } from 'lucide-react';
import { AchievementIcon } from '@/components/achievements/AchievementIcon';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

function rarityOf(xp: number): Rarity {
  if (xp >= 500) return 'legendary';
  if (xp >= 250) return 'epic';
  if (xp >= 100) return 'rare';
  return 'common';
}

const RARITY: Record<Rarity, { label: string; grad: string; glow: string; ring: string; chip: string }> = {
  common:    { label: 'Comum',     grad: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',  glow: '0 8px 24px -8px rgba(100,116,139,0.4)',  ring: 'rgba(100,116,139,0.35)', chip: '#cbd5e1' },
  rare:      { label: 'Raro',      grad: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',  glow: '0 10px 30px -10px rgba(59,130,246,0.55)',ring: 'rgba(59,130,246,0.45)',  chip: '#bfdbfe' },
  epic:      { label: 'Épico',     grad: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)',  glow: '0 12px 36px -10px rgba(168,85,247,0.6)', ring: 'rgba(168,85,247,0.5)',   chip: '#e9d5ff' },
  legendary: { label: 'Lendário',  grad: 'linear-gradient(135deg, #f59e0b 0%, #b45309 50%, #7c2d12 100%)', glow: '0 14px 44px -10px rgba(245,158,11,0.65)', ring: 'rgba(245,158,11,0.55)', chip: '#fde68a' },
};

export default function AchievementsPage() {
  const { unlocked, progress, totalXP, level, count, total } = useAchievements();
  const [filter, setFilter] = useState<string>('todas');
  const [selected, setSelected] = useState<Achievement | null>(null);

  const filters = useMemo(() => [
    { id: 'todas', label: 'Todas', icon: Sparkles },
    { id: 'unlocked', label: 'Conquistadas', icon: Trophy },
    { id: 'locked', label: 'Em progresso', icon: Target },
    ...Object.entries(CATEGORIES).map(([id, cat]) => ({ id, label: cat.label, emoji: cat.emoji })),
  ], []);

  const filtered = useMemo(() => ACHIEVEMENTS.filter(a => {
    if (filter === 'unlocked') return unlocked.includes(a.id);
    if (filter === 'locked') return !unlocked.includes(a.id);
    if (filter === 'todas') return true;
    return a.category === filter;
  }), [filter, unlocked]);

  // featured: closest to unlock (highest progress %, not yet unlocked)
  const featured = useMemo(() => {
    const candidates = ACHIEVEMENTS
      .filter(a => !unlocked.includes(a.id) && a.progress)
      .map(a => ({ a, pct: Math.min(100, ((progress[a.id] || 0) / a.progress!.total) * 100) }))
      .sort((x, y) => y.pct - x.pct);
    return candidates[0] || null;
  }, [unlocked, progress]);

  const levelPct = Math.max(0, Math.min(100, Math.round(((totalXP - level.min) / (level.max - level.min)) * 100)));
  const nextLevelName = getNextLevelName(level.name);
  const xpToNext = Math.max(0, level.max - totalXP);
  const completionPct = Math.round((count / total) * 100);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', paddingBottom: 100 }}>
      {/* ═══ HERO CINEMATOGRÁFICO ═══ */}
      <div style={{ padding: '8px 16px 0', maxWidth: 980, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'relative',
            borderRadius: 24,
            padding: '24px 22px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1a0b3d 0%, #3b1080 45%, #7c3aed 100%)',
            boxShadow: '0 24px 60px -20px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
          }}
        >
          {/* Animated orbs */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)', filter: 'blur(20px)' }}
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', bottom: -80, left: -30, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%)', filter: 'blur(24px)' }}
          />
          {/* Grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at top right, black 20%, transparent 70%)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Top row: Level badge + completion */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.6 }}
                  style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
                  }}
                >
                  {level.emoji}
                </motion.div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Seu Nível
                  </div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                    {level.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={11} fill="#fde68a" stroke="#fde68a" />
                    <span style={{ fontWeight: 700, color: '#fde68a' }}>{totalXP.toLocaleString('pt-BR')}</span>
                    <span>XP</span>
                  </div>
                </div>
              </div>

              {/* Circular completion */}
              <div style={{ position: 'relative', width: 64, height: 64 }}>
                <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  <motion.circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke="url(#grad-ring)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 163' }}
                    animate={{ strokeDasharray: `${(completionPct / 100) * 163} 163` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="grad-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>{completionPct}%</div>
                  <div style={{ fontSize: 8, opacity: 0.75, fontWeight: 700, marginTop: 1 }}>{count}/{total}</div>
                </div>
              </div>
            </div>

            {/* Level progress bar */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600 }}>
                  Progresso para <span style={{ color: '#fde68a', fontWeight: 800 }}>{nextLevelName}</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700 }}>
                  {xpToNext} XP restantes
                </span>
              </div>
              <div style={{
                position: 'relative', height: 10, borderRadius: 99,
                background: 'rgba(0,0,0,0.3)',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelPct}%` }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    height: '100%', borderRadius: 99,
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #ec4899)',
                    boxShadow: '0 0 16px rgba(251,191,36,0.6)',
                  }}
                />
                {/* Shimmer */}
                <motion.div
                  animate={{ x: ['-30%', '130%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                  style={{
                    position: 'absolute', top: 0, bottom: 0, width: '30%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ MISSÃO EM DESTAQUE ═══ */}
        {featured && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setSelected(featured.a)}
            style={{
              width: '100%',
              marginTop: 14,
              padding: 16,
              borderRadius: 18,
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--border-default)',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
              background: RARITY[rarityOf(featured.a.xp)].grad,
            }} />
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: RARITY[rarityOf(featured.a.xp)].grad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0,
              boxShadow: RARITY[rarityOf(featured.a.xp)].glow,
            }}>
              <AchievementIcon id={featured.a.id} rarity={rarityOf(featured.a.xp)} unlocked={true} size={32} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Flame size={11} style={{ color: 'hsl(var(--primary))' }} fill="hsl(var(--primary))" />
                <span style={{ fontSize: 9, fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Quase lá
                </span>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
                {featured.a.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${featured.pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, hsl(var(--primary)), #c084fc)', borderRadius: 99 }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--primary))', minWidth: 32, textAlign: 'right' }}>
                  {Math.round(featured.pct)}%
                </span>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-hint)', flexShrink: 0 }} />
          </motion.button>
        )}

        {/* ═══ FILTROS ═══ */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '20px 0 12px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {filters.map(f => {
            const active = filter === f.id;
            const Icon = (f as any).icon;
            return (
              <motion.button
                key={f.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: 99,
                  border: `1.5px solid ${active ? 'transparent' : 'var(--border-default)'}`,
                  background: active ? 'linear-gradient(135deg, hsl(var(--primary)), #6d28d9)' : 'var(--bg-surface)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: active ? '0 6px 16px -6px hsl(var(--primary) / 0.6)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {Icon && <Icon size={12} />}
                {(f as any).emoji && <span>{(f as any).emoji}</span>}
                {f.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ═══ GRID DE CONQUISTAS ═══ */}
      <div style={{
        padding: '0 16px',
        maxWidth: 980,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 12,
      }}>
        {filtered.map((a, idx) => {
          const isUnlocked = unlocked.includes(a.id);
          const currentProg = progress[a.id] || 0;
          const progPct = a.progress ? Math.min(100, Math.round((currentProg / a.progress.total) * 100)) : 0;
          const r = rarityOf(a.xp);
          const rar = RARITY[r];

          return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.025, 0.4), ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(a)}
              style={{
                position: 'relative',
                background: 'var(--bg-surface)',
                border: `1.5px solid ${isUnlocked ? rar.ring : 'var(--border-default)'}`,
                borderRadius: 18,
                padding: '16px 12px 14px',
                cursor: 'pointer',
                textAlign: 'center',
                overflow: 'hidden',
                boxShadow: isUnlocked ? rar.glow : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Rarity glow background for unlocked */}
              {isUnlocked && (
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
                  background: rar.grad,
                }} />
              )}

              {/* Rarity tag */}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 6,
                background: isUnlocked ? rar.grad : 'var(--bg-elevated)',
                color: isUnlocked ? '#fff' : 'var(--text-hint)',
                opacity: isUnlocked ? 1 : 0.5,
              }}>
                {rar.label}
              </div>

              {/* Medal */}
              <div style={{ position: 'relative', display: 'inline-block', marginTop: 8, marginBottom: 10 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: isUnlocked ? rar.grad : 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36,
                  filter: isUnlocked ? 'none' : 'grayscale(1)',
                  opacity: isUnlocked ? 1 : 0.5,
                  boxShadow: isUnlocked
                    ? `${rar.glow}, inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.15)`
                    : 'inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <AchievementIcon id={a.id} rarity={r} unlocked={isUnlocked} size={42} />
                  {/* Shine */}
                  {isUnlocked && (
                    <motion.div
                      animate={{ x: ['-150%', '150%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: idx * 0.3 + 2, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', top: 0, bottom: 0, width: '40%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                        transform: 'skewX(-20deg)',
                      }}
                    />
                  )}
                </div>
                {!isUnlocked && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--bg-page)',
                    border: '2px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lock size={11} style={{ color: 'var(--text-hint)' }} />
                  </div>
                )}
                {isUnlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.025 + 0.3, type: 'spring' }}
                    style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: '2px solid var(--bg-surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 900,
                    }}
                  >
                    ✓
                  </motion.div>
                )}
              </div>

              <div style={{
                color: 'var(--text-primary)',
                fontSize: 12, fontWeight: 800, lineHeight: 1.2,
                marginBottom: 4,
                opacity: isUnlocked ? 1 : 0.7,
                minHeight: 28,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {a.name}
              </div>

              {/* XP / Progress */}
              {isUnlocked ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 800,
                  color: '#fde68a',
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  <Zap size={9} fill="currentColor" />
                  +{a.xp}
                </div>
              ) : a.progress ? (
                <div style={{ position: 'relative', marginTop: 4 }}>
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progPct}%` }}
                      transition={{ duration: 0.9, delay: idx * 0.02 + 0.2, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'hsl(var(--primary))', borderRadius: 99 }}
                    />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-hint)', marginTop: 4 }}>
                    {currentProg}/{a.progress.total}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-hint)' }}>
                  +{a.xp} XP
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ═══ MODAL DETALHE ═══ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 24,
                padding: '28px 22px 24px',
                width: '100%', maxWidth: 420,
                position: 'relative',
                border: `1.5px solid ${unlocked.includes(selected.id) ? RARITY[rarityOf(selected.xp)].ring : 'var(--border-default)'}`,
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}
            >
              {/* glow background */}
              <div style={{
                position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
                width: 300, height: 300, borderRadius: '50%',
                background: RARITY[rarityOf(selected.xp)].grad,
                opacity: 0.18, filter: 'blur(50px)', pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                  style={{
                    width: 110, height: 110, borderRadius: '50%',
                    background: unlocked.includes(selected.id) ? RARITY[rarityOf(selected.xp)].grad : 'var(--bg-elevated)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 56, marginBottom: 16,
                    filter: unlocked.includes(selected.id) ? 'none' : 'grayscale(1)',
                    opacity: unlocked.includes(selected.id) ? 1 : 0.55,
                    boxShadow: unlocked.includes(selected.id)
                      ? `${RARITY[rarityOf(selected.xp)].glow}, inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)`
                      : 'inset 0 -3px 0 rgba(0,0,0,0.1)',
                  }}
                >
                  <AchievementIcon id={selected.id} rarity={rarityOf(selected.xp)} unlocked={unlocked.includes(selected.id)} size={64} />
                </motion.div>

                <div style={{
                  display: 'inline-block',
                  padding: '3px 10px', borderRadius: 99,
                  background: RARITY[rarityOf(selected.xp)].grad,
                  color: '#fff', fontSize: 9, fontWeight: 800,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  {RARITY[rarityOf(selected.xp)].label} · +{selected.xp} XP
                </div>

                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                  {selected.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55, margin: '0 0 20px' }}>
                  {selected.description}
                </p>

                {selected.progress && !unlocked.includes(selected.id) && (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 14, padding: 14, marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {(progress[selected.id] || 0)} de {selected.progress.total} {selected.progress.label}
                      </span>
                      <span style={{ fontSize: 12, color: 'hsl(var(--primary))', fontWeight: 800 }}>
                        {Math.min(100, Math.round(((progress[selected.id] || 0) / selected.progress.total) * 100))}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-page)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((progress[selected.id] || 0) / selected.progress.total) * 100)}%` }}
                        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, hsl(var(--primary)), #c084fc)', borderRadius: 99 }}
                      />
                    </div>
                  </div>
                )}

                {unlocked.includes(selected.id) && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 99,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    boxShadow: '0 6px 20px -6px rgba(16,185,129,0.6)',
                    marginBottom: 12,
                  }}>
                    <Award size={14} /> Conquista desbloqueada
                  </div>
                )}

                <button
                  onClick={() => setSelected(null)}
                  style={{
                    width: '100%', marginTop: 8,
                    padding: '14px', borderRadius: 14,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
