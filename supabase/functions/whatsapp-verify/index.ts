import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId, phoneNumber, action, code } = await req.json();

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_code") {
      if (!phoneNumber) {
        return new Response(JSON.stringify({ error: "Phone number required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Upsert connection
      await supabase.from("whatsapp_connections").upsert(
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

      // Send code via WhatsApp
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
        await sendWhatsApp(
          cleanPhone,
          `🔐 *FinDash Pro — Verificação*\n\nSeu código: *${verificationCode}*\n\nVálido por 10 minutos.`,
          TWILIO_ACCOUNT_SID,
          TWILIO_AUTH_TOKEN,
          TWILIO_WHATSAPP_NUMBER
        );
      }

      return new Response(JSON.stringify({ sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_code") {
      const cleanPhone = phoneNumber?.replace(/\D/g, "") || "";

      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: "Conexão não encontrada" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date() > new Date(conn.verification_expires_at)) {
        return new Response(JSON.stringify({ error: "Código expirado. Solicite um novo." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (conn.verification_code !== code) {
        return new Response(JSON.stringify({ error: "Código incorreto" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("whatsapp_connections")
        .update({ verified: true, connected_at: new Date().toISOString() })
        .eq("user_id", userId);

      // Send welcome
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        const name = profile?.full_name?.split(" ")[0] || "você";

        await sendWhatsApp(
          conn.phone_number,
          `✅ *WhatsApp conectado ao FinDash Pro!*\n\nOlá, ${name}! Agora gerencie finanças por aqui.\n\n*Exemplos:*\n💸 "gastei 50 no mercado"\n💰 "recebi 3000 de salário"\n📊 "como estão minhas finanças?"\n🎯 "progresso da minha meta"\n\nPode começar! 🚀`,
          TWILIO_ACCOUNT_SID,
          TWILIO_AUTH_TOKEN,
          TWILIO_WHATSAPP_NUMBER
        );
      }

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await supabase.from("whatsapp_connections")
        .update({ active: false, verified: false })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ disconnected: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("verified", true)
        .eq("active", true)
        .single();

      return new Response(JSON.stringify({ connection: data || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendWhatsApp(to: string, message: string, sid: string, token: string, fromNum: string) {
  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${sid}:${token}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: `whatsapp:+${fromNum}`,
      To: `whatsapp:+${to}`,
      Body: message,
    }).toString(),
  });
  if (!resp.ok) console.error("Twilio send error:", await resp.text());
}
