import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Adiciona um novo lançamento financeiro (receita ou despesa).",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição do lançamento" },
          amount: { type: "number", description: "Valor (sempre positivo)" },
          type: { type: "string", enum: ["income", "expense"], description: "income ou expense" },
          category: { type: "string", description: "Categoria" },
          origin: { type: "string", enum: ["personal", "business"], description: "personal ou business" },
          date: { type: "string", description: "YYYY-MM-DD (default: hoje)" },
        },
        required: ["description", "amount", "type", "category", "origin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_transaction",
      description: "Atualiza um lançamento existente.",
      parameters: {
        type: "object",
        properties: {
          transaction_id: { type: "string" },
          description: { type: "string" },
          amount: { type: "number" },
          category: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          origin: { type: "string", enum: ["personal", "business"] },
          date: { type: "string" },
        },
        required: ["transaction_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_transaction",
      description: "Exclui (soft delete) um lançamento.",
      parameters: {
        type: "object",
        properties: { transaction_id: { type: "string" } },
        required: ["transaction_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_transactions",
      description: "Busca lançamentos por descrição, categoria ou tipo.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto para buscar na descrição" },
          category: { type: "string" },
          type: { type: "string", enum: ["income", "expense"] },
          limit: { type: "number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_goal",
      description: "Cria uma nova meta financeira.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          target_amount: { type: "number" },
          current_amount: { type: "number" },
          deadline: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["name", "target_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_goal",
      description: "Atualiza uma meta existente.",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string" },
          name: { type: "string" },
          target_amount: { type: "number" },
          current_amount: { type: "number" },
          deadline: { type: "string" },
        },
        required: ["goal_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_investment",
      description: "Adiciona um novo investimento.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          asset_type: { type: "string", description: "Renda Fixa, Ações, FIIs, Cripto, Tesouro, Poupança, Outro" },
          invested_amount: { type: "number" },
          current_amount: { type: "number" },
        },
        required: ["name", "asset_type", "invested_amount", "current_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_budget",
      description: "Cria ou atualiza um orçamento mensal para uma categoria.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          limit_amount: { type: "number" },
          month_year: { type: "string", description: "YYYY-MM (default: mês atual)" },
        },
        required: ["category", "limit_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_scheduled_bill",
      description: "Adiciona uma conta a pagar/agendada.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
          category: { type: "string" },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          recurrent: { type: "boolean" },
          frequency: { type: "string", enum: ["weekly", "monthly", "yearly"] },
          origin: { type: "string", enum: ["personal", "business"] },
        },
        required: ["description", "amount", "category", "due_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pay_bill",
      description: "Marca uma conta a pagar como paga.",
      parameters: {
        type: "object",
        properties: { bill_id: { type: "string" } },
        required: ["bill_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_debt",
      description: "Adiciona uma nova dívida.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          creditor: { type: "string" },
          total_amount: { type: "number" },
          remaining_amount: { type: "number" },
          debt_type: { type: "string", enum: ["credit_card", "personal_loan", "bank_loan", "overdraft", "friend_family", "store_credit", "medical", "tax", "other"] },
          interest_rate: { type: "number" },
          due_day: { type: "number" },
          min_payment: { type: "number" },
        },
        required: ["name", "creditor", "total_amount", "remaining_amount", "debt_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_debt_payment",
      description: "Registra um pagamento em uma dívida existente.",
      parameters: {
        type: "object",
        properties: {
          debt_id: { type: "string" },
          amount: { type: "number" },
          payment_date: { type: "string" },
          notes: { type: "string" },
        },
        required: ["debt_id", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_recurring_transaction",
      description: "Cria uma transação recorrente.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          origin: { type: "string", enum: ["personal", "business"] },
          frequency: { type: "string", enum: ["weekly", "monthly", "yearly"] },
          day_of_month: { type: "number" },
          next_date: { type: "string" },
        },
        required: ["description", "amount", "type", "category", "origin", "frequency", "next_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_credit_card",
      description: "Adiciona um novo cartão de crédito.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          credit_limit: { type: "number" },
          last_four: { type: "string" },
          network: { type: "string", enum: ["visa", "mastercard", "elo", "amex", "hipercard", "other"] },
          closing_day: { type: "number" },
          due_day: { type: "number" },
        },
        required: ["name", "credit_limit"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Gera um resumo financeiro completo do usuário.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

async function executeTool(
  supabase: any,
  userId: string,
  name: string,
  args: any
): Promise<{ success: boolean; message: string; data?: any }> {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonthYear = today.slice(0, 7);
  try {
    switch (name) {
      case "add_transaction": {
        const { data, error } = await supabase.from("transactions").insert({
          user_id: userId, description: args.description, amount: args.amount,
          type: args.type, category: args.category, origin: args.origin,
          date: args.date || today,
        }).select().single();
        if (error) throw error;
        return { success: true, message: `Lançamento "${args.description}" de R$ ${args.amount.toFixed(2)} (${args.type === 'income' ? 'receita' : 'despesa'}) adicionado.`, data };
      }
      case "update_transaction": {
        const updates: any = {};
        if (args.description) updates.description = args.description;
        if (args.amount !== undefined) updates.amount = args.amount;
        if (args.category) updates.category = args.category;
        if (args.type) updates.type = args.type;
        if (args.origin) updates.origin = args.origin;
        if (args.date) updates.date = args.date;
        const { data, error } = await supabase.from("transactions").update(updates).eq("id", args.transaction_id).eq("user_id", userId).select().single();
        if (error) throw error;
        return { success: true, message: `Lançamento atualizado com sucesso.`, data };
      }
      case "delete_transaction": {
        const { error } = await supabase.from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", args.transaction_id).eq("user_id", userId);
        if (error) throw error;
        return { success: true, message: `Lançamento excluído.` };
      }
      case "search_transactions": {
        let query = supabase.from("transactions").select("id, description, amount, type, category, origin, date").eq("user_id", userId).is("deleted_at", null).order("date", { ascending: false }).limit(args.limit || 10);
        if (args.query) query = query.ilike("description", `%${args.query}%`);
        if (args.category) query = query.eq("category", args.category);
        if (args.type) query = query.eq("type", args.type);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, message: `Encontrados ${(data || []).length} lançamentos.`, data: data || [] };
      }
      case "add_goal": {
        const { data, error } = await supabase.from("goals").insert({
          user_id: userId, name: args.name, target_amount: args.target_amount,
          current_amount: args.current_amount || 0, deadline: args.deadline || null, start_date: today,
        }).select().single();
        if (error) throw error;
        return { success: true, message: `Meta "${args.name}" criada (alvo: R$ ${args.target_amount.toFixed(2)}).`, data };
      }
      case "update_goal": {
        const updates: any = {};
        if (args.name) updates.name = args.name;
        if (args.target_amount !== undefined) updates.target_amount = args.target_amount;
        if (args.current_amount !== undefined) updates.current_amount = args.current_amount;
        if (args.deadline) updates.deadline = args.deadline;
        const { data, error } = await supabase.from("goals").update(updates).eq("id", args.goal_id).eq("user_id", userId).select().single();
        if (error) throw error;
        return { success: true, message: `Meta atualizada.`, data };
      }
      case "add_investment": {
        const { data, error } = await supabase.from("investments").insert({
          user_id: userId, name: args.name, asset_type: args.asset_type,
          invested_amount: args.invested_amount, current_amount: args.current_amount, date: today,
        }).select().single();
        if (error) throw error;
        return { success: true, message: `Investimento "${args.name}" adicionado.`, data };
      }
      case "add_budget": {
        const monthYear = args.month_year || currentMonthYear;
        const { data: existing } = await supabase.from("budgets").select("id").eq("user_id", userId).eq("category", args.category).eq("month_year", monthYear).maybeSingle();
        if (existing) {
          const { error } = await supabase.from("budgets").update({ limit_amount: args.limit_amount }).eq("id", existing.id);
          if (error) throw error;
          return { success: true, message: `Orçamento de "${args.category}" atualizado para R$ ${args.limit_amount.toFixed(2)}.` };
        }
        const { error } = await supabase.from("budgets").insert({ user_id: userId, category: args.category, limit_amount: args.limit_amount, month_year: monthYear });
        if (error) throw error;
        return { success: true, message: `Orçamento de R$ ${args.limit_amount.toFixed(2)} criado para "${args.category}".` };
      }
      case "add_scheduled_bill": {
        const { data, error } = await supabase.from("scheduled_bills").insert({
          user_id: userId, description: args.description, amount: args.amount,
          category: args.category, due_date: args.due_date,
          recurrent: args.recurrent || false, frequency: args.frequency || null,
          origin: args.origin || "personal", status: "pending",
        }).select().single();
        if (error) throw error;
        return { success: true, message: `Conta "${args.description}" de R$ ${args.amount.toFixed(2)} agendada para ${args.due_date}.`, data };
      }
      case "pay_bill": {
        const { error } = await supabase.from("scheduled_bills").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", args.bill_id).eq("user_id", userId);
        if (error) throw error;
        return { success: true, message: `Conta marcada como paga.` };
      }
      case "add_debt": {
        const { data, error } = await supabase.from("debts").insert({
          user_id: userId, name: args.name, creditor: args.creditor,
          total_amount: args.total_amount, remaining_amount: args.remaining_amount,
          debt_type: args.debt_type, interest_rate: args.interest_rate || 0,
          due_day: args.due_day || null, min_payment: args.min_payment || 0,
          status: "active", strategy: "snowball",
        }).select().single();
        if (error) throw error;
        return { success: true, message: `Dívida "${args.name}" de R$ ${args.total_amount.toFixed(2)} adicionada.`, data };
      }
      case "add_debt_payment": {
        const { error: payError } = await supabase.from("debt_payments").insert({
          user_id: userId, debt_id: args.debt_id, amount: args.amount,
          payment_date: args.payment_date || today, notes: args.notes || null,
        });
        if (payError) throw payError;
        const { data: debt } = await supabase.from("debts").select("remaining_amount").eq("id", args.debt_id).single();
        if (debt) {
          const newRemaining = Math.max(0, debt.remaining_amount - args.amount);
          await supabase.from("debts").update({ remaining_amount: newRemaining, status: newRemaining <= 0 ? "paid" : "active" }).eq("id", args.debt_id);
        }
        return { success: true, message: `Pagamento de R$ ${args.amount.toFixed(2)} registrado.` };
      }
      case "add_recurring_transaction": {
        const { error } = await supabase.from("recurring_transactions").insert({
          user_id: userId, description: args.description, amount: args.amount,
          type: args.type, category: args.category, origin: args.origin,
          frequency: args.frequency, day_of_month: args.day_of_month || null,
          next_date: args.next_date, active: true,
        });
        if (error) throw error;
        return { success: true, message: `Recorrente "${args.description}" de R$ ${args.amount.toFixed(2)} criada.` };
      }
      case "add_credit_card": {
        const { data, error } = await supabase.from("credit_cards").insert({
          user_id: userId, name: args.name, credit_limit: args.credit_limit,
          last_four: args.last_four || null, network: args.network || "visa",
          closing_day: args.closing_day || null, due_day: args.due_day || null,
        }).select().single();
        if (error) throw error;
        return { success: true, message: `Cartão "${args.name}" adicionado.`, data };
      }
      case "get_financial_summary": {
        const [txRes, goalsRes, debtsRes, budgetsRes, billsRes, cardsRes, investRes] = await Promise.all([
          supabase.from("transactions").select("amount, type, category, date").eq("user_id", userId).is("deleted_at", null).order("date", { ascending: false }).limit(200),
          supabase.from("goals").select("name, target_amount, current_amount, deadline").eq("user_id", userId).is("deleted_at", null),
          supabase.from("debts").select("name, remaining_amount, total_amount, interest_rate, status").eq("user_id", userId).is("deleted_at", null),
          supabase.from("budgets").select("category, limit_amount, month_year").eq("user_id", userId).eq("month_year", currentMonthYear),
          supabase.from("scheduled_bills").select("description, amount, due_date, status").eq("user_id", userId).eq("status", "pending"),
          supabase.from("credit_cards").select("name, credit_limit, used_amount").eq("user_id", userId),
          supabase.from("investments").select("name, invested_amount, current_amount, asset_type").eq("user_id", userId),
        ]);
        const txs = txRes.data || [];
        const thisMonthTxs = txs.filter((t: any) => t.date?.startsWith(currentMonthYear));
        const income = thisMonthTxs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
        const expense = thisMonthTxs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
        const totalDebt = (debtsRes.data || []).filter((d: any) => d.status === "active").reduce((s: number, d: any) => s + d.remaining_amount, 0);
        const catExpenses: Record<string, number> = {};
        thisMonthTxs.filter((t: any) => t.type === "expense").forEach((t: any) => { catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount; });
        return {
          success: true, message: "Resumo financeiro completo gerado.",
          data: {
            month: currentMonthYear, income, expense, balance: income - expense,
            savings_rate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
            total_debt: totalDebt,
            goals: goalsRes.data || [], pending_bills: billsRes.data || [],
            top_expenses: Object.entries(catExpenses).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, val]) => ({ category: cat, amount: val })),
            cards: cardsRes.data || [], active_debts: (debtsRes.data || []).filter((d: any) => d.status === "active"),
          },
        };
      }
      default:
        return { success: false, message: `Ferramenta "${name}" não reconhecida.` };
    }
  } catch (e: any) {
    console.error(`Tool ${name} error:`, e);
    return { success: false, message: `Erro ao executar ${name}: ${e.message}` };
  }
}

function buildFinancialContext(
  userName: string,
  config: any,
  transactions: any[],
  goals: any[],
  investments: any[],
  debts: any[],
  budgets: any[],
  bills: any[],
  cards: any[],
  recurring: any[]
): string {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTx = transactions.filter((t: any) => t.date?.startsWith(currentMonth));
  const totalIncome = thisMonthTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = thisMonthTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
  const totalDebt = debts.filter((d: any) => d.status === "active").reduce((s: number, d: any) => s + d.remaining_amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const catExpenses: Record<string, number> = {};
  thisMonthTx.filter((t: any) => t.type === "expense").forEach((t: any) => {
    catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
  });

  // Previous month comparison
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);
  const prevMonthTx = transactions.filter((t: any) => t.date?.startsWith(prevMonthStr));
  const prevExpense = prevMonthTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
  const prevIncome = prevMonthTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);

  const expenseChange = prevExpense > 0 ? ((totalExpense / prevExpense - 1) * 100).toFixed(0) : "N/A";
  const totalInvested = investments.reduce((s: number, i: any) => s + i.current_amount, 0);

  return `
━━━ DADOS FINANCEIROS REAIS DE ${userName.toUpperCase()} (${new Date().toLocaleDateString('pt-BR')}) ━━━

📊 RESUMO DO MÊS ATUAL (${currentMonth}):
- Receitas: R$ ${totalIncome.toFixed(2)}
- Despesas: R$ ${totalExpense.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)} ${balance >= 0 ? '✅' : '⚠️ NEGATIVO'}
- Taxa de poupança: ${savingsRate}%
- Comparação: despesas ${expenseChange}% vs mês anterior
- Receita mês passado: R$ ${prevIncome.toFixed(2)} | Despesa: R$ ${prevExpense.toFixed(2)}

💸 GASTOS POR CATEGORIA (mês atual):
${Object.entries(catExpenses).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, val]) => `  • ${cat}: R$ ${(val as number).toFixed(2)}`).join("\n") || "  Nenhum gasto registrado"}

📋 ORÇAMENTOS:
${budgets.filter((b: any) => b.month_year === currentMonth).map((b: any) => {
  const spent = catExpenses[b.category] || 0;
  const pct = Math.round((spent / b.limit_amount) * 100);
  return `  • ${b.category}: R$ ${spent.toFixed(2)} / R$ ${b.limit_amount.toFixed(2)} (${pct}%) ${pct > 100 ? '🔴 ESTOURADO' : pct > 80 ? '⚠️ PERTO DO LIMITE' : '✅'}`;
}).join("\n") || "  Nenhum orçamento definido"}

🎯 METAS:
${goals.map((g: any) => {
  const pct = Math.round(((g.current_amount || 0) / g.target_amount) * 100);
  return `  [${g.id}] ${g.name}: R$ ${(g.current_amount || 0).toFixed(2)} / R$ ${g.target_amount.toFixed(2)} (${pct}%)${g.deadline ? ` prazo: ${g.deadline}` : ''}`;
}).join("\n") || "  Nenhuma meta"}

💰 INVESTIMENTOS (Total: R$ ${totalInvested.toFixed(2)}):
${investments.map((i: any) => {
  const ret = i.invested_amount > 0 ? ((i.current_amount - i.invested_amount) / i.invested_amount * 100).toFixed(1) : "0.0";
  return `  [${i.id}] ${i.name} (${i.asset_type}): R$ ${i.current_amount.toFixed(2)} (retorno: ${ret}%)`;
}).join("\n") || "  Nenhum"}

💸 DÍVIDAS (Total: R$ ${totalDebt.toFixed(2)}):
${debts.filter((d: any) => d.status === "active").map((d: any) => `  [${d.id}] ${d.name} (${d.creditor}): R$ ${d.remaining_amount.toFixed(2)} / R$ ${d.total_amount.toFixed(2)} | juros: ${d.interest_rate || 0}%/mês`).join("\n") || "  Nenhuma"}

📅 CONTAS A PAGAR:
${bills.filter((b: any) => b.status === "pending").slice(0, 10).map((b: any) => `  [${b.id}] ${b.due_date} | ${b.description}: R$ ${b.amount.toFixed(2)}`).join("\n") || "  Nenhuma pendente"}

💳 CARTÕES:
${cards.map((c: any) => `  [${c.id}] ${c.name}: R$ ${(c.used_amount || 0).toFixed(2)} / R$ ${c.credit_limit.toFixed(2)}${c.due_day ? ` | vence dia ${c.due_day}` : ''}`).join("\n") || "  Nenhum"}

🔄 RECORRENTES:
${recurring.map((r: any) => `  ${r.description}: R$ ${r.amount.toFixed(2)} (${r.type}, ${r.frequency}) próxima: ${r.next_date}`).join("\n") || "  Nenhuma"}

📝 ÚLTIMOS 25 LANÇAMENTOS:
${transactions.slice(0, 25).map((t: any) => `  [${t.id}] ${t.date} | ${t.description} | R$ ${t.amount.toFixed(2)} | ${t.type} | ${t.category}`).join("\n") || "  Nenhum"}

🏆 Score: ${config?.financial_score || 0}/1000 | Streak: ${config?.streak_days || 0} dias | Nível: ${config?.level || "iniciante"}
📊 Perfil: ${config?.profile_type || "personal"} | Plano: ${config?.plan || "free"}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnon);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all financial data
    const [txRes, goalsRes, configRes, investRes, debtsRes, budgetsRes, billsRes, cardsRes, recurringRes, profileRes] = await Promise.all([
      serviceClient.from("transactions").select("id, description, amount, type, category, origin, date").eq("user_id", userId).is("deleted_at", null).order("date", { ascending: false }).limit(200),
      serviceClient.from("goals").select("*").eq("user_id", userId).is("deleted_at", null),
      serviceClient.from("user_config").select("*").eq("user_id", userId).single(),
      serviceClient.from("investments").select("*").eq("user_id", userId),
      serviceClient.from("debts").select("*").eq("user_id", userId).is("deleted_at", null),
      serviceClient.from("budgets").select("*").eq("user_id", userId),
      serviceClient.from("scheduled_bills").select("*").eq("user_id", userId).order("due_date", { ascending: true }).limit(20),
      serviceClient.from("credit_cards").select("*").eq("user_id", userId),
      serviceClient.from("recurring_transactions").select("*").eq("user_id", userId).eq("active", true),
      serviceClient.from("profiles").select("full_name").eq("id", userId).single(),
    ]);

    const transactions = txRes.data || [];
    const goals = goalsRes.data || [];
    const config = configRes.data;
    const investments = investRes.data || [];
    const debts = debtsRes.data || [];
    const budgets = budgetsRes.data || [];
    const bills = billsRes.data || [];
    const cards = cardsRes.data || [];
    const recurring = recurringRes.data || [];
    const userName = profileRes.data?.full_name || "usuário";

    const financialContext = buildFinancialContext(userName, config, transactions, goals, investments, debts, budgets, bills, cards, recurring);

    const { messages, stream: wantStream } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é a **FinDash IA** — assistente financeira pessoal de ${userName} no FinDash Pro.

## Personalidade
- Amigável, direta e motivadora — como uma amiga especialista em finanças
- Português brasileiro informal ("você", não "o senhor")
- Use os dados reais SEMPRE — mencione valores específicos do contexto
- Concisa: máximo 4 parágrafos por resposta
- Use emojis com moderação. Formate com markdown: **negrito**, listas e tabelas.
- Quando identificar um problema, ofereça uma solução prática

## Capacidades — USE AS FERRAMENTAS quando o usuário pedir:
- ✅ Adicionar/atualizar/excluir lançamentos, metas, investimentos
- ✅ Criar/atualizar orçamentos, contas a pagar, dívidas, cartões
- ✅ Registrar pagamentos de dívidas, transações recorrentes
- ✅ Gerar resumo financeiro completo com análise de tendências

## Análise Inteligente
Ao analisar finanças:
- Compare receita vs despesa e calcule taxa de poupança
- Identifique top 3 categorias de gasto
- Verifique orçamentos estourados/quase estourados
- Analise progresso das metas vs deadline
- Avalie custo real das dívidas (juros compostos)
- Sugira cortes específicos baseados nos dados
- Projete tendências e faça simulações

## Regras
1. NUNCA invente dados — use APENAS o contexto fornecido
2. Quando pedirem alteração, USE AS FERRAMENTAS
3. Para atualizar/excluir, use search_transactions se precisar do ID
4. Confirme ações com detalhes específicos
5. Alerte proativamente sobre orçamentos estourados e contas próximas
6. Para investimentos, deixe claro que não é consultoria regulada

${financialContext}`;

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Phase 1: Tool-calling loop (non-streaming)
    let actionsSummary: string[] = [];
    let maxIterations = 8;

    while (maxIterations > 0) {
      maxIterations--;

      const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
          tools: TOOLS,
          stream: false,
        }),
      });

      if (!toolResponse.ok) {
        const status = toolResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await toolResponse.json();
      const choice = result.choices?.[0];
      if (!choice) return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const msg = choice.message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        aiMessages.push(msg);
        for (const toolCall of msg.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs: any;
          try {
            fnArgs = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments || {};
          } catch { fnArgs = {}; }
          console.log(`Executing tool: ${fnName}`, JSON.stringify(fnArgs));
          const toolResult = await executeTool(serviceClient, userId, fnName, fnArgs);
          actionsSummary.push(toolResult.message);
          aiMessages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
        }
        continue;
      }

      // No more tool calls — check if we want streaming final response
      if (wantStream) {
        // Phase 2: Stream the final response with gemini-2.5-pro for quality
        const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: aiMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok || !streamResponse.body) {
          const fallback = msg.content || "Desculpe, erro ao gerar resposta.";
          return new Response(JSON.stringify({ reply: fallback, actions: actionsSummary.length > 0 ? actionsSummary : undefined }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prepend actions as a special SSE event
        const encoder = new TextEncoder();
        const reader = streamResponse.body.getReader();

        const readable = new ReadableStream({
          async start(controller) {
            // Send actions first
            if (actionsSummary.length > 0) {
              const actionsEvent = JSON.stringify({ type: "actions", actions: actionsSummary });
              controller.enqueue(encoder.encode(`data: ${actionsEvent}\n\n`));
            }

            // Pipe through the SSE stream
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          },
        });

        return new Response(readable, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
        });
      }

      // Non-streaming fallback
      const finalResponse = msg.content || (actionsSummary.length > 0 ? "✅ Ações executadas com sucesso!" : "Desculpe, não consegui processar.");
      return new Response(JSON.stringify({
        reply: finalResponse,
        actions: actionsSummary.length > 0 ? actionsSummary : undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exhausted iterations
    return new Response(JSON.stringify({
      reply: actionsSummary.length > 0 ? "✅ Ações executadas!" : "Desculpe, não consegui processar.",
      actions: actionsSummary.length > 0 ? actionsSummary : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
