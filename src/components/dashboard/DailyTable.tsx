import { useState } from "react";
import { DailyEntry, DAILY_SAVINGS_MIN } from "@/types/dashboard";
import { Trash2 } from "lucide-react";

interface DailyTableProps {
  entries: DailyEntry[];
  onAdd: (entry: Omit<DailyEntry, "id" | "day" | "savingsPercent">) => void;
  onRemove: (id: string) => void;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DailyTable({ entries, onAdd, onRemove }: DailyTableProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [revenue, setRevenue] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [savedAmount, setSavedAmount] = useState("");

  const profit = (parseFloat(revenue) || 0) - (parseFloat(adSpend) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rev = parseFloat(revenue) || 0;
    const ads = parseFloat(adSpend) || 0;
    const saved = parseFloat(savedAmount) || 0;
    if (rev <= 0) return;
    onAdd({ date, revenue: rev, adSpend: ads, profit: rev - ads, savedAmount: saved });
    setRevenue("");
    setAdSpend("");
    setSavedAmount("");
  };

  return (
    <div className="card-surface p-6 md:p-8">
      <h2 className="text-xl font-bold mb-6">📋 Controle Diário</h2>

      {/* Add entry form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="col-span-2 md:col-span-1 rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
        />
        <input
          type="number"
          placeholder="Receita (R$)"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          className="rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
          min="0"
          step="0.01"
        />
        <input
          type="number"
          placeholder="Gasto Ads (R$)"
          value={adSpend}
          onChange={(e) => setAdSpend(e.target.value)}
          className="rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
          min="0"
          step="0.01"
        />
        <input
          type="number"
          placeholder="Valor Guardado (R$)"
          value={savedAmount}
          onChange={(e) => setSavedAmount(e.target.value)}
          className="rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
          min="0"
          step="0.01"
        />
        <button
          type="submit"
          className="col-span-2 md:col-span-1 bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm hover:brightness-110 transition-all duration-200"
        >
          + Adicionar
        </button>
      </form>

      {/* Lucro preview */}
      {(revenue || adSpend) && (
        <p className="text-sm text-muted-foreground mb-4">
          Lucro estimado: <span className={profit >= 0 ? "text-primary font-bold" : "text-destructive font-bold"}>{formatBRL(profit)}</span>
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="py-3 px-2 font-medium">Dia</th>
              <th className="py-3 px-2 font-medium">Data</th>
              <th className="py-3 px-2 font-medium text-right">Receita</th>
              <th className="py-3 px-2 font-medium text-right">Ads</th>
              <th className="py-3 px-2 font-medium text-right">Lucro</th>
              <th className="py-3 px-2 font-medium text-right">Guardado</th>
              <th className="py-3 px-2 font-medium text-right">%</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhum registro. Adicione seu primeiro dia acima.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors duration-200">
                <td className="py-3 px-2 font-bold">{e.day}</td>
                <td className="py-3 px-2">{new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                <td className="py-3 px-2 text-right">{formatBRL(e.revenue)}</td>
                <td className="py-3 px-2 text-right text-destructive">{formatBRL(e.adSpend)}</td>
                <td className={`py-3 px-2 text-right font-bold ${e.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {formatBRL(e.profit)}
                </td>
                <td className={`py-3 px-2 text-right font-bold ${e.savedAmount >= DAILY_SAVINGS_MIN ? "text-primary" : "text-warning"}`}>
                  {formatBRL(e.savedAmount)}
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground">{e.savingsPercent.toFixed(1)}%</td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => onRemove(e.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors duration-200 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
