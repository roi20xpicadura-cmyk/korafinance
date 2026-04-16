import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Twilio sends form-encoded POST
    const contentType = req.headers.get("content-type") || "";
    let phoneNumber = "";
    let body = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const from = formData.get("From")?.toString() || "";
      body = formData.get("Body")?.toString()?.trim() || "";
      phoneNumber = from.replace("whatsapp:", "").replace("+", "");
    } else {
      // JSON fallback for testing
      const json = await req.json();
      phoneNumber = json.phoneNumber?.replace("+", "") || "";
      body = json.message?.trim() || "";
    }

    if (!phoneNumber || !body) {
      return new Response('<Response></Response>', {
        headers: { "Content-Type": "text/xml" },
        status: 200,
      });
    }

    console.log(`WhatsApp from ${phoneNumber}: ${body}`);

    // Find user by verified phone
    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("user_id, active")
      .eq("phone_number", phoneNumber)
      .eq("verified", true)
      .single();

    if (!connection) {
      await sendWhatsApp(phoneNumber,
        "📱 Número não vinculado ao FinDash Pro.\n\nAcesse o app → Configurações → WhatsApp para conectar sua conta.",
        TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!, TWILIO_WHATSAPP_NUMBER!
      );
      return twimlResponse();
    }

    if (!connection.active) {
      await sendWhatsApp(phoneNumber,
        "FinDash IA desativada. Reative em Configurações → WhatsApp.",
        TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!, TWILIO_WHATSAPP_NUMBER!
      );
      return twimlResponse();
    }

    const userId = connection.user_id;

    // Save inbound message
    await supabase.from("whatsapp_messages").insert({
      user_id: userId,
      phone_number: phoneNumber,
      direction: "inbound",
      message: body,
    });

    // Process with AI
    const response = await processMessage(supabase, userId, phoneNumber, body, LOVABLE_API_KEY!);

    // Send reply
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
      await sendWhatsApp(phoneNumber, response, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER);
    }

    // Save outbound
    await supabase.from("whatsapp_messages").insert({
      user_id: userId,
      phone_number: phoneNumber,
      direction: "outbound",
      message: response,
    });

    // Update stats
    await supabase.from("whatsapp_connections")
      .update({ last_message_at: new Date().toISOString() })
      .eq("user_id", userId);

    return twimlResponse();
  } catch (error) {
    console.error("Webhook error:", error);
    return twimlResponse();
  }
});

function twimlResponse() {
  return new Response('<Response></Response>', {
    headers: { "Content-Type": "text/xml" },
    status: 200,
  });
}

// ── PROCESS MESSAGE ──
async function processMessage(
  supabase: any,
  userId: string,
  phoneNumber: string,
  message: string,
  apiKey: string
): Promise<string> {
  const financialData = await loadFinancialData(supabase, userId);

  // Load context
  const { data: ctx } = await supabase
    .from("whatsapp_context")
    .select("messages, pending_confirmation")
    .eq("user_id", userId)
    .single();

  const history = ctx?.messages || [];
  const pending = ctx?.pending_confirmation;

  // Check confirmation
  const lower = message.toLowerCase().trim();
  if (pending) {
    if (["sim", "s", "ok", "yes", "confirmar", "1"].includes(lower)) {
      await clearPending(supabase, userId);
      return await registerTransaction(supabase, userId, pending, financialData);
    }
    if (["não", "nao", "n", "no", "cancelar", "2"].includes(lower)) {
      await clearPending(supabase, userId);
      return "❌ Cancelado! O que mais posso ajudar?";
    }
  }

  const systemPrompt = buildSystemPrompt(financialData);
  const messages = [
    ...history.slice(-6),
    { role: "user", content: message },
  ];

  // Call Lovable AI
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 600,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    if (aiResponse.status === 429) return "⏳ Muitas mensagens seguidas. Tente de novo em 1 minuto.";
    if (aiResponse.status === 402) return "⚠️ Limite de uso atingido. Entre no app para mais detalhes.";
    return "Ops! Tive um problema. Tente de novo em alguns segundos. 🙏";
  }

  const aiData = await aiResponse.json();
  const aiText = aiData.choices?.[0]?.message?.content || "";

  let finalResponse = aiText;

  // Try parse JSON action
  try {
    const jsonMatch = aiText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action === "register_transaction") {
        if (parsed.amount > 500) {
          await setPending(supabase, userId, parsed);
          finalResponse =
            `⚠️ Confirmar registro?\n\n` +
            `${parsed.type === "expense" ? "💸 Despesa" : "💰 Receita"}: *R$ ${parsed.amount.toFixed(2)}*\n` +
            `📝 ${parsed.description}\n` +
            `📂 ${parsed.category}\n\n` +
            `Responda *SIM* para confirmar ou *NÃO* para cancelar.`;
        } else {
          finalResponse = await registerTransaction(supabase, userId, parsed, financialData);
        }
      }
    }
  } catch {
    // Not JSON, use as-is
  }

  // Update context
  await supabase.from("whatsapp_context").upsert({
    user_id: userId,
    messages: [...messages, { role: "assistant", content: finalResponse }].slice(-10),
    updated_at: new Date().toISOString(),
  });

  return finalResponse;
}

