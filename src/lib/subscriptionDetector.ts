// Centro de Assinaturas — detecção de cobranças recorrentes nas transações.
// Estratégia:
// 1. Match por catálogo conhecido (Netflix, Spotify, etc.) — alta confiança.
// 2. Detecção genérica: descrição similar + valor similar (±15%) repetindo mensalmente.

export interface KnownService {
  key: string;          // chave estável p/ match_pattern
  name: string;
  category: string;
  icon: string;         // emoji
  domain?: string;      // domínio oficial p/ favicon/logo
  patterns: RegExp[];
}

export const KNOWN_SERVICES: KnownService[] = [
  { key: 'netflix', name: 'Netflix', category: 'Streaming', icon: '🎬', domain: 'netflix.com', patterns: [/netflix/i] },
  { key: 'spotify', name: 'Spotify', category: 'Música', icon: '🎵', domain: 'spotify.com', patterns: [/spotify/i] },
  { key: 'amazon-prime', name: 'Amazon Prime', category: 'Streaming', icon: '📦', domain: 'primevideo.com', patterns: [/amazon\s*prime|prime\s*video/i] },
  { key: 'disney', name: 'Disney+', category: 'Streaming', icon: '🏰', domain: 'disneyplus.com', patterns: [/disney/i] },
  { key: 'hbo', name: 'HBO Max', category: 'Streaming', icon: '🎭', domain: 'max.com', patterns: [/hbo|max\s*stream/i] },
  { key: 'youtube-premium', name: 'YouTube Premium', category: 'Streaming', icon: '▶️', domain: 'youtube.com', patterns: [/youtube\s*premium|google\s*youtube/i] },
  { key: 'apple', name: 'Apple Services', category: 'Apps', icon: '🍎', domain: 'apple.com', patterns: [/apple\.com|itunes|app\s*store/i] },
  { key: 'icloud', name: 'iCloud', category: 'Cloud', icon: '☁️', domain: 'icloud.com', patterns: [/icloud/i] },
  { key: 'google-one', name: 'Google One', category: 'Cloud', icon: '☁️', domain: 'one.google.com', patterns: [/google\s*one|google\s*storage/i] },
  { key: 'deezer', name: 'Deezer', category: 'Música', icon: '🎵', domain: 'deezer.com', patterns: [/deezer/i] },
  { key: 'tidal', name: 'Tidal', category: 'Música', icon: '🎵', domain: 'tidal.com', patterns: [/tidal/i] },
  { key: 'globoplay', name: 'Globoplay', category: 'Streaming', icon: '📺', domain: 'globoplay.globo.com', patterns: [/globoplay|globo\.com/i] },
  { key: 'paramount', name: 'Paramount+', category: 'Streaming', icon: '⛰️', domain: 'paramountplus.com', patterns: [/paramount/i] },
  { key: 'crunchyroll', name: 'Crunchyroll', category: 'Streaming', icon: '🍙', domain: 'crunchyroll.com', patterns: [/crunchyroll/i] },
  { key: 'twitch', name: 'Twitch', category: 'Streaming', icon: '🎮', domain: 'twitch.tv', patterns: [/twitch/i] },
  { key: 'xbox', name: 'Xbox Game Pass', category: 'Games', icon: '🎮', domain: 'xbox.com', patterns: [/xbox|game\s*pass/i] },
  { key: 'playstation', name: 'PlayStation Plus', category: 'Games', icon: '🎮', domain: 'playstation.com', patterns: [/playstation|psn|ps\s*plus/i] },
  { key: 'nintendo', name: 'Nintendo Online', category: 'Games', icon: '🎮', domain: 'nintendo.com', patterns: [/nintendo/i] },
  { key: 'chatgpt', name: 'ChatGPT Plus', category: 'IA', icon: '🤖', domain: 'openai.com', patterns: [/openai|chatgpt/i] },
  { key: 'claude', name: 'Claude Pro', category: 'IA', icon: '🤖', domain: 'claude.ai', patterns: [/anthropic|claude\.ai/i] },
  { key: 'notion', name: 'Notion', category: 'Produtividade', icon: '📝', domain: 'notion.so', patterns: [/notion/i] },
  { key: 'figma', name: 'Figma', category: 'Design', icon: '🎨', domain: 'figma.com', patterns: [/figma/i] },
  { key: 'adobe', name: 'Adobe', category: 'Design', icon: '🎨', domain: 'adobe.com', patterns: [/adobe/i] },
  { key: 'canva', name: 'Canva', category: 'Design', icon: '🎨', domain: 'canva.com', patterns: [/canva/i] },
  { key: 'github', name: 'GitHub', category: 'Dev', icon: '💻', domain: 'github.com', patterns: [/github/i] },
  { key: 'vercel', name: 'Vercel', category: 'Dev', icon: '💻', domain: 'vercel.com', patterns: [/vercel/i] },
  { key: 'dropbox', name: 'Dropbox', category: 'Cloud', icon: '☁️', domain: 'dropbox.com', patterns: [/dropbox/i] },
  { key: 'microsoft-365', name: 'Microsoft 365', category: 'Produtividade', icon: '💼', domain: 'microsoft.com', patterns: [/microsoft\s*365|office\s*365/i] },
  { key: 'linkedin', name: 'LinkedIn Premium', category: 'Carreira', icon: '💼', domain: 'linkedin.com', patterns: [/linkedin/i] },
  { key: 'duolingo', name: 'Duolingo', category: 'Educação', icon: '🦉', domain: 'duolingo.com', patterns: [/duolingo/i] },
  { key: 'audible', name: 'Audible', category: 'Audiolivros', icon: '🎧', domain: 'audible.com', patterns: [/audible/i] },
  { key: 'kindle', name: 'Kindle Unlimited', category: 'Livros', icon: '📚', domain: 'amazon.com', patterns: [/kindle/i] },
  { key: 'uber-one', name: 'Uber One', category: 'Transporte', icon: '🚗', domain: 'uber.com', patterns: [/uber\s*one|uber\s*pass/i] },
  { key: 'ifood-clube', name: 'iFood Clube', category: 'Comida', icon: '🍔', domain: 'ifood.com.br', patterns: [/ifood\s*clube|clube\s*ifood/i] },
  { key: 'rappi-prime', name: 'Rappi Prime', category: 'Comida', icon: '🛵', domain: 'rappi.com.br', patterns: [/rappi\s*prime/i] },
  { key: 'smart-fit', name: 'Smart Fit', category: 'Academia', icon: '💪', domain: 'smartfit.com.br', patterns: [/smart\s*fit|smartfit/i] },
  { key: 'bio-ritmo', name: 'Bio Ritmo', category: 'Academia', icon: '💪', domain: 'bioritmo.com.br', patterns: [/bio\s*ritmo/i] },
  { key: 'gympass', name: 'Gympass / Wellhub', category: 'Academia', icon: '💪', domain: 'wellhub.com', patterns: [/gympass|wellhub/i] },
  { key: 'academia', name: 'Academia', category: 'Academia', icon: '💪', patterns: [/academia(?!\s*de\s*letras)/i] },
];

