import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { DailyEntry, GOAL_AMOUNT } from "@/types/dashboard";

interface AccumulationChartProps {
  entries: DailyEntry[];
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AccumulationChart({ entries }: AccumulationChartProps) {
  let accumulated = 0;
  const data = entries.map((e) => {
    accumulated += e.savedAmount;
    return {
      name: `Dia ${e.day}`,
      acumulado: accumulated,
      lucro: e.profit,
      guardado: e.savedAmount,
    };
  });

  return (
    <div className="card-surface p-6 md:p-8">
      <h2 className="text-xl font-bold mb-6">📊 Evolução Acumulada</h2>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Adicione registros diários para ver o gráfico.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145, 100%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145, 100%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
            <XAxis dataKey="name" stroke="hsl(0, 0%, 62%)" fontSize={12} />
            <YAxis stroke="hsl(0, 0%, 62%)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 6.7%)",
                border: "1px solid hsl(0, 0%, 16%)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number, name: string) => [
                formatBRL(value),
                name === "acumulado" ? "Acumulado" : name === "lucro" ? "Lucro" : "Guardado",
              ]}
            />
            <ReferenceLine y={GOAL_AMOUNT} stroke="hsl(51, 100%, 50%)" strokeDasharray="6 3" label={{ value: "Meta", fill: "hsl(51, 100%, 50%)", fontSize: 12 }} />
            <Area type="monotone" dataKey="acumulado" stroke="hsl(145, 100%, 39%)" fill="url(#greenGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
