import { GOAL_AMOUNT, GOAL_DAYS } from "@/types/dashboard";

interface GoalTrackerProps {
  totalSaved: number;
  remaining: number;
  progress: number;
  daysElapsed: number;
  daysRemaining: number;
  isOnTrack: boolean;
  goalReached: boolean;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GoalTracker({
  totalSaved,
  remaining,
  progress,
  daysElapsed,
  daysRemaining,
  isOnTrack,
  goalReached,
}: GoalTrackerProps) {
  return (
    <div className="card-surface p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-1">
        🎯 Meta: Guardar R$ 10.000 em 15 dias
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {goalReached
          ? "🏆 Meta Atingida! Parabéns!"
          : isOnTrack
          ? "Você está no caminho certo! ✅"
          : "Atenção: você está abaixo do ritmo necessário ⚠️"}
      </p>

      {/* Progress bar */}
      <div className="relative w-full h-[18px] rounded-full bg-secondary overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: goalReached ? "hsl(var(--gold))" : "hsl(var(--primary))",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
          {progress.toFixed(1)}%
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Meta Total</p>
          <p className="font-bold text-lg">{formatBRL(GOAL_AMOUNT)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Acumulado</p>
          <p className="font-bold text-lg text-primary">{formatBRL(totalSaved)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Faltam</p>
          <p className="font-bold text-lg">{formatBRL(remaining)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Dias</p>
          <p className="font-bold text-lg">
            {daysElapsed}/{GOAL_DAYS}{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({daysRemaining} restantes)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