export interface TxLite {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string | null;
  type: string;
}

export interface DetectedSubscription {
  match_pattern: string;
  service_name: string;
  category: string;
  icon: string;
  estimated_amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  last_charge_date: string;
  next_expected_date: string;
  occurrences: number;
}

function normalizeDesc(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function matchKnown(desc: string): KnownService | null {
  for (const svc of KNOWN_SERVICES) {
    if (svc.patterns.some(p => p.test(desc))) return svc;
  }
  return null;
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/**
 * Analisa transações de despesa e devolve assinaturas detectadas.
 * Considera assinatura quando há ≥2 cobranças, intervalo médio 25-35 dias (mensal) ou 80-100 (trimestral) ou 350-380 (anual).
 */
export function detectSubscriptions(txs: TxLite[]): DetectedSubscription[] {
  const expenses = txs.filter(t => t.type === 'expense' && t.amount > 0);
  if (!expenses.length) return [];

  // Agrupa por padrão (conhecido ou descrição normalizada + faixa de valor)
  const groups = new Map<string, { svc: KnownService | null; key: string; desc: string; items: TxLite[] }>();

  for (const tx of expenses) {
    const desc = normalizeDesc(tx.description);
    const known = matchKnown(desc);
    if (known) {
      const k = `known:${known.key}`;
      if (!groups.has(k)) groups.set(k, { svc: known, key: k, desc: known.name, items: [] });
      groups.get(k)!.items.push(tx);
    } else {
      // chave genérica: primeiras 3 palavras + valor arredondado em faixas de R$5
      const words = desc.split(' ').slice(0, 3).join(' ');
      const bucket = Math.round(tx.amount / 5) * 5;
      const k = `gen:${words}:${bucket}`;
      if (!groups.has(k)) groups.set(k, { svc: null, key: k, desc: tx.description, items: [] });
      groups.get(k)!.items.push(tx);
    }
  }

  const detected: DetectedSubscription[] = [];

  for (const grp of groups.values()) {
    const items = grp.items.sort((a, b) => a.date.localeCompare(b.date));
    if (items.length < 2) continue;

    // calcula intervalos
    const intervals: number[] = [];
    for (let i = 1; i < items.length; i++) {
      intervals.push(daysBetween(items[i - 1].date, items[i].date));
    }
    const avg = intervals.reduce((s, n) => s + n, 0) / intervals.length;

    let frequency: 'monthly' | 'yearly' | 'weekly';
    if (avg >= 6 && avg <= 9) frequency = 'weekly';
    else if (avg >= 25 && avg <= 35) frequency = 'monthly';
    else if (avg >= 350 && avg <= 380) frequency = 'yearly';
    else if (grp.svc && items.length >= 2) frequency = 'monthly'; // serviço conhecido — assume mensal
    else continue;

    // valor estimado = mediana
    const sorted = [...items].sort((a, b) => a.amount - b.amount);
    const estimated = sorted[Math.floor(sorted.length / 2)].amount;
    const last = items[items.length - 1].date;
    const next =
      frequency === 'monthly' ? addMonths(last, 1) :
      frequency === 'yearly' ? addMonths(last, 12) :
      (() => { const d = new Date(last); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();

    detected.push({
      match_pattern: grp.key,
      service_name: grp.svc?.name || titleCase(grp.desc),
      category: grp.svc?.category || 'Outros',
      icon: grp.svc?.icon || '🔁',
      estimated_amount: estimated,
      frequency,
      last_charge_date: last,
      next_expected_date: next,
      occurrences: items.length,
    });
  }

  return detected.sort((a, b) => b.estimated_amount - a.estimated_amount);
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

/** Total mensalizado das assinaturas ativas. */
export function monthlyTotal(subs: { estimated_amount: number; frequency: string; status: string }[]): number {
  return subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      if (s.frequency === 'monthly') return sum + Number(s.estimated_amount);
      if (s.frequency === 'yearly') return sum + Number(s.estimated_amount) / 12;
      if (s.frequency === 'weekly') return sum + Number(s.estimated_amount) * 4.33;
      return sum;
    }, 0);
}
