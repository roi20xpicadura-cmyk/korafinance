import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = 'validating' | 'valid' | 'already' | 'invalid' | 'submitting' | 'success' | 'error';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('validating');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState('invalid');
          setErrorMsg(data?.error || 'Link inválido ou expirado.');
          return;
        }
        if (data?.valid === false && data?.reason === 'already_unsubscribed') {
          setState('already');
          return;
        }
        if (data?.valid) setState('valid');
        else setState('invalid');
      } catch {
        setState('invalid');
        setErrorMsg('Não foi possível validar o link.');
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState('submitting');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data?.success) setState('success');
      else if (data?.reason === 'already_unsubscribed') setState('already');
      else {
        setState('error');
        setErrorMsg(data?.error || 'Erro ao processar.');
      }
    } catch {
      setState('error');
      setErrorMsg('Erro de conexão.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md card-surface p-8 text-center">
        <p className="text-2xl font-extrabold text-primary mb-6">Kora</p>

        {state === 'validating' && (
          <p className="text-muted-foreground">Validando link...</p>
        )}

        {state === 'valid' && (
          <>
            <h1 className="text-xl font-bold text-foreground mb-3">Cancelar inscrição</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Confirma que deseja parar de receber emails da Kora? Você ainda receberá emails essenciais da sua conta (segurança, faturamento).
            </p>
            <button
              onClick={confirm}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition"
            >
              Confirmar cancelamento
            </button>
          </>
        )}

        {state === 'submitting' && (
          <p className="text-muted-foreground">Processando...</p>
        )}

        {state === 'success' && (
          <>
            <h1 className="text-xl font-bold text-foreground mb-3">Inscrição cancelada</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Você não receberá mais emails de marketing da Kora. Sentiremos sua falta. 💜
            </p>
            <Link to="/" className="text-primary font-semibold underline">Voltar ao site</Link>
          </>
        )}

        {state === 'already' && (
          <>
            <h1 className="text-xl font-bold text-foreground mb-3">Você já cancelou</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Este email já está descadastrado da nossa lista.
            </p>
            <Link to="/" className="text-primary font-semibold underline">Voltar ao site</Link>
          </>
        )}

        {(state === 'invalid' || state === 'error') && (
          <>
            <h1 className="text-xl font-bold text-foreground mb-3">Link inválido</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {errorMsg || 'Este link de cancelamento é inválido ou já foi usado.'}
            </p>
            <Link to="/" className="text-primary font-semibold underline">Voltar ao site</Link>
          </>
        )}
      </div>
    </div>
  );
}