const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const audioBase64: string | undefined = body?.audio;
    const mime: string = body?.mime || 'audio/webm';

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing audio (base64 string)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit ~3MB base64 (~2MB audio) for demo
    if (audioBase64.length > 4_000_000) {
      return new Response(JSON.stringify({ error: 'Áudio muito longo. Máx 30s na demo.' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize MIME — Gemini accepts audio/webm, audio/mp4, audio/ogg, audio/wav, audio/mp3
    const normalizedMime = mime.includes('mp4')
      ? 'audio/mp4'
      : mime.includes('ogg')
      ? 'audio/ogg'
      : mime.includes('wav')
        ? 'audio/wav'
        : mime.includes('mp3') || mime.includes('mpeg')
          ? 'audio/mpeg'
          : 'audio/webm';

    const dataUrl = `data:${normalizedMime};base64,${audioBase64}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'Você transcreve áudios em português brasileiro. Retorne APENAS o texto falado, sem comentários, prefixos, aspas ou pontuação extra. Se o áudio estiver vazio ou inaudível, retorne uma string vazia.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Transcreva o áudio abaixo:' },
              { type: 'input_audio', input_audio: { data: dataUrl, format: normalizedMime.split('/')[1] } },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Lovable AI transcription error:', resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Muitas tentativas. Aguarda alguns segundos e tenta de novo.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos da IA esgotados. Tenta digitar a mensagem.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Falha na transcrição', detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const text: string = (data?.choices?.[0]?.message?.content || '').trim();
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('transcribe error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});