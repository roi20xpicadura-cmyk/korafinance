// Edge function: debt-coach
// Recebe as dívidas + contexto financeiro do usuário e devolve análise da Kora IA:
// - estratégia recomendada (avalanche/snowball/hibrida) com justificativa
// - dívidas perigosas (rotativo, juros altos, mínimo não cobre juros)
// - plano mensal personalizado dos próximos 6 meses
// - frase motivacional
// - sugestões de negociação por credor

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface DebtRow {
  id: string;
  name: string;
  creditor: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  min_payment: number;
  debt_type: string;
  status: string;
}

interface CoachResponse {
  strategy: {
    recommended: "avalanche" | "snowball" | "hybrid";
    label: string;
    reason: string;
    estimated_savings: number; // R$ em juros economizados vs estratégia oposta
  };
  freedom: {
    months: number | null;
    free_date: string | null; // YYYY-MM
    motivational: string;
  };
  dangerous_debts: Array<{
    debt_id: string;
    debt_name: string;
    severity: "critical" | "high" | "medium";
    reason: string;
    monthly_loss: number;
  }>;
  monthly_plan: Array<{
    month_label: string; // "Janeiro/26"
    focus_debt_id: string | null;
    focus_debt_name: string;
    suggested_payment: number;
    note: string;
  }>;
  negotiation_tips: Array<{
    debt_id: string;
    debt_name: string;
    creditor_type: string; // "banco", "cartão", "fintech", "loja", "amigo"
    script: string; // texto pronto pra copiar
    target_discount: string; // ex "40-60% à vista"
  }>;
}

function detectCreditorType(name: string, type: string): string {
  const n = (name || "").toLowerCase();
  if (type === "credit_card" || /cart[aã]o|nubank|inter|c6|itau|bradesco|santander/.test(n)) return "cartão";
  if (type === "bank_loan" || /banco|caixa/.test(n)) return "banco";
  if (type === "personal_loan" || /pessoal|cred[ií]to/.test(n)) return "fintech";
  if (type === "store_credit" || /loja|magazine|americanas/.test(n)) return "loja";
  if (type === "friend_family") return "amigo";
  if (type === "overdraft") return "banco";
  return "outro";
}

function calcMonthsToFree(remaining: number, monthlyRate: number, payment: number): number | null {
  if (payment <= 0 || remaining <= 0) return null;
  if (monthlyRate <= 0) return Math.ceil(remaining / payment);
  if (payment <= remaining * monthlyRate) return null; // dívida eterna
  let rem = remaining;
  for (let m = 1; m <= 360; m++) {
    rem = rem + rem * monthlyRate - payment;
    if (rem <= 0) return m;
  }
  return null;
}

function simulatePayoff(debts: DebtRow[], strategy: "avalanche" | "snowball"): { months: number | null; totalInterest: number } {
  const valid = debts
    .filter((d) => Number(d.interest_rate) > 0 && Number(d.min_payment) > 0)
    .map((d) => ({
      rem: Number(d.remaining_amount),
      rate: Number(d.interest_rate) / 100,
      min: Number(d.min_payment),
    }));
  if (valid.length === 0) return { months: null, totalInterest: 0 };
  if (strategy === "snowball") valid.sort((a, b) => a.rem - b.rem);
  else valid.sort((a, b) => b.rate - a.rate);

  let months = 0;
  let totalInt = 0;
  let queue = valid;
  while (queue.length > 0 && months < 360) {
    months++;
    const stuck = queue.some((d) => d.min <= d.rem * d.rate);
    if (stuck && months === 1) return { months: null, totalInterest: 0 };
    for (const d of queue) {
      const interest = d.rem * d.rate;
      totalInt += interest;
      d.rem = d.rem + interest - d.min;
    }
    const paid = queue.filter((d) => d.rem <= 0);
    if (paid.length > 0) {
      const extra = paid.reduce((s, d) => s + d.min, 0);
      queue = queue.filter((d) => d.rem > 0);
      if (queue.length > 0) queue[0].min += extra;
    }
  }
  return { months: queue.length > 0 ? null : months, totalInterest: totalInt };
}

