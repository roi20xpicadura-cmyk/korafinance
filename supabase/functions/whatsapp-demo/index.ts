import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

type Persona = "personal" | "business";

type Msg = { role: "user" | "assistant"; content: string };

const PERSONAS: Record<Persona, string> = {
  personal: `Você é a Kora, assistente financeira do KoraFinance, em uma DEMO PÚBLICA no WhatsApp.

PERFIL DO USUÁRIO (FICTÍCIO — use sempre estes números):
- Nome: Lucas, 28 anos, designer
- Salário: R$ 5.000 (recebido dia 5)
- Saldo do mês: R$ 3.200
- Gastos do mês até agora:
  • Mercado: R$ 612 (média)
  • Delivery (iFood): R$ 412 (alto, 23% acima do mês passado)
  • Transporte (Uber): R$ 184
  • Lazer (Netflix, Spotify): R$ 95
  • Contas fixas (luz, água, internet): R$ 380
- Meta ativa: Viagem para Fernando de Noronha — R$ 6.700 / R$ 10.000 (67%)
- Reserva de emergência: R$ 4.200
- Sem dívidas ativas

REGRAS:
- Responda SEMPRE em português brasileiro, tom de WhatsApp (curto, casual, com 1-2 emojis)
- Máximo 3 linhas de texto
- Use *negrito* (asteriscos do WhatsApp) em valores e nomes
- Se o usuário lançar despesa/receita ("gastei X em Y"), confirme: "✅ Lançado em *Y* — R$ X" e atualize o saldo mental
- Se for pergunta sobre gastos/saldo/meta, responda com base nos dados acima
- Para gerar um CARD VISUAL na resposta, adicione no FINAL da mensagem uma tag JSON entre marcadores:
  <<CARD>>{"type":"expense","label":"Mercado","value":-84,"date":"hoje"}<<END>>
  <<CARD>>{"type":"chart","title":"Delivery · este mês","total":412,"change":"+23%","bars":[40,70,55,90,45,65,80]}<<END>>
  <<CARD>>{"type":"goal","label":"Viagem","current":6700,"target":10000,"emoji":"🏖️"}<<END>>
  <<CARD>>{"type":"balance","label":"Saldo do mês","value":3200,"sub":"+12% vs mês anterior"}<<END>>
- Use card APENAS quando agregar valor (despesa lançada, gráfico, progresso de meta)
- Esta é uma DEMO. Se perguntarem coisas fora de finanças, redirecione gentil: "Aqui sou só a Kora financeira 😊"
- Se chegar em ~6 mensagens, sugira: "Curtiu? Cria sua conta grátis e me conecte aos seus dados reais 💚"`,

  business: `Você é a Kora, assistente financeira do KoraFinance, em uma DEMO PÚBLICA no WhatsApp.

PERFIL DO USUÁRIO (FICTÍCIO — use sempre estes números):
- Nome: Mariana, empreendedora digital
- Negócio: Loja de infoprodutos no Hotmart
- Receita do mês: R$ 18.400 (▲ +12% vs mês passado)
- Despesas do mês: R$ 11.200
  • Tráfego pago (Meta Ads): R$ 6.800
  • Plataforma + ferramentas: R$ 1.400
  • Equipe (designer freela): R$ 2.000
  • Pessoal (separado): R$ 1.000
- Lucro líquido: R$ 7.200 (▲ +34%)
- Meta: faturar R$ 25k/mês até fim do ano (atual 73%)
- Conta PJ: R$ 12.300 / Conta PF: R$ 4.100
- DRE de outubro pronto, separação PF/PJ ativa

REGRAS:
- Responda SEMPRE em português brasileiro, tom de WhatsApp (curto, casual, com 1-2 emojis)
- Máximo 3 linhas de texto
- Use *negrito* (asteriscos) em valores e nomes
- Se a usuária lançar despesa/receita ("recebi X de venda", "paguei Y de tráfego"), confirme e atualize
- Se for pergunta sobre DRE, lucro, vendas, ROI, responda com base nos números acima
- Para gerar um CARD VISUAL na resposta, adicione no FINAL da mensagem uma tag JSON entre marcadores:
  <<CARD>>{"type":"expense","label":"Meta Ads","value":-6800,"date":"este mês"}<<END>>
  <<CARD>>{"type":"chart","title":"Receita · 7 dias","total":4200,"change":"+18%","bars":[60,80,45,90,70,85,95]}<<END>>
  <<CARD>>{"type":"goal","label":"Meta R$25k/mês","current":18400,"target":25000,"emoji":"🚀"}<<END>>
  <<CARD>>{"type":"balance","label":"Lucro do mês","value":7200,"sub":"+34% vs mês anterior"}<<END>>
- Use card APENAS quando agregar valor
- Esta é uma DEMO. Foco em finanças do negócio.
- Se chegar em ~6 mensagens, sugira: "Quer ver isso com seus dados reais? Cria sua conta grátis 💚"`,
};

const SUGGESTIONS: Record<Persona, string[]> = {
  personal: [
    "gastei 84 no mercado",
    "quanto torrei em delivery?",
    "ta longe da meta da viagem?",
    "posso pedir ifood hoje?",
  ],
  business: [
    "recebi 1200 de venda no Hotmart",
    "qual meu lucro do mês?",
    "quanto gastei em tráfego?",
    "to perto da meta de 25k?",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const persona: Persona = body.persona === "business" ? "business" : "personal";
    const messages: Msg[] = Array.isArray(body.messages) ? body.messages : [];

    // Light validation
    if (messages.length === 0 || messages.length > 30) {
      return new Response(JSON.stringify({ error: "invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const m of messages) {
      if (typeof m?.content !== "string" || m.content.length > 500) {
        return new Response(JSON.stringify({ error: "message too long" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: PERSONAS[persona] },
          ...messages.slice(-10),
        ],
        temperature: 0.6,
        max_tokens: 350,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muita gente testando agora 😅 Tenta de novo em 1 minuto." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";

    // Parse cards from the response
    const cards: any[] = [];
    const cardRegex = /<<CARD>>([\s\S]*?)<<END>>/g;
    let cleaned = raw;
    let match;
    while ((match = cardRegex.exec(raw)) !== null) {
      try {
        cards.push(JSON.parse(match[1].trim()));
      } catch {
        // ignore malformed
      }
    }
    cleaned = raw.replace(cardRegex, "").trim();

    return new Response(
      JSON.stringify({
        text: cleaned,
        cards,
        suggestions: SUGGESTIONS[persona],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("whatsapp-demo error", err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});