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

  const catMap: Record<string, number> = {};
  txs.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const catLines = topCats.length
    ? topCats.map(([c, v]) => `  • ${c}: ${fmt(v)}`).join("\n")
    : "  Nenhum gasto registrado";

  return `📊 *Resumo Financeiro — ${periodLabel}*

👤 ${name}
📝 ${txs.length} lançamento${txs.length !== 1 ? "s" : ""}

💰 Receitas: *${fmt(income)}*
💸 Despesas: *${fmt(expenses)}*
${balance >= 0 ? "✅" : "⚠️"} Saldo: *${fmt(balance)}*

🏆 *Top categorias:*
${catLines}

_Kora IA 🐨_`;
}

function buildCSV(txs: any[]): string {
  const header = "Data,Tipo,Valor,Categoria,Descrição,Origem\n";
  const rows = txs.map(t => {
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [
      brDate(t.date),
      t.type === "income" ? "Receita" : "Despesa",
      Number(t.amount).toFixed(2).replace(".", ","),
      escape(t.category),
      escape(t.description),
      escape(t.origin),
    ].join(",");
  }).join("\n");
  return "\uFEFF" + header + rows; // BOM for Excel UTF-8
}

function buildPDF(name: string, periodLabel: string, txs: any[]): Uint8Array {
  const doc = new jsPDF();
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expenses;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(124, 58, 237);
  doc.text("KoraFinance", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Relatório Financeiro — ${periodLabel}`, 14, 25);
  doc.text(`Cliente: ${name}`, 14, 31);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 37);

  // Summary box
  doc.setDrawColor(230);
  doc.setFillColor(245, 243, 255);
  doc.rect(14, 43, 182, 22, "FD");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Receitas: ${fmt(income)}`, 18, 51);
  doc.text(`Despesas: ${fmt(expenses)}`, 18, 57);
  doc.text(`Saldo: ${fmt(balance)}`, 18, 63);
  doc.text(`Total: ${txs.length} lançamentos`, 130, 51);

  // Table header
  let y = 75;
  doc.setFillColor(124, 58, 237);
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.rect(14, y - 5, 182, 7, "F");
  doc.text("Data", 16, y);
  doc.text("Tipo", 36, y);
  doc.text("Categoria", 56, y);
  doc.text("Descrição", 96, y);
  doc.text("Valor", 178, y, { align: "right" });
  y += 6;

  doc.setTextColor(40);
  doc.setFontSize(8);
  for (const t of txs) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const isIncome = t.type === "income";
    doc.setTextColor(isIncome ? 22 : 220, isIncome ? 163 : 38, isIncome ? 74 : 38);
    doc.text(brDate(t.date), 16, y);
    doc.text(isIncome ? "Receita" : "Despesa", 36, y);
    doc.setTextColor(40);
    doc.text(String(t.category || "").slice(0, 20), 56, y);
    doc.text(String(t.description || "").slice(0, 40), 96, y);
    doc.setTextColor(isIncome ? 22 : 220, isIncome ? 163 : 38, isIncome ? 74 : 38);
    doc.text((isIncome ? "+" : "-") + fmt(Number(t.amount)), 178, y, { align: "right" });
    y += 5;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`KoraFinance • Página ${i}/${pageCount}`, 105, 290, { align: "center" });
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
      const csv = buildCSV(txs);
      const bytes = new TextEncoder().encode(csv);
      const path = `${userId}/${ts}-relatorio-${slug}.csv`;
      const signedUrl = await uploadAndSign(path, bytes, "text/csv; charset=utf-8");
      await sendZapiText(phone, `📊 *Planilha pronta, ${name}!*\n\n📅 Período: ${label}\n📝 ${txs.length} lançamentos\n\nEnviando arquivo CSV...`);
      await sendZapiDocument(phone, signedUrl, `relatorio-${slug}.csv`, "csv");
      return new Response(JSON.stringify({ ok: true, format, count: txs.length, url: signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "pdf") {
      const bytes = buildPDF(name, label, txs);
      const path = `${userId}/${ts}-relatorio-${slug}.pdf`;
      const signedUrl = await uploadAndSign(path, bytes, "application/pdf");
      await sendZapiText(phone, `📄 *Relatório PDF pronto, ${name}!*\n\n📅 Período: ${label}\n📝 ${txs.length} lançamentos\n\nEnviando arquivo...`);
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
