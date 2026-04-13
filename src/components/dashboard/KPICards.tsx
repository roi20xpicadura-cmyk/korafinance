interface KPICardsProps {
  totalProfit: number;
  totalSaved: number;
  totalRevenue: number;
  totalAdSpend: number;
  avgSavingsPercent: number;
  avgDailyProfit: number;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const kpis = (p: KPICardsProps) => [
  { icon: "📈", label: "Lucro Total", value: formatBRL(p.totalProfit), accent: "text-primary" },
  { icon: "🏦", label: "Total Guardado", value: formatBRL(p.totalSaved), accent: "text-primary" },
  { icon: "💰", label: "Receita Total", value: formatBRL(p.totalRevenue), accent: "text-foreground" },
  { icon: "📢", label: "Gasto com Ads", value: formatBRL(p.totalAdSpend), accent: "text-destructive" },
  { icon: "📊", label: "% Média Guardada", value: `${p.avgSavingsPercent.toFixed(1)}%`, accent: "text-primary" },
  { icon: "⚡", label: "Lucro Médio/Dia", value: formatBRL(p.avgDailyProfit), accent: "text-foreground" },
];

export default function KPICards(props: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis(props).map((kpi) => (
        <div key={kpi.label} className="card-surface p-5 flex items-start gap-4">
          <span className="text-2xl">{kpi.icon}</span>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.accent}`}>{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
