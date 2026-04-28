// supabase/functions/log-client-error/index.ts
//
// Endpoint público (sem JWT) pra receber erros de runtime do cliente —
// principalmente chunk-load failures do lazyWithRetry. Faz log estruturado
// no console (visível no Supabase Logs) e grava no Postgres pra análise.
//
// Recebe: { kind, message, url?, userAgent?, extra? }
// Não bloqueia o cliente: sempre retorna 204 mesmo se algo der errado internamente
// (telemetria nunca pode quebrar a UX).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  kind: z.enum(["chunk_load", "render_error", "unhandled", "other"]),
  message: z.string().min(1).max(2000),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  extra: z.record(z.unknown()).optional(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      // Mesmo body inválido a gente engole — telemetria nunca quebra cliente.
      console.warn("[log-client-error] payload inválido:", parsed.error.flatten());
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const { kind, message, url, userAgent, extra } = parsed.data;

    // Best-effort: pega userId do JWT se vier (cliente pode ou não estar logado).
    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    // Log estruturado pro Supabase Logs (sempre visível, sem latência de DB).
    console.error("[client-error]", JSON.stringify({
      kind, message, url, userAgent, userId, extra,
    }));

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (err) {
    console.warn("[log-client-error] crash interno:", err);
    return new Response(null, { status: 204, headers: corsHeaders });
  }
});
