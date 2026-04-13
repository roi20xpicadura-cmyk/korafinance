import { useState, useEffect, useCallback } from "react";
import { DailyEntry, GOAL_AMOUNT, GOAL_DAYS } from "@/types/dashboard";

const STORAGE_KEY = "financial-dashboard-entries";

function loadEntries(): DailyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useDashboardData() {
  const [entries, setEntries] = useState<DailyEntry[]>(loadEntries);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((entry: Omit<DailyEntry, "id" | "day" | "savingsPercent">) => {
    setEntries((prev) => {
      const day = prev.length + 1;
      const savingsPercent = entry.profit > 0 ? (entry.savedAmount / entry.profit) * 100 : 0;
      return [...prev, { ...entry, id: crypto.randomUUID(), day, savingsPercent }];
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, day: i + 1 })));
  }, []);

  const totalProfit = entries.reduce((s, e) => s + e.profit, 0);
  const totalSaved = entries.reduce((s, e) => s + e.savedAmount, 0);
  const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
  const totalAdSpend = entries.reduce((s, e) => s + e.adSpend, 0);
  const daysElapsed = entries.length;
  const daysRemaining = Math.max(0, GOAL_DAYS - daysElapsed);
  const remaining = Math.max(0, GOAL_AMOUNT - totalSaved);
  const progress = Math.min((totalSaved / GOAL_AMOUNT) * 100, 100);
  const expectedPace = (daysElapsed / GOAL_DAYS) * GOAL_AMOUNT;
  const isOnTrack = totalSaved >= expectedPace;
  const goalReached = totalSaved >= GOAL_AMOUNT;
  const avgSavingsPercent = entries.length > 0
    ? entries.reduce((s, e) => s + e.savingsPercent, 0) / entries.length
    : 0;
  const avgDailyProfit = entries.length > 0 ? totalProfit / entries.length : 0;

  return {
    entries,
    addEntry,
    removeEntry,
    totalProfit,
    totalSaved,
    totalRevenue,
    totalAdSpend,
    daysElapsed,
    daysRemaining,
    remaining,
    progress,
    isOnTrack,
    goalReached,
    avgSavingsPercent,
    avgDailyProfit,
  };
}
