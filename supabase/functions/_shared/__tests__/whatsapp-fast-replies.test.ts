// supabase/functions/_shared/__tests__/whatsapp-fast-replies.test.ts
//
// Garante que perguntas/avisos sobre extrato, PDF, imagem e comprovantes
// SEMPRE batem na resposta canônica (FAST_REPLY_ATTACHMENT) e nunca caem
// no LLM. A regressão histórica era a Kora alucinar "só comento, registrar
// é manual" — isso quebra a promessa do produto.
//
// Rodar: deno test supabase/functions/_shared/__tests__/whatsapp-fast-replies.test.ts

import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

import {
  FAST_REPLY_ATTACHMENT,
  FAST_REPLY_GREETING,
  FAST_REPLY_HELP,
  FAST_REPLY_PING,
  FAST_REPLY_THANKS,
  getBasicFastReply,
  matchesAttachmentIntent,
  normalizeForIntent,
} from "../whatsapp-fast-replies.ts";

// ==========================================================
// ATTACHMENT INTENT — o caso crítico
// ==========================================================

// Inputs reais que clientes mandam e que DEVEM disparar a resposta canônica.
// Inclui variações de digitação, com/sem acento, perguntas e avisos.
const ATTACHMENT_INPUTS_THAT_MUST_MATCH = [
  // Perguntas diretas
  "Consegue ler meu extrato?",
  "consegue ler meu extrato",
  "Vc consegue ler extrato?",
  "Você consegue analisar minha fatura?",
  "da pra importar a fatura?",
  "Da pra importar fatura do cartão",
  "Posso mandar o PDF?",
  "posso mandar pdf",
  "Vou te mandar o extrato",
  "vou te mandar o extrato do banco",
  "Te mando o pdf",
  "Mando a fatura?",
  "Envio o comprovante?",
  "vou mandar o comprovante",
  "vou mandar foto",
  "vou mandar uma foto",
  "vou mandar a imagem",
  "vou mandar um arquivo",
  "posso mandar foto",
  "posso mandar a imagem",
  // Avisos curtos
  "extrato",
  "extrato?",
  "fatura",
  "fatura?",
  "comprovante",
  "comprovante?",
  // Outras formas
  "consegue ler pdf",
  "consegue analisar comprovante",
  "consegue importar csv",
  "vou te mandar planilha",
  "vou mandar ofx",
  "consegue ler cupom",
  "consegue ler nota",
  "consegue ler recibo",
];

for (const input of ATTACHMENT_INPUTS_THAT_MUST_MATCH) {
  Deno.test(`attachment intent: "${input}" → resposta canônica`, () => {
    const reply = getBasicFastReply(input);
    assertStrictEquals(
      reply,
      FAST_REPLY_ATTACHMENT,
      `Input "${input}" caiu no LLM (reply=${JSON.stringify(reply)}). Isso quebra a promessa do produto.`,
    );
    // matchesAttachmentIntent deve concordar
    assert(
      matchesAttachmentIntent(input),
      `matchesAttachmentIntent inconsistente para "${input}"`,
    );
  });
}

// ==========================================================
// FALSOS POSITIVOS — não pode disparar resposta de anexo nesses casos
// ==========================================================

const ATTACHMENT_INPUTS_THAT_MUST_NOT_MATCH = [
  // Lançamentos manuais (não são pedido de anexo)
  "gastei 50 no mercado",
  "recebi 1500 de salario",
  "paguei 100 no uber",
  // Consultas de saldo/gastos
  "qual meu saldo",
  "quanto gastei esse mes",
  "como esta minha meta",
  "quanto devo no cartao",
  // Saudações
  "oi",
  "bom dia",
  "obrigado",
  // Vazio
  "",
  "   ",
];

for (const input of ATTACHMENT_INPUTS_THAT_MUST_NOT_MATCH) {
  Deno.test(`não-anexo: "${input}" NÃO deve disparar resposta de anexo`, () => {
    assertEquals(
      matchesAttachmentIntent(input),
      false,
      `"${input}" foi classificado como pedido de anexo por engano`,
    );
    const reply = getBasicFastReply(input);
    if (reply !== null) {
      // Pode ser saudação/help/ping, mas NUNCA a resposta de anexo
      assert(
        reply !== FAST_REPLY_ATTACHMENT,
        `"${input}" disparou FAST_REPLY_ATTACHMENT incorretamente`,
      );
    }
  });
}

// ==========================================================
// OUTROS FAST REPLIES (sanity check pra garantir que não quebramos)
// ==========================================================

Deno.test("greeting → FAST_REPLY_GREETING", () => {
  assertStrictEquals(getBasicFastReply("oi"), FAST_REPLY_GREETING);
  assertStrictEquals(getBasicFastReply("bom dia"), FAST_REPLY_GREETING);
  assertStrictEquals(getBasicFastReply("opa"), FAST_REPLY_GREETING);
});

Deno.test("thanks → FAST_REPLY_THANKS", () => {
  assertStrictEquals(getBasicFastReply("obrigado"), FAST_REPLY_THANKS);
  assertStrictEquals(getBasicFastReply("valeu"), FAST_REPLY_THANKS);
  assertStrictEquals(getBasicFastReply("vlw"), FAST_REPLY_THANKS);
});

Deno.test("help → FAST_REPLY_HELP (e menciona extrato/PDF)", () => {
  const reply = getBasicFastReply("ajuda");
  assertStrictEquals(reply, FAST_REPLY_HELP);
  // Garante que a copy de help reforça que ela registra extratos automaticamente
  assert(
    reply!.toLowerCase().includes("extrato"),
    "Help reply precisa mencionar extrato pra reforçar a capacidade",
  );
  assert(
    reply!.toLowerCase().includes("automaticamente"),
    "Help reply precisa deixar claro que é automático",
  );
});

Deno.test("ping → FAST_REPLY_PING", () => {
  assertStrictEquals(getBasicFastReply("ping"), FAST_REPLY_PING);
  assertStrictEquals(getBasicFastReply("ta ai"), FAST_REPLY_PING);
});

Deno.test("texto longo (>80 chars) → null (cai no LLM)", () => {
  const longText = "a".repeat(120);
  assertStrictEquals(getBasicFastReply(longText), null);
});

// ==========================================================
// NORMALIZAÇÃO — base de tudo
// ==========================================================

Deno.test("normalizeForIntent: remove acento, lowercase, trim", () => {
  assertEquals(normalizeForIntent("Você"), "voce");
  assertEquals(normalizeForIntent("  EXTRATO!  "), "extrato");
  assertEquals(normalizeForIntent("Não"), "nao");
});

Deno.test("normalizeForIntent: aplica typo fixes", () => {
  assertEquals(normalizeForIntent("salda"), "saldo");
  assertEquals(normalizeForIntent("qto gastei"), "quanto gastei");
});
