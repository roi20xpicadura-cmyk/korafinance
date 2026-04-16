import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const FROM = 'KoraFinance <relatorio@notify.korafinance.app>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmt = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const startStr = firstDay.toISOString().split('T')[0];
    const endStr = lastDay.toISOString().split('T')[0];

    // Get all users via auth admin
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr) throw usersErr;

    let sent = 0;
    let skipped = 0;

    for (const user of usersData.users) {
      if (!user.email) { skipped++; continue; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount, category')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('date', startStr)
        .lte('date', endStr);

      if (!txs?.length) { skipped++; continue; }

      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const balance = income - expenses;
      const firstName = profile?.full_name?.split(' ')[0] || 'usuário';

      const byCategory: Record<string, number> = {};
      txs.filter(t => t.type === 'expense').forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
      });
      const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

      const balanceColor = balance >= 0 ? '#22c55e' : '#ef4444';
      const balanceLabel = balance >= 0 ? 'Saldo positivo' : 'Saldo negativo';

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:40px;">🐨</div>
      <div style="font-size:18px;font-weight:600;color:#22c55e;margin-top:8px;">KoraFinance</div>
      <div style="font-size:13px;color:#737373;margin-top:4px;">Relatório de ${monthName}</div>
    </div>
    <div style="background:#161616;border:1px solid #262626;border-radius:16px;padding:32px;margin-bottom:16px;">
      <p style="font-size:15px;color:#a3a3a3;margin:0 0 24px;">${firstName}, veja como foi seu mês 👀</p>
      <div style="font-size:13px;color:#737373;margin-bottom:4px;">${balanceLabel}</div>
      <div style="font-size:32px;font-weight:700;color:${balanceColor};margin-bottom:24px;">${fmt(Math.abs(balance))}</div>
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:12px;background:#0a0a0a;border-radius:8px;width:48%;">
            <div style="font-size:12px;color:#737373;">Receitas</div>
            <div style="font-size:18px;font-weight:600;color:#22c55e;">${fmt(income)}</div>
          </td>
          <td style="width:4%;"></td>
          <td style="padding:12px;background:#0a0a0a;border-radius:8px;width:48%;">
            <div style="font-size:12px;color:#737373;">Despesas</div>
            <div style="font-size:18px;font-weight:600;color:#ef4444;">${fmt(expenses)}</div>
          </td>
        </tr>
      </table>
    </div>
    ${topCats.length ? `
    <div style="background:#161616;border:1px solid #262626;border-radius:16px;padding:24px;margin-bottom:16px;">
      <h2 style="font-size:14px;color:#fff;margin:0 0 16px;">Onde você mais gastou</h2>
      ${topCats.map(([cat, val]) => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #262626;">
          <span style="color:#a3a3a3;font-size:14px;">${cat}</span>
          <span style="color:#fff;font-size:14px;font-weight:600;">${fmt(val as number)}</span>
        </div>
      `).join('')}
    </div>` : ''}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://korafinance.app/app" style="display:inline-block;background:#22c55e;color:#0a0a0a;font-weight:600;padding:14px 28px;border-radius:10px;text-decoration:none;">Ver relatório completo →</a>
    </div>
    <p style="text-align:center;font-size:12px;color:#525252;margin-top:32px;">
      KoraFinance · <a href="https://korafinance.app" style="color:#22c55e;">korafinance.app</a>
    </p>
  </div>
</body></html>`;

      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: user.email,
          subject: `📊 Seu resumo de ${monthName} — KoraFinance`,
          html,
        }),
      });

      if (res.ok) sent++; else {
        const err = await res.text();
        console.error(`Failed for ${user.email}: ${err}`);
      }
    }

    return new Response(JSON.stringify({ success: true, sent, skipped }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-monthly-report error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
