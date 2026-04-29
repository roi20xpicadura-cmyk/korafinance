// supabase/functions/_shared/whatsapp-fast-replies.ts
//
// Helpers PUROS de normalização e fast replies do webhook do WhatsApp.
// Extraído pra cá pra poder ser testado isoladamente (sem subir o server)
// e pra evitar regressão no comportamento crítico de "extrato → registra".
//
// IMPORTANTE: este arquivo é a fonte da verdade. O `whatsapp-webhook/index.ts`
// re-exporta/usa estes símbolos — não duplique a lógica em outro lugar.

export const FAST_REPLY_ATTACHMENT =
  "Manda aí! 📄 Eu *leio o arquivo e já registro todos os lançamentos automaticamente* no KoraFinance. Funciona com extrato (PDF), fatura de cartão, comprovante (foto) e cupom fiscal. 🐨";

export const FAST_REPLY_HELP =
  "Posso registrar gastos/receitas, consultar saldo, gastos, metas, dívidas e orçamentos.\n\n📄 *Manda extrato (PDF) ou foto* que eu *leio e registro tudo automaticamente* — sem precisar digitar nada. 🐨";

export const FAST_REPLY_GREETING =
  "Opa! Tô por aqui 🐨 Me manda um gasto, receita ou pergunta rápida sobre suas finanças.";

export const FAST_REPLY_THANKS = "Fechado! Sempre que precisar, é só chamar 🐨";

export const FAST_REPLY_PING = "Tô online sim 🐨 Pode mandar.";

export function normalizeIntentText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TYPO_FIXES: Array<[RegExp, string]> = [
  [/\bsalda\b/g, "saldo"],
  [/\bsald\b/g, "saldo"],
  [/\bsaaldo\b/g, "saldo"],
  [/\bgastoss\b/g, "gastos"],
  [/\bgastei\s+qto\b/g, "gastei quanto"],
  [/\bqto\b/g, "quanto"],
  [/\bqnt(o|os)?\b/g, "quanto"],
  [/\bqnd(o)?\b/g, "quando"],
  [/\bmess\b/g, "mes"],
  [/\bmeis\b/g, "mes"],
  [/\bmesss?\b/g, "mes"],
  [/\bmetaa\b/g, "meta"],
  [/\bmetass\b/g, "metas"],
  [/\bobjetiv(o|os|us)\b/g, "objetivo"],
  [/\borcament(o|os|u)\b/g, "orcamento"],
  [/\bornament(o|os)\b/g, "orcamento"],
  [/\bdivd(a|as)\b/g, "divida"],
  [/\bdivid(as|aas)\b/g, "dividas"],
  [/\bscor\b/g, "score"],
  [/\besccore\b/g, "score"],
];

export function applyTypoFixes(text: string): string {
  let out = text;
  for (const [re, repl] of TYPO_FIXES) out = out.replace(re, repl);
  return out.replace(/\s+/g, " ").trim();
}

export function normalizeForIntent(text: string): string {
  return applyTypoFixes(normalizeIntentText(text));
}

// Detecta perguntas/avisos sobre extrato/PDF/imagem/comprovante.
// Esta detecção é CRÍTICA: se falhar, o pedido cai no LLM, que historicamente
// alucinava dizendo "só comento, registrar tem que ser manual" — quebrando a
// promessa do produto. Por isso é coberta por testes (whatsapp-fast-replies.test.ts).
const ATTACHMENT_QUESTION =
  /\b(consegue|da pra|posso|vou|vou te|te|vc|voce)\s*(ler|analisar|olhar|ver|importar|registrar|salvar|cadastrar|processar)?\s*(o |a |meu |minha |um |uma )?(extrato|fatura|comprovante|pdf|cupom|recibo|nota|csv|ofx|planilha)\b/;

const ATTACHMENT_ANNOUNCE =
  /\b(te (vou|to) mand|vou (te )?mandar|posso mandar|mando|envio)\s+(o |a |meu |minha |um |uma )?(extrato|fatura|comprovante|pdf|csv|ofx|planilha|foto|imagem|arquivo)\b/;

const ATTACHMENT_BARE = /^(extrato|fatura|comprovante)\??$/;

export function matchesAttachmentIntent(text: string): boolean {
  const t = normalizeForIntent(text);
  if (!t || t.length > 80) return false;
  return ATTACHMENT_QUESTION.test(t) ||
    ATTACHMENT_ANNOUNCE.test(t) ||
    ATTACHMENT_BARE.test(t);
}

export function getBasicFastReply(text: string): string | null {
  const t = normalizeForIntent(text);
  if (!t || t.length > 80) return null;

  if (
    /^(oi+|ola+|opa+|eai|e ai|bom dia|boa tarde|boa noite|tudo bem|td bem|tudo certo|fala|salve|hey|hi|hello|alo)\b[\s!?.]*$/
      .test(t)
  ) {
    return FAST_REPLY_GREETING;
  }

  if (
    /^(obrigad[oa]+|valeu+|vlw|show|beleza|blz|perfeito|top|massa|otimo|legal|maravilha|tmj)\b[\s!?.]*$/
      .test(t)
  ) {
    return FAST_REPLY_THANKS;
  }

  if (
    /^(ajuda|help|socorro|como funciona|como (que )?funciona|o que (voce|vc|tu) faz|o que da pra fazer|menu|comandos)\b[\s!?.]*$/
      .test(t)
  ) {
    return FAST_REPLY_HELP;
  }

  if (
    /^(voce|vc) (esta|ta) ai\??$/.test(t) ||
    /^(ta ai|esta online|ta online|ta on|funciona|teste|ping)\b[\s!?.]*$/.test(t)
  ) {
    return FAST_REPLY_PING;
  }

  // Anexos: SEMPRE retorna a resposta canônica antes de cair no LLM.
  // Coberto por whatsapp-fast-replies.test.ts.
  if (
    ATTACHMENT_QUESTION.test(t) ||
    ATTACHMENT_ANNOUNCE.test(t) ||
    ATTACHMENT_BARE.test(t)
  ) {
    return FAST_REPLY_ATTACHMENT;
  }

  return null;
}
