import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID")!;
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fmt(v: number): string {
  return "R$ " + (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function brDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("pt-BR");
}

async function fetchTransactions(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("date, type, amount, category, description, origin")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchUserName(userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  return data?.full_name?.split(" ")[0] || "usuário";
}

function buildSummaryText(name: string, periodLabel: string, txs: any[]): string {
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

  const catMap: Record<string, number> = {};
  txs.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category || "Outros"] = (catMap[t.category || "Outros"] || 0) + Number(t.amount);
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalCatExp = topCats.reduce((s, [, v]) => s + v, 0) || 1;

  // Mini barra de progresso ASCII por categoria
  const catLines = topCats.length
    ? topCats.map(([c, v], i) => {
        const pct = (v / totalCatExp) * 100;
        const filled = Math.round(pct / 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        const medal = ["🥇", "🥈", "🥉", "  ", "  "][i] || "  ";
        return `${medal} *${c}*\n     ${bar} ${pct.toFixed(0)}%  ·  ${fmt(v)}`;
      }).join("\n\n")
    : "_Nenhum gasto registrado_";

  const balanceEmoji = balance >= 0 ? "🟢" : "🔴";
  const trendEmoji = savingsRate >= 20 ? "🚀" : savingsRate >= 10 ? "📈" : savingsRate >= 0 ? "⚖️" : "⚠️";
  const trendMsg = savingsRate >= 20 ? "Excelente economia!"
    : savingsRate >= 10 ? "Bom controle!"
    : savingsRate >= 0 ? "Equilibrado"
    : "Atenção: gastos > receitas";

  return `╔══════════════════════╗
   📊 *RESUMO FINANCEIRO*
╚══════════════════════╝

👤 *${name}*
📅 ${periodLabel}
📝 ${txs.length} ${txs.length === 1 ? "lançamento" : "lançamentos"}

━━━━━━━━━━━━━━━━━━━━

💰 *Receitas*
    ${fmt(income)}

💸 *Despesas*
    ${fmt(expenses)}

${balanceEmoji} *Saldo Líquido*
    *${fmt(balance)}*
    ${trendEmoji} ${trendMsg} _(${savingsRate.toFixed(1)}%)_

━━━━━━━━━━━━━━━━━━━━

🏆 *TOP CATEGORIAS DE GASTO*

${catLines}

━━━━━━━━━━━━━━━━━━━━

💡 _Quer o relatório completo?_
_Manda: "me envia o PDF do mês"_

🐨 *Kora IA* · KoraFinance`;
}

function buildCSV(txs: any[], periodLabel: string, name: string): string {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;
  const ts = new Date().toLocaleString("pt-BR");

  const meta = [
    `# KoraFinance — Relatório Financeiro`,
    `# Cliente: ${name}`,
    `# Período: ${periodLabel}`,
    `# Gerado em: ${ts}`,
    `# Total de lançamentos: ${txs.length}`,
    `# Receitas: ${fmt(income)}`,
    `# Despesas: ${fmt(expenses)}`,
    `# Saldo: ${fmt(balance)}`,
    `#`,
    `# korafinance.app`,
    ``,
  ].join("\n");

  const header = "Data,Tipo,Valor,Categoria,Descrição,Origem\n";
  const rows = txs.map(t => {
    return [
      brDate(t.date),
      t.type === "income" ? "Receita" : "Despesa",
      Number(t.amount).toFixed(2).replace(".", ","),
      escape(t.category),
      escape(t.description),
      escape(t.origin === "business" ? "Negócio" : "Pessoal"),
    ].join(",");
  }).join("\n");

  // Linha de totais ao final
  const footer = `\n\n,,${expenses.toFixed(2).replace(".", ",")},TOTAL DESPESAS,,\n,,${income.toFixed(2).replace(".", ",")},TOTAL RECEITAS,,\n,,${balance.toFixed(2).replace(".", ",")},SALDO,,`;

  return "\uFEFF" + meta + header + rows + footer; // BOM for Excel UTF-8
}

// Brand palette — KoraFinance roxo
const BRAND: [number, number, number] = [124, 58, 237];        // #7C3AED
const BRAND_DARK: [number, number, number] = [91, 33, 182];    // #5B21B6
const BRAND_LIGHT: [number, number, number] = [237, 233, 254]; // #EDE9FE
const SUCCESS: [number, number, number] = [22, 163, 74];
const DANGER: [number, number, number] = [220, 38, 38];
const INK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];

function drawKoraLogo(doc: any, x: number, y: number) {
  // Rounded square badge with stylized "K"
  doc.setFillColor(...BRAND);
  doc.roundedRect(x, y, 12, 12, 2.5, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("K", x + 6, y + 8.4, { align: "center" });
  doc.setFont("helvetica", "normal");
}

function buildPDF(name: string, periodLabel: string, txs: any[]): Uint8Array {
  const doc = new jsPDF();
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  // ── Header com gradiente simulado ──
  for (let i = 0; i < 38; i++) {
    const t = i / 38;
    const r = Math.round(BRAND_DARK[0] + (BRAND[0] - BRAND_DARK[0]) * t);
    const g = Math.round(BRAND_DARK[1] + (BRAND[1] - BRAND_DARK[1]) * t);
    const b = Math.round(BRAND_DARK[2] + (BRAND[2] - BRAND_DARK[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 1.05, "F");
  }
  drawKoraLogo(doc, 14, 10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("KoraFinance", 30, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Relatório Financeiro · ${periodLabel}`, 30, 24);
  doc.setFontSize(8);
  doc.setTextColor(220, 215, 255);
  doc.text(`${name}  ·  Gerado em ${new Date().toLocaleString("pt-BR")}`, 30, 29);
  // Selo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(176, 14, 22, 6, 3, 3, "F");
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENCIAL", 187, 18, { align: "center" });

  // ── KPI Cards ──
  const kpiY = 44;
  const kpiW = 58;
  const kpiH = 26;
  const kpis: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: "RECEITAS", value: fmt(income), color: SUCCESS },
    { label: "DESPESAS", value: fmt(expenses), color: DANGER },
    { label: "SALDO LÍQUIDO", value: fmt(balance), color: balance >= 0 ? BRAND : DANGER },
  ];
  kpis.forEach((k, i) => {
    const x = 14 + i * (kpiW + 4);
    // Sombra
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(x + 0.4, kpiY + 0.4, kpiW, kpiH, 3, 3, "F");
    // Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 230, 240);
    doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "FD");
    // Faixa esquerda colorida
    doc.setFillColor(...k.color);
    doc.roundedRect(x, kpiY, 1.5, kpiH, 0.5, 0.5, "F");
    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(k.label, x + 5, kpiY + 8);
    // Valor
    doc.setFontSize(13);
    doc.setTextColor(...k.color);
    doc.text(k.value, x + 5, kpiY + 18);
  });

  // Pequeno texto de "saúde financeira"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const healthLabel = savingsRate >= 20 ? "Excelente economia"
    : savingsRate >= 10 ? "Bom controle"
    : savingsRate >= 0 ? "Equilibrado"
    : "Atenção";
  doc.text(`Taxa de poupança: ${savingsRate.toFixed(1)}% · ${healthLabel}  ·  ${txs.length} lançamento${txs.length !== 1 ? "s" : ""}`, 14, kpiY + kpiH + 6);

  // ── Top 5 categories bar chart (expenses) ──
  let y = kpiY + kpiH + 14;
  const catMap: Record<string, number> = {};
  txs.filter(t => t.type === "expense").forEach(t => {
    const c = t.category || "Outros";
    catMap[c] = (catMap[c] || 0) + Number(t.amount);
  });
  const top5 = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (top5.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text("TOP 5 CATEGORIAS DE DESPESA", 14, y);
    y += 5;

    const chartX = 14;
    const chartY = y;
    const chartW = 182;
    const rowH = 11;
    const labelW = 50;
    const valueW = 35;
    const barAreaW = chartW - labelW - valueW - 6;
    const maxVal = top5[0][1] || 1;

    // Card de fundo
    doc.setFillColor(250, 248, 255);
    doc.setDrawColor(230, 220, 250);
    doc.roundedRect(chartX, chartY, chartW, rowH * top5.length + 8, 3, 3, "FD");

    top5.forEach(([cat, val], i) => {
      const ry = chartY + 5 + i * rowH;
      // Medal/rank
      const medal = ["🥇", "🥈", "🥉", "4º", "5º"][i] || "";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(medal, chartX + 3, ry + 5);
      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      const label = cat.length > 18 ? cat.slice(0, 16) + "…" : cat;
      doc.text(label, chartX + 11, ry + 5);
      // Bar background
      doc.setFillColor(...BRAND_LIGHT);
      doc.roundedRect(chartX + labelW, ry + 1, barAreaW, 6, 1.5, 1.5, "F");
      // Bar fill (gradient: top → escuro)
      const w = Math.max(2, (val / maxVal) * barAreaW);
      const fill = i === 0 ? BRAND_DARK : i === 1 ? BRAND : [167, 139, 250] as [number, number, number];
      doc.setFillColor(...fill);
      doc.roundedRect(chartX + labelW, ry + 1, w, 6, 1.5, 1.5, "F");
      // Value + percentage
      const pct = ((val / expenses) * 100).toFixed(0);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(fmt(val), chartX + chartW - 3, ry + 5, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(`${pct}%`, chartX + chartW - 3, ry + 9, { align: "right" });
    });

    y = chartY + rowH * top5.length + 14;
  }

  // ── Transactions table header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...INK);
  doc.text("LANÇAMENTOS DETALHADOS", 14, y);
  y += 4;

  doc.setFillColor(...BRAND);
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.roundedRect(14, y, 182, 8, 1.5, 1.5, "F");
  y += 5.5;
  doc.text("Data", 16, y);
  doc.text("Tipo", 36, y);
  doc.text("Categoria", 56, y);
  doc.text("Descrição", 96, y);
  doc.text("Valor", 194, y, { align: "right" });
  y += 7;
  doc.setFont("helvetica", "normal");

  doc.setFontSize(8);
  let zebra = false;
  for (const t of txs) {
    if (y > 275) {
      doc.addPage();
      // Mini header na nova página
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, 210, 8, "F");
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`KoraFinance · ${periodLabel} · continuação`, 14, 5.5);
      y = 18;
      zebra = false;
    }
    const isIncome = t.type === "income";
    // Zebra
    if (zebra) {
      doc.setFillColor(250, 248, 255);
      doc.rect(14, y - 4, 182, 5.5, "F");
    }
    zebra = !zebra;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.text(brDate(t.date), 16, y);
    doc.setTextColor(...(isIncome ? SUCCESS : DANGER));
    doc.setFont("helvetica", "bold");
    doc.text(isIncome ? "Receita" : "Despesa", 36, y);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal");
    doc.text(String(t.category || "—").slice(0, 18), 56, y);
    doc.text(String(t.description || "").slice(0, 40), 96, y);
    doc.setTextColor(...(isIncome ? SUCCESS : DANGER));
    doc.setFont("helvetica", "bold");
    doc.text((isIncome ? "+ " : "− ") + fmt(Number(t.amount)), 194, y, { align: "right" });
    y += 5.5;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Faixa decorativa roxa
    doc.setFillColor(...BRAND);
    doc.rect(0, 291, 210, 6, "F");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`KoraFinance · ${periodLabel}`, 14, 288);
    doc.text(`Página ${i} de ${pageCount}`, 196, 288, { align: "right" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text("korafinance.app · Sua vida financeira em um só lugar", 105, 295, { align: "center" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

async function uploadAndSign(path: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const { error: upErr } = await supabase.storage.from("wpp-reports").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage.from("wpp-reports").createSignedUrl(path, 60 * 60 * 24); // 24h
  if (error) throw error;
  return data.signedUrl;
}

async function sendZapiText(phone: string, message: string) {
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
    body: JSON.stringify({ phone, message }),
  });
}

async function sendZapiDocument(phone: string, documentUrl: string, fileName: string, ext: string) {
  // Z-API: POST /send-document/{extension} with body { phone, document, fileName }
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-document/${ext}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
    body: JSON.stringify({ phone, document: documentUrl, fileName }),
  });
  const txt = await res.text();
  console.log("[Z-API send-document]", res.status, txt.slice(0, 300));
  if (!res.ok) throw new Error(`Z-API document error ${res.status}: ${txt.slice(0, 200)}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, phone, format, startDate, endDate, periodLabel } = await req.json();

    if (!userId || !phone || !format || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: "missing params" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = await fetchUserName(userId);
    const txs = await fetchTransactions(userId, startDate, endDate);
    const label = periodLabel || `${brDate(startDate)} a ${brDate(endDate)}`;

    if (txs.length === 0) {
      await sendZapiText(phone, `📭 Não encontrei nenhum lançamento no período *${label}*, ${name}.\n\nQue tal registrar algum gasto? Me manda algo como _"gastei 50 no mercado"_ 😉`);
      return new Response(JSON.stringify({ ok: true, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "summary") {
      await sendZapiText(phone, buildSummaryText(name, label, txs));
      return new Response(JSON.stringify({ ok: true, format, count: txs.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const ts = Date.now();

    if (format === "csv") {
      const csv = buildCSV(txs, label, name);
      const bytes = new TextEncoder().encode(csv);
      const path = `${userId}/${ts}-relatorio-${slug}.csv`;
      const signedUrl = await uploadAndSign(path, bytes, "text/csv; charset=utf-8");
      await sendZapiText(phone, `📊 *Planilha pronta!*\n\n👤 ${name}\n📅 ${label}\n📝 ${txs.length} ${txs.length === 1 ? "lançamento" : "lançamentos"}\n\n💾 _Abre direto no Excel ou Google Sheets_\n\n⏳ Enviando arquivo...`);
      await sendZapiDocument(phone, signedUrl, `relatorio-${slug}.csv`, "csv");
      return new Response(JSON.stringify({ ok: true, format, count: txs.length, url: signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "pdf") {
      const bytes = buildPDF(name, label, txs);
      const path = `${userId}/${ts}-relatorio-${slug}.pdf`;
      const signedUrl = await uploadAndSign(path, bytes, "application/pdf");
      await sendZapiText(phone, `📄 *Relatório PDF pronto!*\n\n👤 ${name}\n📅 ${label}\n📝 ${txs.length} ${txs.length === 1 ? "lançamento" : "lançamentos"}\n\n✨ _Com gráficos, KPIs e top categorias_\n\n⏳ Enviando arquivo...`);
      await sendZapiDocument(phone, signedUrl, `relatorio-${slug}.pdf`, "pdf");
      return new Response(JSON.stringify({ ok: true, format, count: txs.length, url: signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "invalid format" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("whatsapp-export error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
