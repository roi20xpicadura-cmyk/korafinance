import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { maybeForwardSessionToNativeApp } from "@/lib/nativeOAuth";

/**
 * Quando a página web (korafinance.app) é aberta no navegador externo
 * pelo app nativo (com ?native_oauth=1 → flag em sessionStorage), e o
 * usuário completa o login Google, esta lupa monitora a sessão e dispara
 * o redirecionamento pro deep link com.korafinance.app://auth-callback
 * com os tokens, devolvendo o controle pro app nativo.
 *
 * No-op se a flag não estiver presente.
 */
export default function NativeOAuthForwarder() {
  const { user, loading } = useAuth();
  const triedRef = useRef(false);

  useEffect(() => {
    if (loading || !user || triedRef.current) return;
    triedRef.current = true;
    void maybeForwardSessionToNativeApp();
  }, [user, loading]);

  return null;
}