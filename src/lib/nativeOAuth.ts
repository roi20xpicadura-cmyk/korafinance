/**
 * Fluxo de OAuth (Google) para o app nativo Capacitor.
 *
 * Por que não usar lovable.auth.signInWithOAuth direto no app nativo?
 * - Ele depende da rota /~oauth/initiate, que só existe no domínio web
 *   hospedado (korafinance.app). Dentro do WebView do Capacitor, essa
 *   rota não está empacotada → 404.
 *
 * Estratégia:
 * 1. App nativo abre o navegador EXTERNO (Custom Tab) apontando pra
 *    https://korafinance.app/login?native_oauth=1
 * 2. Lá, o login Google funciona normalmente (broker do Lovable).
 * 3. Após autenticar, /app detecta a flag e redireciona pra deep link
 *    com.korafinance.app://auth-callback#at=...&rt=...
 * 4. O Capacitor App plugin captura a URL no app nativo, extrai os
 *    tokens, chama supabase.auth.setSession e fecha o browser.
 */
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/platform";

const WEB_ORIGIN = "https://korafinance.app";
const DEEP_LINK_SCHEME = "com.korafinance.app";

export async function signInWithGoogleNative(): Promise<{ error?: Error }> {
  try {
    const url = `${WEB_ORIGIN}/login?native_oauth=1&provider=google&t=${Date.now()}`;
    await Browser.open({ url, presentationStyle: "popover" });
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

let listenerInstalled = false;

/**
 * Instala o listener global de deep links. Deve ser chamado uma vez no
 * boot do app (em main.tsx ou App.tsx). É idempotente.
 */
export function installNativeOAuthListener() {
  if (listenerInstalled) return;
  if (!isNativeApp()) return;
  listenerInstalled = true;

  App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    try {
      const url = event.url || "";
      if (!url.startsWith(`${DEEP_LINK_SCHEME}://`)) return;

      // Aceita tokens em hash (#at=...&rt=...) ou query (?at=...&rt=...)
      const hashIdx = url.indexOf("#");
      const queryIdx = url.indexOf("?");
      const fragment = hashIdx >= 0 ? url.slice(hashIdx + 1)
        : queryIdx >= 0 ? url.slice(queryIdx + 1) : "";
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const access_token = params.get("at") || params.get("access_token");
      const refresh_token = params.get("rt") || params.get("refresh_token");
      if (!access_token || !refresh_token) return;

      await supabase.auth.setSession({ access_token, refresh_token });
      try { await Browser.close(); } catch { /* ok */ }

      // Garante navegação pra área autenticada
      if (window.location.pathname !== "/app") {
        window.location.replace("/app");
      }
    } catch (err) {
      console.error("[nativeOAuth] failed to handle deep link", err);
    }
  });
}

/**
 * Chamado pela página web (/login ou /app) quando o login terminou
 * num fluxo iniciado pelo app nativo (flag native_oauth=1 em
 * sessionStorage). Pega a sessão atual e redireciona pro deep link
 * que reabre o app nativo com os tokens.
 *
 * Retorna true se redirecionou (caller deve parar o fluxo normal).
 */
export async function maybeForwardSessionToNativeApp(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    const flag = sessionStorage.getItem("kora:native_oauth");
    const urlFlag = new URLSearchParams(window.location.search).get("native_oauth");
    if (!flag && urlFlag !== "1") return false;

    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s?.access_token || !s?.refresh_token) return false;

    sessionStorage.removeItem("kora:native_oauth");
    const deepLink = `${DEEP_LINK_SCHEME}://auth-callback#at=${encodeURIComponent(s.access_token)}&rt=${encodeURIComponent(s.refresh_token)}`;
    window.location.replace(deepLink);
    return true;
  } catch {
    return false;
  }
}

/**
 * Persiste a flag native_oauth quando a URL contém ?native_oauth=1.
 * Deve ser chamado no mount da LoginPage.
 */
export function captureNativeOAuthFlag() {
  try {
    if (typeof window === "undefined") return;
    const urlFlag = new URLSearchParams(window.location.search).get("native_oauth");
    if (urlFlag === "1") {
      sessionStorage.setItem("kora:native_oauth", "1");
    }
  } catch { /* ignore */ }
}