// ── SYSTEM PROMPT ──
function buildSystemPrompt(data: any): string {
  return `Você é a FinDash IA no WhatsApp — assistente financeira pessoal.
Dados financeiros REAIS do usuário:

Nome: ${data.profile?.full_name || "usuário"}
Saldo este mês: R$ ${data.balance?.toFixed(2) || "0,00"}
Receitas: R$ ${data.income?.toFixed(2) || "0,00"}
Despesas: R$ ${data.expenses?.toFixed(2) || "0,00"}
Score: ${data.score || 0}/1000

Gastos por categoria:
${data.topCategories?.map((c: any) => `• ${c.category}: R$ ${c.total.toFixed(2)}`).join("\n") || "Nenhum"}

Dívidas ativas:
${data.debts?.map((d: any) => `• ${d.name}: R$ ${Number(d.remaining_amount).toFixed(2)}`).join("\n") || "Sem dívidas"}

Metas:
${data.goals?.map((g: any) => `• ${g.name}: ${((Number(g.current_amount || 0) / Number(g.target_amount)) * 100).toFixed(0)}%`).join("\n") || "Sem metas"}

INTENÇÕES:
1. REGISTRAR GASTO: "gastei", "paguei", "comprei" → Responda APENAS JSON:
{"action":"register_transaction","type":"expense","amount":50,"description":"mercado","category":"Supermercado"}

2. REGISTRAR RECEITA: "recebi", "entrou", "salário" → JSON similar com type:"income"

3. CONSULTAS: "quanto tenho", "meu saldo", "gastos" → texto com dados reais

4. CONSELHO: "posso comprar", "vale a pena" → conselho baseado nos dados

5. AJUDA: "ajuda", "comandos" → lista de exemplos

REGRAS:
- Nunca invente dados
- Para registro > R$ 500: inclua "needs_confirmation":true no JSON
- WhatsApp: respostas curtas (máx 5 linhas)
- Use *negrito* para valores, emojis com moderação
- Português brasileiro informal
- Para registros, responda SOMENTE com o JSON (sem texto extra)
- Categorias válidas despesa: Supermercado, Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Assinaturas, Contas, Financeiro, Outros
- Categorias válidas receita: Salário, Freelance, Vendas, Investimentos, Aluguel, Outro`;
}

// ── REGISTER TRANSACTION ──
async function registerTransaction(supabase: any, userId: string, action: any, data: any): Promise<string> {
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: action.type,
    amount: action.amount,
    description: action.description,
    category: action.category || "Outros",
    date: new Date().toISOString().split("T")[0],
    origin: "personal",
  });

  if (error) {
    console.error("Insert error:", error);
    return "❌ Erro ao registrar. Tente novamente.";
  }

  const newBalance = action.type === "income"
    ? data.balance + action.amount
    : data.balance - action.amount;

  // Check budget
  const budget = data.budgets?.find((b: any) => b.category === action.category);
  let budgetAlert = "";
  if (budget && action.type === "expense") {
    const newSpent = (budget.spent || 0) + action.amount;
    const pct = (newSpent / budget.limit_amount) * 100;
    if (pct >= 100) budgetAlert = `\n\n⚠️ Orçamento de ${action.category} *ultrapassado*!`;
    else if (pct >= 80) budgetAlert = `\n\n⚠️ ${pct.toFixed(0)}% do orçamento de ${action.category} usado.`;
  }

  return action.type === "expense"
    ? `✅ *Despesa registrada!*\n\n💸 R$ ${action.amount.toFixed(2)} em ${action.category}\n📝 ${action.description}\n💰 Saldo: *R$ ${newBalance.toFixed(2)}*${budgetAlert}`
    : `✅ *Receita registrada!*\n\n💰 R$ ${action.amount.toFixed(2)} em ${action.category}\n📝 ${action.description}\n💰 Saldo: *R$ ${newBalance.toFixed(2)}*${budgetAlert}`;
}

// ── LOAD FINANCIAL DATA ──
async function loadFinancialData(supabase: any, userId: string) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [txRes, debtRes, goalRes, budgetRes, profileRes, configRes] = await Promise.all([
    supabase.from("transactions").select("*").eq("user_id", userId).gte("date", firstDay).is("deleted_at", null),
    supabase.from("debts").select("*").eq("user_id", userId).eq("status", "active"),
    supabase.from("goals").select("*").eq("user_id", userId).is("deleted_at", null),
    supabase.from("budgets").select("*").eq("user_id", userId),
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("user_config").select("financial_score, streak_days").eq("user_id", userId).single(),
  ]);

  const transactions = txRes.data || [];
  const income = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const expenses = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

  const categoryMap: Record<string, number> = {};
  transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
  });

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, total]) => ({ category, total }));

  const budgetsWithSpent = (budgetRes.data || []).map((b: any) => ({
    ...b,
    spent: categoryMap[b.category] || 0,
  }));

  return {
    profile: profileRes.data,
    income,
    expenses,
    balance: income - expenses,
    topCategories,
    debts: debtRes.data || [],
    goals: goalRes.data || [],
    budgets: budgetsWithSpent,
    score: configRes.data?.financial_score || 0,
  };
}

// ── TWILIO SEND ──
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
  if (!resp.ok) console.error("Twilio error:", await resp.text());
}

// ── PENDING HELPERS ──
async function setPending(supabase: any, userId: string, action: any) {
  await supabase.from("whatsapp_context").upsert({
    user_id: userId,
    pending_confirmation: action,
    updated_at: new Date().toISOString(),
  });
}

async function clearPending(supabase: any, userId: string) {
  await supabase.from("whatsapp_context")
    .update({ pending_confirmation: null })
    .eq("user_id", userId);
}
