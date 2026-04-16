import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function normalizeBrazilPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId, phoneNumber, action, code } = await req.json();

    if (!userId || !action) {
      return respond({ error: "Missing required fields" }, 400);
    }

    if (action === "send_code") {
      if (!phoneNumber) {
        return respond({ error: "Phone number required" }, 400);
      }

      const cleanPhone = normalizeBrazilPhone(phoneNumber);
      if (cleanPhone.length < 12 || cleanPhone.length > 13) {
        return respond({ error: "Número inválido. Use DDD + número." }, 400);
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: upsertError } = await supabase.from("whatsapp_connections").upsert(
        {
          user_id: userId,
          phone_number: cleanPhone,
          verified: false,
          verification_code: verificationCode,
          verification_expires_at: expiresAt,
          active: true,
        },
        { onConflict: "user_id" }
      );

      if (upsertError) {
        return respond({ error: "Erro ao salvar conexão do WhatsApp." }, 500);
      }

      const sendResult = await sendWhatsApp(
        cleanPhone,
        `🔐 *FinDash Pro — Verificação*\n\nSeu código: *${verificationCode}*\n\nVálido por 10 minutos.`
      );

      if (!sendResult.success) {
        return respond({ error: sendResult.error }, 502);
      }

      return respond({ sent: true, phone_number: cleanPhone });
    }

    if (action === "verify_code") {
      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!conn) {
        return respond({ error: "Conexão não encontrada" }, 404);
      }

      if (new Date() > new Date(conn.verification_expires_at)) {
        return respond({ error: "Código expirado. Solicite um novo." }, 400);
      }

      if (conn.verification_code !== code) {
        return respond({ error: "Código incorreto" }, 400);
      }

      const { error: verifyError } = await supabase.from("whatsapp_connections")
        .update({ verified: true, connected_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (verifyError) {
        return respond({ error: "Erro ao confirmar conexão." }, 500);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const name = profile?.full_name?.split(" ")[0] || "você";

      const welcomeResult = await sendWhatsApp(
        conn.phone_number,
        `✅ *WhatsApp conectado ao FinDash Pro!*\n\nOlá, ${name}! Agora gerencie finanças por aqui.\n\n*Exemplos:*\n💸 "gastei 50 no mercado"\n💰 "recebi 3000 de salário"\n📊 "como estão minhas finanças?"\n🎯 "progresso da minha meta"\n\nPode começar! 🚀`
      );

      if (!welcomeResult.success) {
        return respond({ verified: true, warning: welcomeResult.error });
      }

      return respond({ verified: true });
    }

    if (action === "disconnect") {
      await supabase.from("whatsapp_connections")
        .update({ active: false, verified: false })
        .eq("user_id", userId);

      return respond({ disconnected: true });
    }

    if (action === "status") {
      const { data } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("verified", true)
        .eq("active", true)
        .single();

      return respond({ connection: data || null });
    }

    return respond({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Verify error:", error);
    return respond({ error: error instanceof Error ? error.message : "Internal error" }, 500);
  }
});

async function sendWhatsApp(to: string, message: string): Promise<{ success: true } | { success: false; error: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return { success: false, error: "Configuração ausente do backend (LOVABLE_API_KEY)." };
  }

  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!TWILIO_API_KEY) {
    return { success: false, error: "Configuração ausente do Twilio no projeto." };
  }

  const resp = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: "whatsapp:+14155238886",
      To: `whatsapp:+${to}`,
      Body: message,
    }).toString(),
  });

  const payload = await resp.json().catch(() => null);

  if (!resp.ok) {
    return {
      success: false,
      error: payload?.message || payload?.error_message || `Falha ao enviar WhatsApp (${resp.status}).`,
    };
  }

  if (payload?.error_code || payload?.error_message) {
    return {
      success: false,
      error: payload.error_message || `Twilio recusou a mensagem (${payload.error_code}).`,
    };
  }

  return { success: true };
}
