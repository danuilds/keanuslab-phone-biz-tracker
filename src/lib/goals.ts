import { periodRange, summarize, type Data } from "./calc";
import { isoDate } from "./format";
import type { Goal, GoalMetric } from "./types";

export const GOAL_METRICS: Record<GoalMetric, { label: string; money: boolean }> = {
  net: { label: "Net profit", money: true },
  revenue: { label: "Revenue", money: true },
  soldCount: { label: "Devices sold", money: false },
  repairCount: { label: "Repairs completed", money: false },
};

const PACE_DAYS = 30;

export interface GoalProgress {
  goal: Goal;
  current: number;
  pct: number;
  status: "reached" | "on-track" | "behind";
  /** Projected date the target is hit this month or later; null when there's no positive pace. */
  eta: Date | null;
  projectedMonthEnd: number;
  neededPerDay: number;
}

/** Progress for the current month, projected from the rolling 30-day pace. */
export function goalProgress(data: Data, goal: Goal, now = new Date()): GoalProgress {
  const current = summarize(data, periodRange("month", 0))[goal.metric];
  const paceStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (PACE_DAYS - 1));
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const paceValue = summarize(data, { start: isoDate(paceStart), end: isoDate(tomorrow), label: "" })[goal.metric];
  const rate = paceValue / PACE_DAYS;

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = monthEnd.getDate() - now.getDate() + 1;
  const remaining = goal.target - current;
  const pct = goal.target > 0 ? Math.min(100, Math.max(0, (current / goal.target) * 100)) : 0;
  const projectedMonthEnd = current + Math.max(0, rate) * (daysLeft - 1);

  if (remaining <= 0) {
    return { goal, current, pct: 100, status: "reached", eta: null, projectedMonthEnd, neededPerDay: 0 };
  }

  const eta = rate > 0 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + Math.ceil(remaining / rate)) : null;
  return {
    goal,
    current,
    pct,
    status: eta && eta <= monthEnd ? "on-track" : "behind",
    eta,
    projectedMonthEnd,
    neededPerDay: remaining / daysLeft,
  };
}
