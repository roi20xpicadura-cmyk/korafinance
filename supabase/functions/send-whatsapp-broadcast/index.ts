import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller is an admin
    const ADMIN_EMAILS = ["528siqueira@gmail.com"];
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
    const TOKEN = Deno.env.get("ZAPI_TOKEN")!;
    const CLIENT = Deno.env.get("ZAPI_CLIENT_TOKEN")!;

    const { data: connections } = await supabase
      .from("whatsapp_connections")
      .select("phone_number")
      .eq("verified", true)
      .eq("active", true);

    let sent = 0;
    let failed = 0;

    for (const conn of connections || []) {
      try {
        const r = await fetch(
          `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "Client-Token": CLIENT },
            body: JSON.stringify({ phone: conn.phone_number, message }),
          },
        );
        if (r.ok) sent++; else failed++;
      } catch {
        failed++;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(JSON.stringify({ success: true, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
