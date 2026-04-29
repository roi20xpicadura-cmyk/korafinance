import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import koraIcon from '@/assets/korafinance-icon.png';
import { toast } from 'sonner';

type Status = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let resolved = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const markReady = () => { resolved = true; setStatus('ready'); };
    const markInvalid = () => { resolved = true; setStatus('invalid'); };
    const waitForRecoverySession = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { markReady(); return true; }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return false;
    };

    const url = new URL(window.location.href);
    const hash = window.location.hash;
    const code = url.searchParams.get('code');
    const errorDesc = url.searchParams.get('error_description') || url.searchParams.get('error');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') markReady();
    });

    (async () => {
      if (errorDesc) { markInvalid(); return; }

      // New PKCE-style links: ?code=...
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { markInvalid(); return; }
        markReady();
        return;
      }

      // Legacy hash-based links: #access_token=...&type=recovery
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        // The global auth provider can consume the URL token before this page's
        // listener is attached, so also poll for the session it creates.
        if (await waitForRecoverySession()) return;
        if (!resolved) markInvalid();
        return;
      }

      // Maybe there's already an active recovery session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { markReady(); return; }

      if (await waitForRecoverySession()) return;
      if (!resolved) markInvalid();
    })();

    return () => {
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'ready') return;
    if (password !== confirmPw) { toast.error('As senhas não coincidem'); return; }
    if (password.length < 8) { toast.error('Mínimo 8 caracteres'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Senha atualizada com sucesso!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <img src={koraIcon} alt="KoraFinance" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-black text-foreground">KoraFinance</span>
        </div>

        <h1 className="text-2xl font-black text-foreground mb-1">Nova senha</h1>
        <p className="text-sm text-muted-foreground mb-6">Defina sua nova senha abaixo.</p>

        {status === 'checking' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Verificando link de recuperação...
          </div>
        )}

        {status === 'invalid' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Este link de recuperação é inválido ou expirou. Solicite um novo e-mail de redefinição.
            </div>
            <Link
              to="/forgot-password"
              className="inline-block w-full text-center py-2.5 rounded-[9px] bg-primary text-primary-foreground text-sm font-extrabold hover:brightness-110 transition-all"
            >
              Solicitar novo link
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-upper text-muted-foreground block mb-1.5">Nova senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-fin-green-border bg-card text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
            </div>
            <div>
              <label className="label-upper text-muted-foreground block mb-1.5">Confirmar senha</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-fin-green-border bg-card text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-[9px] bg-primary text-primary-foreground text-sm font-extrabold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
              Salvar nova senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
