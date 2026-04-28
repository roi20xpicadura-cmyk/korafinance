import { useMemo, useState } from 'react';
import { KNOWN_SERVICES } from '@/lib/subscriptionDetector';
import { getCategoryStyle } from '@/lib/categoryIcons';

interface Props {
  description: string;
  category?: string | null;
  isIncome?: boolean;
  size?: number;
  rounded?: number;
}

// description → domain (uma vez, em memória)
function findDomainFor(desc: string): string | null {
  if (!desc) return null;
  for (const svc of KNOWN_SERVICES) {
    if (svc.domain && svc.patterns.some(p => p.test(desc))) return svc.domain;
  }
  return null;
}

// Heurística leve: tenta extrair um domínio "marca.com" da descrição
// Ex.: "UBER*TRIP", "AMZN MKTPLACE", "MERCADOLIVRE", "PG *NUBANK"
const BRAND_GUESS: Array<[RegExp, string]> = [
  [/uber/i, 'uber.com'],
  [/ifood/i, 'ifood.com.br'],
  [/rappi/i, 'rappi.com.br'],
  [/99\s*app|99pop/i, '99app.com'],
  [/amazon|amzn/i, 'amazon.com'],
  [/mercado\s*livre|mercadolivre|mlb\b/i, 'mercadolivre.com.br'],
  [/mercado\s*pago/i, 'mercadopago.com.br'],
  [/shopee/i, 'shopee.com.br'],
  [/aliexpress/i, 'aliexpress.com'],
  [/magalu|magazine\s*luiza/i, 'magazineluiza.com.br'],
  [/americanas/i, 'americanas.com.br'],
  [/nubank/i, 'nubank.com.br'],
  [/itau|itaú/i, 'itau.com.br'],
  [/bradesco/i, 'bradesco.com.br'],
  [/santander/i, 'santander.com.br'],
  [/banco\s*do\s*brasil|\bbb\b/i, 'bb.com.br'],
  [/caixa/i, 'caixa.gov.br'],
  [/inter\b/i, 'bancointer.com.br'],
  [/c6\s*bank|\bc6\b/i, 'c6bank.com.br'],
  [/pag\s*seguro|pagseguro|pag\*/i, 'pagseguro.uol.com.br'],
  [/stone\b/i, 'stone.com.br'],
  [/picpay/i, 'picpay.com'],
  [/google/i, 'google.com'],
  [/microsoft/i, 'microsoft.com'],
  [/whatsapp/i, 'whatsapp.com'],
  [/instagram|meta\b|facebook/i, 'meta.com'],
  [/booking/i, 'booking.com'],
  [/airbnb/i, 'airbnb.com'],
  [/latam/i, 'latamairlines.com'],
  [/gol\s*linhas|gollinhas/i, 'voegol.com.br'],
  [/azul\s*linhas|azul\s*viagens/i, 'voeazul.com.br'],
  [/posto|shell\b/i, 'shell.com'],
  [/petrobras|br\s*distribuidora/i, 'petrobras.com.br'],
  [/ipiranga/i, 'ipiranga.com.br'],
  [/mc\s*donald|mcdonald/i, 'mcdonalds.com'],
  [/burger\s*king|\bbk\b/i, 'burgerking.com.br'],
  [/starbucks/i, 'starbucks.com'],
  [/subway/i, 'subway.com'],
  [/pao\s*de\s*acucar|pão\s*de\s*açúcar/i, 'paodeacucar.com'],
  [/carrefour/i, 'carrefour.com.br'],
  [/extra\s*super|extra\s*hiper/i, 'clubeextra.com.br'],
  [/assai|assaí/i, 'assai.com.br'],
  [/atacadao|atacadão/i, 'atacadao.com.br'],
];

function guessDomainFromDesc(desc: string): string | null {
  if (!desc) return null;
  for (const [re, domain] of BRAND_GUESS) {
    if (re.test(desc)) return domain;
  }
  return null;
}

export default function TransactionIcon({
  description,
  category,
  isIncome = false,
  size = 40,
  rounded = 12,
}: Props) {
  const domain = useMemo(
    () => findDomainFor(description) ?? guessDomainFromDesc(description),
    [description]
  );
  const [imgFailed, setImgFailed] = useState(false);

  const style = getCategoryStyle(category, isIncome);
  const Icon = style.Icon;

  const container: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: rounded,
    background: style.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid rgba(0,0,0,0.04)',
  };

  if (domain && !imgFailed) {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return (
      <div style={{ ...container, background: '#fff' }}>
        <img
          src={url}
          alt={description}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div style={container}>
      <Icon style={{ width: size * 0.5, height: size * 0.5, color: style.fg }} />
    </div>
  );
}
