export interface DailyEntry {
  id: string;
  day: number;
  date: string;
  revenue: number;
  adSpend: number;
  profit: number;
  savedAmount: number;
  savingsPercent: number;
}

export const GOAL_AMOUNT = 10000;
export const GOAL_DAYS = 15;
export const DAILY_SAVINGS_MIN = 666.67;
