import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { OBJECTIVES } from '@/lib/objectives';
import { PROFILE_TYPES } from '@/components/onboarding/OnboardingFlow';
import { Check, Download, Trash2, FileText, Camera, Bell, BellOff, Shield, ChevronRight, User, Target as TargetIcon, Sliders, Lock, MessageCircle, AlertTriangle, Sparkles, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { requestPushPermission, checkNotificationSupport, sendLocalNotification } from '@/lib/pushNotifications';
import WhatsAppSettings from '@/components/app/WhatsAppSettings';
import { translateAuthError } from '@/lib/auth-errors';

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, config, updateProfile, updateConfig } = useProfile();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [projectName, setProjectName] = useState(config?.project_name || 'Meu Painel');
  const [currency, setCurrency] = useState(config?.currency || 'R$');
  const [savePct, setSavePct] = useState(config?.default_save_pct || 25);
  const [notifications, setNotifications] = useState(config?.notifications_enabled ?? true);
  const [profileType, setProfileType] = useState(config?.profile_type || 'personal');
  const [objectives, setObjectives] = useState<string[]>(config?.financial_objectives || []);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const [pushEnabled, setPushEnabled] = useState(false);
  const notifSupport = checkNotificationSupport();

  useEffect(() => {
    if (config) {
      setProfileType(config.profile_type || 'personal');
      setObjectives(config.financial_objectives || []);
      setProjectName(config.project_name || 'Meu Painel');
      setCurrency(config.currency || 'R$');
      setSavePct(config.default_save_pct || 25);
      setNotifications(config.notifications_enabled ?? true);
    }
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [config, profile]);

  // Fetch notification preferences
  useEffect(() => {
    if (!user) return;
    supabase.from('notification_preferences').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          const { id, user_id, created_at, ...prefs } = data;
          setNotifPrefs(prefs as Record<string, boolean>);
        }
      });
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({ full_name: fullName });
    toast.success('Perfil atualizado!');
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = pub.publicUrl;
      await updateProfile({ avatar_url: url });
      setAvatarUrl(url);
      toast.success('Foto de perfil atualizada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatar_url: null });
      setAvatarUrl('');
      toast.success('Foto removida');
    } catch {
      toast.error('Erro ao remover foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfileType = async (val: string) => {
    setProfileType(val);
    await updateConfig({ profile_type: val });
    toast.success('Perfil atualizado!');
  };

  const toggleObjective = (key: string) => {
    setObjectives(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSaveObjectives = async () => {
    setSaving(true);
    await updateConfig({ financial_objectives: objectives });
    toast.success('Objetivos salvos!');
    setSaving(false);
  };

  const handleSavePrefs = async () => {
    setSaving(true);
    await updateConfig({ project_name: projectName, currency, default_save_pct: savePct, notifications_enabled: notifications });
    toast.success('Preferências salvas!');
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Senhas não coincidem'); return; }
    if (newPw.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Senha alterada!');
    setNewPw(''); setConfirmPw('');
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const tables = ['transactions', 'goals', 'goal_checkins', 'debts', 'debt_payments', 'credit_cards', 'card_bills', 'investments', 'budgets', 'achievements', 'recurring_transactions'] as const;
      const allData: Record<string, unknown> = { profile, config };
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*');
        allData[table] = data || [];
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kora_meus_dados_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Seus dados foram exportados com sucesso');
    } catch {
      toast.error('Erro ao exportar dados');
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'EXCLUIR') { toast.error('Digite EXCLUIR para confirmar'); return; }
    toast.info('Recebemos sua solicitação. Seus dados serão excluídos em até 30 dias.');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-0 py-2 md:py-6 pb-12">
      {/* ═══ HERO PERFIL CINEMATOGRÁFICO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          borderRadius: 24,
          padding: '28px 22px 24px',
          marginBottom: 32,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a0b3d 0%, #3b1080 45%, #7c3aed 100%)',
          boxShadow: '0 24px 60px -20px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
      >
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
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.16, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at top right, black 20%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar with ring + camera */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              padding: 3, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fde68a, #f59e0b, #ec4899)',
              boxShadow: '0 10px 30px -8px rgba(0,0,0,0.4)',
            }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '3px solid #1a0b3d' }}
                />
              ) : (
                <div style={{
                  width: 84, height: 84, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 32, fontWeight: 800,
                  border: '3px solid #1a0b3d',
                }}>
                  {(fullName || user?.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Alterar foto"
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 32, height: 32, borderRadius: '50%',
                background: '#fff',
                border: '3px solid #1a0b3d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#7c3aed',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Camera size={14} strokeWidth={2.4} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 99,
              background: 'rgba(253,230,138,0.15)',
              border: '1px solid rgba(253,230,138,0.35)',
              marginBottom: 6,
            }}>
              <Sparkles size={9} color="#fde68a" fill="#fde68a" />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: '#fde68a', textTransform: 'uppercase' }}>
                Conta Pessoal
              </span>
            </div>
            <h1 style={{
              color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.15,
              letterSpacing: '-0.4px', margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {fullName || 'Seu nome'}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.72)', fontSize: 12, margin: '2px 0 0',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </p>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                style={{
                  marginTop: 8, padding: 0,
                  fontSize: 11, fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                {uploadingAvatar ? 'Processando…' : 'Remover foto'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ Section: WhatsApp ═══ */}
      <SectionHeader icon={MessageCircle} title="WhatsApp" description="Registre lançamentos pelo Zap" />
      <div className="mb-10">
        <WhatsAppSettings />
      </div>

      {/* ═══ Section: Tipo de perfil ═══ */}
      <SectionHeader icon={User} title="Tipo de perfil" description="Como você usa o app" />
      <div className="mb-10 space-y-2">
        {PROFILE_TYPES.map(pt => {
          const active = profileType === pt.value;
          return (
            <motion.button
              key={pt.value}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleSaveProfileType(pt.value)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left relative overflow-hidden"
              style={{
                background: active
                  ? 'linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.04))'
                  : 'var(--color-bg-surface)',
                border: `1px solid ${active ? 'hsl(var(--primary) / 0.35)' : 'var(--color-border-weak)'}`,
                boxShadow: active ? '0 6px 18px -10px hsl(var(--primary) / 0.5)' : 'none',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))'
                    : 'var(--color-bg-sunken)',
                  border: `1px solid ${active ? 'hsl(var(--primary) / 0.25)' : 'var(--color-border-weak)'}`,
                }}
              >
                {pt.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-strong)' }}>{pt.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{pt.desc}</p>
              </div>
              {active && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), #6d28d9)',
                    boxShadow: '0 4px 10px -3px hsl(var(--primary) / 0.6)',
                  }}
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ═══ Section: Objetivos ═══ */}
      <SectionHeader icon={TargetIcon} title="Meus objetivos" description="O que você quer conquistar" />
      <div className="mb-10">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {OBJECTIVES.map(obj => {
            const selected = objectives.includes(obj.key);
            return (
              <motion.button
                key={obj.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => toggleObjective(obj.key)}
                className="relative p-3 rounded-2xl text-center transition-all"
                style={{
                  background: selected
                    ? 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))'
                    : 'var(--color-bg-surface)',
                  border: `1px solid ${selected ? 'hsl(var(--primary) / 0.4)' : 'var(--color-border-weak)'}`,
                  boxShadow: selected ? '0 6px 14px -8px hsl(var(--primary) / 0.55)' : 'none',
                }}
              >
                {selected && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)), #6d28d9)',
                      boxShadow: '0 2px 6px hsl(var(--primary) / 0.6)',
                    }}
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className="text-xl block leading-none">{obj.emoji}</span>
                <span
                  className="text-[10px] font-semibold block mt-1.5"
                  style={{ color: selected ? 'hsl(var(--primary))' : 'var(--color-text-muted)' }}
                >
                  {obj.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        <PrimaryButton onClick={handleSaveObjectives} disabled={saving}>Salvar objetivos</PrimaryButton>
      </div>

      {/* ═══ Section: Informações pessoais ═══ */}
      <SectionHeader icon={User} title="Informações pessoais" description="Como você quer ser chamado" />
      <div className="mb-10 space-y-4">
        <Field label="Nome completo">
          <TextInput value={fullName} onChange={e => setFullName(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <TextInput value={user?.email || ''} readOnly />
        </Field>
        <PrimaryButton onClick={handleSaveProfile} disabled={saving}>Salvar perfil</PrimaryButton>
      </div>

      {/* ═══ Section: Preferências ═══ */}
      <SectionHeader icon={Sliders} title="Preferências" description="Personalize sua experiência" />
      <div className="mb-10 space-y-4">
        <Field label="Nome do projeto">
          <TextInput value={projectName} onChange={e => setProjectName(e.target.value)} />
        </Field>
        <Field label="Moeda">
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-colors"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-base)',
              color: 'var(--color-text-base)',
            }}
          >
            <option value="R$">R$ (Real)</option>
            <option value="$">$ (Dólar)</option>
            <option value="€">€ (Euro)</option>
          </select>
        </Field>
        <Field label={`% padrão a guardar — ${savePct}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={savePct}
            onChange={e => setSavePct(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </Field>
        <ToggleRow
          label="Notificações ativadas"
          description="Receber alertas dentro do app"
          checked={notifications}
          onChange={setNotifications}
        />
        <PrimaryButton onClick={handleSavePrefs} disabled={saving}>Salvar preferências</PrimaryButton>
      </div>

      {/* ═══ Section: Notificações push ═══ */}
      <SectionHeader icon={Bell} title="Notificações" description="Escolha o que receber" />
      <div className="mb-10">
        {notifSupport.local ? (
          <>
            <div
              className="flex items-center justify-between p-4 rounded-2xl mb-3"
              style={{ background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-weak)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: pushEnabled
                      ? 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))'
                      : 'var(--color-bg-surface)',
                    border: pushEnabled ? '1px solid hsl(var(--primary) / 0.25)' : '1px solid var(--color-border-weak)',
                  }}
                >
                  {pushEnabled ? <Bell size={16} style={{ color: 'hsl(var(--primary))' }} /> : <BellOff size={16} style={{ color: 'var(--color-text-muted)' }} />}
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-strong)' }}>Push no navegador</p>
                  <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    {pushEnabled ? 'Ativado' : 'Receba alertas em tempo real'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const granted = await requestPushPermission();
                  setPushEnabled(granted);
                  if (granted) {
                    toast.success('Notificações ativadas!');
                    sendLocalNotification('KoraFinance', '🎉 Notificações ativadas com sucesso!');
                  } else {
                    toast.error('Permissão negada. Ative nas configurações do navegador.');
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                style={{
                  background: pushEnabled
                    ? 'hsl(var(--primary) / 0.12)'
                    : 'linear-gradient(135deg, hsl(var(--primary)), #6d28d9)',
                  color: pushEnabled ? 'hsl(var(--primary))' : '#fff',
                  border: pushEnabled ? '1px solid hsl(var(--primary) / 0.3)' : 'none',
                  boxShadow: pushEnabled ? 'none' : '0 6px 14px -6px hsl(var(--primary) / 0.55)',
                }}
              >
                {pushEnabled ? 'Ativado ✓' : 'Ativar'}
              </button>
            </div>

            {Object.keys(notifPrefs).length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-weak)' }}>
                {[
                  { key: 'budget_alerts', label: 'Alertas de orçamento', emoji: '📊' },
                  { key: 'goal_alerts', label: 'Progresso de metas', emoji: '🎯' },
                  { key: 'card_due_alerts', label: 'Vencimento de cartões', emoji: '💳' },
                  { key: 'debt_reminders', label: 'Lembretes de dívidas', emoji: '📋' },
                  { key: 'streak_alerts', label: 'Sequência diária', emoji: '🔥' },
                  { key: 'weekly_summary', label: 'Resumo semanal', emoji: '📈' },
                ].map((item, i, arr) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-weak)' : 'none' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.emoji}</span>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-base)' }}>{item.label}</span>
                    </div>
                    <Switch
                      checked={notifPrefs[item.key] ?? true}
                      onChange={async (checked) => {
                        const updated = { ...notifPrefs, [item.key]: checked };
                        setNotifPrefs(updated);
                        if (user) {
                          await supabase.from('notification_preferences').upsert({ user_id: user.id, ...updated }, { onConflict: 'user_id' });
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            Seu navegador não suporta notificações push.
          </p>
        )}
      </div>

      {/* ═══ Section: Segurança ═══ */}
      <SectionHeader icon={Lock} title="Segurança" description="Mantenha sua conta protegida" />
      <div className="mb-10 space-y-4">
        <Field label="Nova senha">
          <TextInput type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
        </Field>
        <Field label="Confirmar nova senha">
          <TextInput type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
        </Field>
        <PrimaryButton onClick={handleChangePassword} disabled={saving}>Alterar senha</PrimaryButton>

        <Link
          to="/app/settings/security"
          className="flex items-center gap-3 p-4 rounded-2xl transition-all mt-2 hover:brightness-105"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-weak)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))',
              border: '1px solid hsl(var(--primary) / 0.22)',
            }}
          >
            <Shield size={16} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-strong)' }}>Segurança e privacidade</p>
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Sessões, autenticação e mais</p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--color-text-subtle)' }} />
        </Link>
      </div>

      {/* ═══ Section: Meus dados (LGPD) ═══ */}
      <SectionHeader icon={FileText} title="Meus dados" description="Direitos garantidos pela LGPD" />
      <div className="mb-10 space-y-3">
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-weak)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))',
              border: '1px solid hsl(var(--primary) / 0.22)',
            }}
          >
            <FileText size={16} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-strong)' }}>Aceitação dos termos</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {profile?.terms_accepted_at
                ? `Aceito em ${new Date(profile.terms_accepted_at).toLocaleDateString('pt-BR')} · v${profile?.terms_version || '1.0'}`
                : 'Sem registro'}
            </p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all disabled:opacity-50 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.03))',
            border: '1px solid hsl(var(--primary) / 0.3)',
            color: 'hsl(var(--primary))',
          }}
        >
          <Download size={15} />
          {exporting ? 'Exportando…' : 'Exportar todos os meus dados'}
        </button>

        <p className="text-[11px] px-1" style={{ color: 'var(--color-text-subtle)' }}>
          Conforme a LGPD (Art. 18), você pode acessar, corrigir e exportar seus dados.{' '}
          <a href="/lgpd" className="underline font-semibold" style={{ color: 'hsl(var(--primary))' }}>Saiba mais</a>
        </p>
      </div>

      {/* ═══ Section: Zona de perigo ═══ */}
      <SectionHeader icon={AlertTriangle} title="Zona de perigo" description="Ações irreversíveis" tone="danger" />
      <div
        className="mb-6 p-4 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(239,68,68,0.02))',
          border: '1px solid rgba(239,68,68,0.18)',
        }}
      >
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold transition-all active:scale-[0.99]"
          style={{
            background: '#fff',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#dc2626',
            boxShadow: '0 4px 10px -6px rgba(239,68,68,0.35)',
          }}
        >
          <Trash2 size={15} />
          Solicitar exclusão da conta
        </button>
        <p className="text-[11px] mt-2 px-1 text-center" style={{ color: 'var(--color-text-subtle)' }}>
          Seus dados serão removidos em até 30 dias.
        </p>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'var(--color-bg-overlay, rgba(0,0,0,0.5))' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--color-bg-surface)' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-strong)' }}>Tem certeza?</h3>
            <p className="text-[14px] mb-1" style={{ color: 'var(--color-text-muted)' }}>Esta ação é irreversível.</p>
            <p className="text-[14px] mb-1" style={{ color: 'var(--color-text-muted)' }}>Todos os seus dados serão excluídos em até 30 dias.</p>
            <p className="text-[14px] mb-4" style={{ color: 'var(--color-text-muted)' }}>Você perderá acesso imediatamente.</p>
            <label className="text-[12px] font-bold block mb-2" style={{ color: 'var(--color-text-base)' }}>
              Digite <span className="text-destructive">EXCLUIR</span> para confirmar:
            </label>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-destructive bg-card text-sm mb-4 outline-none" placeholder="EXCLUIR" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--color-border-base)', color: 'var(--color-text-base)' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'EXCLUIR'}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-bold text-white bg-destructive disabled:opacity-50">
                Excluir minha conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════ Subcomponents (premium minimal) ═════════════ */

function SectionHeader({ icon: Icon, title, description, tone = 'default' }: { icon: LucideIcon; title: string; description?: string; tone?: 'default' | 'danger' }) {
  const isDanger = tone === 'danger';
  return (
    <div className="flex items-center gap-3 mb-4 px-1">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isDanger
            ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))',
          border: `1px solid ${isDanger ? 'rgba(239,68,68,0.25)' : 'hsl(var(--primary) / 0.22)'}`,
          boxShadow: isDanger
            ? '0 4px 12px -4px rgba(239,68,68,0.25)'
            : '0 4px 12px -4px hsl(var(--primary) / 0.3)',
        }}
      >
        <Icon size={17} strokeWidth={2.2} style={{ color: isDanger ? '#dc2626' : 'hsl(var(--primary))' }} />
      </div>
      <div className="min-w-0">
        <h2
          className="text-[15px] font-extrabold leading-tight tracking-tight"
          style={{ color: isDanger ? '#dc2626' : 'var(--color-text-strong)' }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{description}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5 px-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-colors"
      style={{
        background: props.readOnly ? 'var(--color-bg-sunken)' : 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-base)',
        color: props.readOnly ? 'var(--color-text-muted)' : 'var(--color-text-base)',
        ...(props.style || {}),
      }}
    />
  );
}

function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="px-5 py-3 rounded-xl text-[13px] font-bold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary)), #6d28d9)',
        color: '#fff',
        boxShadow: '0 8px 20px -8px hsl(var(--primary) / 0.55)',
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-4 rounded-2xl cursor-pointer" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-weak)' }}>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-strong)' }}>{label}</p>
        {description && <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </label>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className="relative inline-flex flex-shrink-0 items-center rounded-full transition-colors"
      style={{
        width: 40,
        height: 24,
        background: checked
          ? 'linear-gradient(135deg, hsl(var(--primary)), #6d28d9)'
          : 'var(--color-border-base)',
        boxShadow: checked ? '0 2px 8px -2px hsl(var(--primary) / 0.5)' : 'none',
      }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform shadow"
        style={{
          width: 18,
          height: 18,
          transform: checked ? 'translateX(19px)' : 'translateX(3px)',
        }}
      />
    </button>
  );
}