function buildHeuristicAnalysis(
  debts: DebtRow[],
  monthlyIncome: number,
  monthlyExpenses: number,
): CoachResponse {
  const active = debts.filter((d) => d.status === "active");

  // 1. Estratégia: avalanche se houver juros altos (>5%/mês), snowball se forem todas próximas
  const rates = active.map((d) => Number(d.interest_rate)).filter((r) => r > 0);
  const maxRate = rates.length ? Math.max(...rates) : 0;
  const minRate = rates.length ? Math.min(...rates) : 0;
  const rateSpread = maxRate - minRate;

  const avSim = simulatePayoff(active, "avalanche");
  const snSim = simulatePayoff(active, "snowball");
  const savings = Math.max(0, snSim.totalInterest - avSim.totalInterest);

  let recommended: "avalanche" | "snowball" | "hybrid" = "avalanche";
  let reason = "";
  if (maxRate >= 8 && rateSpread >= 4) {
    recommended = "avalanche";
    reason = `Você tem dívidas com juros muito diferentes (${minRate.toFixed(1)}% a ${maxRate.toFixed(1)}%/mês). Atacar as mais caras primeiro economiza R$ ${savings.toFixed(0)} em juros.`;
  } else if (active.length >= 3 && rateSpread < 3) {
    recommended = "snowball";
    reason = `Suas dívidas têm juros parecidos. Quitar primeiro as menores te dá vitórias rápidas e mantém a motivação.`;
  } else if (active.length >= 4 && maxRate >= 6) {
    recommended = "hybrid";
    reason = `Você tem muitas dívidas — comece quitando 1 ou 2 pequenas pra ganhar fôlego, depois ataque as de juros mais altos.`;
  } else {
    recommended = "avalanche";
    reason = `A estratégia Avalanche te faz pagar menos juros no total.`;
  }

  // 2. Dívidas perigosas
  const dangerous: CoachResponse["dangerous_debts"] = [];
  for (const d of active) {
    const rate = Number(d.interest_rate);
    const rem = Number(d.remaining_amount);
    const min = Number(d.min_payment);
    const monthlyInterest = rem * rate / 100;
    if (rate > 0 && min > 0 && min <= monthlyInterest) {
      dangerous.push({
        debt_id: d.id,
        debt_name: d.name,
        severity: "critical",
        reason: `Pagamento mínimo (R$ ${min.toFixed(0)}) não cobre os juros (R$ ${monthlyInterest.toFixed(0)}/mês). Essa dívida nunca acaba.`,
        monthly_loss: monthlyInterest - min,
      });
    } else if (rate >= 10) {
      dangerous.push({
        debt_id: d.id,
        debt_name: d.name,
        severity: "critical",
        reason: `Juros de ${rate}%/mês = ${(((Math.pow(1 + rate / 100, 12) - 1) * 100).toFixed(0))}% ao ano. É rotativo de cartão ou agiota.`,
        monthly_loss: monthlyInterest,
      });
    } else if (rate >= 5) {
      dangerous.push({
        debt_id: d.id,
        debt_name: d.name,
        severity: "high",
        reason: `Juros de ${rate}%/mês são altos. Considere renegociar ou portabilidade.`,
        monthly_loss: monthlyInterest,
      });
    }
  }
  dangerous.sort((a, b) => b.monthly_loss - a.monthly_loss);

  // 3. Frase motivacional
  const months = avSim.months;
  let motivational = "";
  let freeDate: string | null = null;
  if (months) {
    const fd = new Date();
    fd.setMonth(fd.getMonth() + months);
    freeDate = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, "0")}`;
    if (months <= 6) motivational = `Faltam só ${months} meses! Você está na reta final 🚀`;
    else if (months <= 12) motivational = `Em ${months} meses você estará livre. É menos de 1 ano! 💪`;
    else if (months <= 24) motivational = `${months} meses parecem muito, mas cada pagamento te aproxima da liberdade.`;
    else motivational = `Vai levar ${(months / 12).toFixed(1)} anos no ritmo atual. Bora acelerar com pagamentos extras?`;
  } else {
    motivational = `Complete os dados das dívidas pra eu calcular quando você fica livre.`;
  }

  // 4. Plano mensal — usa a estratégia recomendada e simula 6 meses
  const planQueue = active
    .filter((d) => Number(d.interest_rate) > 0 && Number(d.min_payment) > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      rem: Number(d.remaining_amount),
      rate: Number(d.interest_rate) / 100,
      min: Number(d.min_payment),
    }));
  if (recommended === "snowball") planQueue.sort((a, b) => a.rem - b.rem);
  else planQueue.sort((a, b) => b.rate - a.rate);

  const monthly_plan: CoachResponse["monthly_plan"] = [];
  let q = planQueue.map((x) => ({ ...x }));
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  for (let m = 0; m < 6 && q.length > 0; m++) {
    const dt = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = `${monthNames[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`;
    const focus = q[0];
    const totalMin = q.reduce((s, d) => s + d.min, 0);
    monthly_plan.push({
      month_label: label,
      focus_debt_id: focus.id,
      focus_debt_name: focus.name,
      suggested_payment: focus.min,
      note: q.length > 1
        ? `Pague mínimo nas outras (R$ ${(totalMin - focus.min).toFixed(0)}) e foque o extra aqui.`
        : `Última dívida! Coloque tudo que puder.`,
    });
    // simula o mês
    for (const d of q) {
      d.rem = d.rem + d.rem * d.rate - d.min;
    }
    const paid = q.filter((d) => d.rem <= 0);
    if (paid.length > 0) {
      const extra = paid.reduce((s, d) => s + d.min, 0);
      q = q.filter((d) => d.rem > 0);
      if (q.length > 0) q[0].min += extra;
    }
  }

  // 5. Negociação assistida — script por tipo de credor pras top 3 perigosas (ou top 3 dívidas)
  const negotiation_tips: CoachResponse["negotiation_tips"] = [];
  const targets = (dangerous.length > 0 ? dangerous.slice(0, 3) : active.slice(0, 3).map((d) => ({ debt_id: d.id, debt_name: d.name }))) as Array<{ debt_id: string; debt_name: string }>;
  for (const t of targets) {
    const debt = active.find((d) => d.id === t.debt_id);
    if (!debt) continue;
    const ctype = detectCreditorType(debt.name, debt.debt_type);
    let script = "";
    let target_discount = "30-50% à vista";
    if (ctype === "cartão") {
      target_discount = "40-60% à vista, ou parcelamento sem juros";
      script = `Olá, sou cliente do ${debt.name} e quero quitar minha dívida de R$ ${Number(debt.remaining_amount).toFixed(0)}. Estou enfrentando dificuldade financeira e vi que vocês têm campanhas de renegociação. Qual o melhor desconto à vista que vocês podem oferecer? Se não der à vista, qual o parcelamento sem juros disponível? Posso pagar em até 10x.`;
    } else if (ctype === "banco") {
      target_discount = "30-50% à vista, ou portabilidade pra taxa menor";
      script = `Olá, tenho um empréstimo de R$ ${Number(debt.remaining_amount).toFixed(0)} no ${debt.name} com taxa de ${debt.interest_rate}%/mês. Gostaria de renegociar — ou pra um desconto à vista, ou pra reduzir a taxa de juros. Sou cliente há tempo e estou cogitando portabilidade pra outro banco. Qual a melhor proposta vocês têm?`;
    } else if (ctype === "fintech") {
      target_discount = "30-50% à vista";
      script = `Olá, tenho uma dívida de R$ ${Number(debt.remaining_amount).toFixed(0)} com vocês e quero quitar. Quero saber qual o desconto à vista disponível, ou um acordo pra parcelar com taxa reduzida. Estou disposto a pagar nas próximas semanas se a proposta for boa.`;
    } else if (ctype === "loja") {
      target_discount = "50-70% à vista (lojas costumam dar muito desconto)";
      script = `Olá, tenho uma dívida de R$ ${Number(debt.remaining_amount).toFixed(0)} no crediário com vocês e quero quitar à vista. Sei que vocês trabalham com bons descontos pra quitação. Qual o melhor valor à vista que vocês conseguem? Posso pagar essa semana.`;
    } else if (ctype === "amigo") {
      target_discount = "negociar prazo, sem desconto";
      script = `Oi, sobre os R$ ${Number(debt.remaining_amount).toFixed(0)} que te devo: estou organizando minhas finanças e quero combinar um plano de pagamento que eu consiga cumprir. Posso te pagar R$ X por mês até quitar tudo. O que acha?`;
    } else {
      script = `Olá, tenho uma dívida de R$ ${Number(debt.remaining_amount).toFixed(0)} e gostaria de renegociar. Qual o melhor desconto à vista, ou condições de parcelamento que vocês oferecem?`;
    }
    negotiation_tips.push({
      debt_id: t.debt_id,
      debt_name: t.debt_name,
      creditor_type: ctype,
      script,
      target_discount,
    });
  }

  return {
    strategy: {
      recommended,
      label: recommended === "avalanche" ? "Avalanche" : recommended === "snowball" ? "Bola de Neve" : "Híbrida",
      reason,
      estimated_savings: savings,
    },
    freedom: { months, free_date: freeDate, motivational },
    dangerous_debts: dangerous.slice(0, 5),
    monthly_plan,
    negotiation_tips,
  };
}

async function enhanceWithAI(base: CoachResponse, monthlyIncome: number, monthlyExpenses: number, debtCount: number): Promise<CoachResponse> {
  if (!LOVABLE_API_KEY) return base;

  // Pede pra IA reescrever só a frase motivacional + reason da estratégia em tom Kora,
  // mantendo todos os números do cálculo determinístico (mais confiável).
  try {
    const sobra = monthlyIncome - monthlyExpenses;
    const prompt = `Você é a Kora, coach financeira do app KoraFinance. Tom: direta, motivacional, brasileira, sem ser piegas. Use 1-2 emojis no máximo.

Contexto do usuário:
- ${debtCount} dívida(s) ativa(s)
- Renda média: R$ ${monthlyIncome.toFixed(0)}/mês, gastos: R$ ${monthlyExpenses.toFixed(0)}/mês (sobra R$ ${sobra.toFixed(0)})
- Estratégia recomendada: ${base.strategy.label}
- Tempo até a liberdade: ${base.freedom.months ?? "indefinido"} meses
- Economia em juros: R$ ${base.strategy.estimated_savings.toFixed(0)}

Reescreva em JSON estes 2 textos (curtos, max 2 linhas cada, em PT-BR):
1. "strategy_reason": justificativa pra usar ${base.strategy.label}
2. "motivational": frase motivacional sobre o tempo até a liberdade

Responda APENAS JSON: {"strategy_reason": "...", "motivational": "..."}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return base;
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return base;
    const parsed = JSON.parse(m[0]);
    if (parsed.strategy_reason) base.strategy.reason = String(parsed.strategy_reason).slice(0, 240);
    if (parsed.motivational) base.freedom.motivational = String(parsed.motivational).slice(0, 200);
    return base;
  } catch (e) {
    console.error("[debt-coach] AI enhance failed:", e);
    return base;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Carrega dívidas ativas
    const { data: debts } = await admin
      .from("debts")
      .select("id, name, creditor, total_amount, remaining_amount, interest_rate, min_payment, debt_type, status")
      .eq("user_id", userId)
      .is("deleted_at", null);

    const activeDebts = (debts || []).filter((d) => d.status === "active") as DebtRow[];
    if (activeDebts.length === 0) {
      return new Response(JSON.stringify({
        strategy: { recommended: "avalanche", label: "Avalanche", reason: "Sem dívidas ativas pra analisar.", estimated_savings: 0 },
        freedom: { months: 0, free_date: null, motivational: "Você está livre das dívidas! 🎉" },
        dangerous_debts: [],
        monthly_plan: [],
        negotiation_tips: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Carrega renda + gastos médios dos últimos 3 meses
    const since = new Date();
    since.setMonth(since.getMonth() - 3);
    const { data: txs } = await admin
      .from("transactions")
      .select("type, amount, date")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("date", since.toISOString().split("T")[0]);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of txs || []) {
      if (t.type === "income") totalIncome += Number(t.amount);
      else if (t.type === "expense") totalExpense += Number(t.amount);
    }
    const monthlyIncome = totalIncome / 3;
    const monthlyExpenses = totalExpense / 3;

    // 3. Análise heurística determinística
    const base = buildHeuristicAnalysis(activeDebts, monthlyIncome, monthlyExpenses);

    // 4. Polimento dos textos com IA (opcional, falha silenciosa)
    const enhanced = await enhanceWithAI(base, monthlyIncome, monthlyExpenses, activeDebts.length);

    return new Response(JSON.stringify(enhanced), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[debt-coach] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});