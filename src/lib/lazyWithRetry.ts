// src/lib/lazyWithRetry.ts
//
// Wrapper em volta de React.lazy que:
// 1. Tenta novamente o dynamic import quando ele falha (chunk velho após deploy,
//    glitch de rede, HMR esquisito).
// 2. Se mesmo assim falhar, retorna um componente vazio em vez de jogar pro
//    ErrorBoundary — widgets opcionais (push opt-in, promo) NÃO devem derrubar
//    a página inteira.
//
// Uso: const Foo = lazyWithRetry(() => import('./Foo'));
import { ComponentType, lazy } from 'react';

type Importer<T extends ComponentType<any>> = () => Promise<{ default: T }>;

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: Importer<T>,
  { retries = 2, delayMs = 400, fallbackToEmpty = true } = {},
) {
  return lazy(async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importer();
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        }
      }
    }
    console.warn('[lazyWithRetry] dynamic import falhou após retries:', lastErr);
    reportChunkFailure(lastErr, fallbackToEmpty);
    if (fallbackToEmpty) {
      // Componente vazio — preserva o fluxo da página.
      return { default: (() => null) as unknown as T };
    }
    throw lastErr;
  });
}

// Telemetria fire-and-forget. Nunca aguarda nem propaga erro.
function reportChunkFailure(err: unknown, fellBackToEmpty: boolean) {
  try {
    // Só reporta em prod (evita ruído em dev/HMR).
    if (typeof window === 'undefined') return;
    if (window.location.hostname === 'localhost') return;

    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !anonKey) return;

    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);

    // Pega o JWT atual se houver (best-effort, sem importar o client).
    let auth = `Bearer ${anonKey}`;
    for (const k in localStorage) {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        try {
          const t = JSON.parse(localStorage.getItem(k) || '{}')?.access_token;
          if (t) { auth = `Bearer ${t}`; break; }
        } catch { /* ignore */ }
      }
    }

    fetch(`${supabaseUrl}/functions/v1/log-client-error`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: auth },
      body: JSON.stringify({
        kind: 'chunk_load',
        message: message.slice(0, 2000),
        url: window.location.href.slice(0, 500),
        userAgent: navigator.userAgent.slice(0, 500),
        extra: { fellBackToEmpty },
      }),
    }).catch(() => { /* telemetria silenciosa */ });
  } catch { /* nunca quebra a UX */ }
}
