import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, MessageCircle, Calendar, TrendingDown, ChevronRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CoachData {
  strategy: {
    recommended: "avalanche" | "snowball" | "hybrid";
    label: string;
    reason: string;
    estimated_savings: number;
  };
  freedom: {
    months: number | null;
    free_date: string | null;
    motivational: string;
  };
  dangerous_debts: Array<{
    debt_id: string;
    debt_name: string;
    severity: "critical" | "high" | "medium";
    reason: string;
    monthly_loss: number;
  }>;
  monthly_plan: Array<{
    month_label: string;
    focus_debt_id: string | null;
    focus_debt_name: string;
    suggested_payment: number;
    note: string;
  }>;
  negotiation_tips: Array<{
    debt_id: string;
    debt_name: string;
    creditor_type: string;
    script: string;
    target_discount: string;
  }>;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface Props {
  /** Trigger pra recarregar quando dívidas mudam */
  refreshKey?: number | string;
  /** Estratégia atual escolhida pelo usuário (pra comparar com a recomendada) */
  currentStrategy?: "avalanche" | "snowball";
  /** Callback quando usuário aceita a recomendação */
  onApplyStrategy?: (s: "avalanche" | "snowball") => void;
}

export function DebtCoachCard({ refreshKey, currentStrategy, onApplyStrategy }: Props) {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"strategy" | "danger" | "plan" | "negotiate">("strategy");
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.functions.invoke<CoachData>("debt-coach");
        if (cancelled) return;
        if (error) {
          console.error("[debt-coach] erro:", error);
          setData(null);
        } else {
          setData(result);
        }
      } catch (e) {
        console.error("[debt-coach] falhou:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div
        className="skeleton-shimmer"
        style={{
          margin: "16px 16px 0",
          height: 220,
          borderRadius: 20,
          background: "linear-gradient(135deg, var(--color-green-50), var(--color-bg-surface))",
          border: "1.5px solid var(--color-border-weak)",
        }}
      />
    );
  }

  if (!data) return null;

  const tabs: Array<{ id: typeof tab; label: string; count?: number; icon: React.ReactNode }> = [
    { id: "strategy", label: "Estratégia", icon: <Sparkles size={13} /> },
    { id: "danger", label: "Alertas", count: data.dangerous_debts.length, icon: <AlertTriangle size={13} /> },
    { id: "plan", label: "Plano 6m", icon: <Calendar size={13} /> },
    { id: "negotiate", label: "Negociar", count: data.negotiation_tips.length, icon: <MessageCircle size={13} /> },
  ];

  const copyScript = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScriptId(id);
      toast.success("Script copiado! Cole no WhatsApp do credor.");
      setTimeout(() => setCopiedScriptId(null), 2500);
    } catch {
      toast.error("Não consegui copiar. Selecione o texto manualmente.");
    }
  };

  const isUsingRecommended = currentStrategy && currentStrategy === data.strategy.recommended;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        margin: "16px 16px 0",
        background: "linear-gradient(135deg, var(--color-green-700), var(--color-green-900))",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid var(--color-green-600)",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
      }}
    >
      {/* halo decorativo */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: -40, right: -40, width: 160, height: 160,
          borderRadius: "50%", background: "var(--color-green-400)",
          opacity: 0.18, filter: "blur(40px)", pointerEvents: "none",
        }}
      />

      {/* header com Kora */}
      <div style={{ padding: "16px 18px 0", display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <Sparkles size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Análise da Kora
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            {data.freedom.motivational}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div
        style={{
          display: "flex", gap: 4, padding: "12px 14px 0",
          overflowX: "auto", scrollbarWidth: "none", position: "relative",
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flexShrink: 0, padding: "7px 12px", border: "none", cursor: "pointer",
                borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: active ? "#fff" : "rgba(255,255,255,0.1)",
                color: active ? "var(--color-green-700)" : "rgba(255,255,255,0.85)",
                display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.2s",
              }}
            >
              {t.icon}
              <span>{t.label}</span>
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  style={{
                    background: active ? "var(--color-green-600)" : "rgba(255,255,255,0.2)",
                    color: "#fff",
                    borderRadius: 99, padding: "0 6px", fontSize: 10, fontWeight: 800, minWidth: 16, textAlign: "center",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* conteúdo */}
      <div style={{ padding: "14px 18px 18px", position: "relative" }}>
        <AnimatePresence mode="wait">
          {tab === "strategy" && (
            <motion.div key="strategy" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 14, padding: 14,
                  backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>
                    {data.strategy.recommended === "avalanche" ? "🏔️" : data.strategy.recommended === "snowball" ? "⛄" : "🎯"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Recomendação
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                      {data.strategy.label}
                    </div>
                  </div>
                  {isUsingRecommended && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
                      background: "var(--color-success-500)", color: "#fff",
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <Check size={10} /> Em uso
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>
                  {data.strategy.reason}
                </p>
                {data.strategy.estimated_savings > 0 && (
                  <div
                    style={{
                      marginTop: 10, padding: "8px 12px",
                      background: "rgba(0,0,0,0.2)", borderRadius: 10,
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <TrendingDown size={14} color="var(--color-success-300)" />
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                      Economia em juros: <strong style={{ color: "var(--color-success-300)" }}>{fmt(data.strategy.estimated_savings)}</strong>
                    </div>
                  </div>
                )}
                {!isUsingRecommended && onApplyStrategy && data.strategy.recommended !== "hybrid" && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onApplyStrategy(data.strategy.recommended as "avalanche" | "snowball")}
                    style={{
                      marginTop: 12, width: "100%", height: 40,
                      background: "#fff", border: "none", borderRadius: 11,
                      color: "var(--color-green-700)", fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    Usar {data.strategy.label} <ChevronRight size={14} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {tab === "danger" && (
            <motion.div key="danger" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {data.dangerous_debts.length === 0 ? (
                <div
                  style={{
                    background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16,
                    textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 13,
                  }}
                >
                  ✅ Nenhuma dívida em estado crítico. Mantenha o ritmo!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.dangerous_debts.map((d) => {
                    const sevColor =
                      d.severity === "critical" ? "var(--color-danger-400)" :
                      d.severity === "high" ? "var(--color-warning-400)" :
                      "var(--color-info-400)";
                    return (
                      <div
                        key={d.debt_id}
                        style={{
                          background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 12,
                          borderLeft: `3px solid ${sevColor}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <AlertTriangle size={13} color={sevColor} />
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.debt_name}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: sevColor, fontFamily: "var(--font-mono)" }}>
                            -{fmt(d.monthly_loss)}/mês
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                          {d.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {tab === "plan" && (
            <motion.div key="plan" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {data.monthly_plan.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                  Complete os dados das dívidas (juros + mínimo) pra eu montar o plano.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.monthly_plan.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        background: i === 0 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.2)",
                        border: i === 0 ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                        borderRadius: 12, padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div
                          style={{
                            fontSize: 10, fontWeight: 800, padding: "2px 8px",
                            background: i === 0 ? "#fff" : "rgba(255,255,255,0.15)",
                            color: i === 0 ? "var(--color-green-700)" : "rgba(255,255,255,0.85)",
                            borderRadius: 99, letterSpacing: "0.04em",
                          }}
                        >
                          {p.month_label}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.focus_debt_name}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--color-success-300)", fontFamily: "var(--font-mono)" }}>
                          {fmt(p.suggested_payment)}
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{p.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "negotiate" && (
            <motion.div key="negotiate" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {data.negotiation_tips.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                  Nada urgente pra negociar agora.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.negotiation_tips.map((n) => (
                    <div key={n.debt_id} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {n.debt_name}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                          background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)",
                          textTransform: "capitalize",
                        }}>
                          {n.creditor_type}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-success-300)", fontWeight: 700, marginBottom: 8 }}>
                        🎯 Meta: {n.target_discount}
                      </div>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px",
                          fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.55,
                          fontFamily: "var(--font-mono)", marginBottom: 8,
                          maxHeight: 120, overflow: "auto",
                        }}
                      >
                        {n.script}
                      </div>
                      <button
                        onClick={() => copyScript(n.debt_id, n.script)}
                        style={{
                          width: "100%", height: 34, border: "none", cursor: "pointer",
                          background: copiedScriptId === n.debt_id ? "var(--color-success-500)" : "#fff",
                          color: copiedScriptId === n.debt_id ? "#fff" : "var(--color-green-700)",
                          borderRadius: 9, fontSize: 12, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          transition: "all 0.2s",
                        }}
                      >
                        {copiedScriptId === n.debt_id ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar script</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}