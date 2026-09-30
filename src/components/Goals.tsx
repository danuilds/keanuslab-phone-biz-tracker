import { useMemo } from "react";
import { Link } from "react-router";
import { Target } from "lucide-react";
import { useData } from "../data/store";
import { Card } from "./ui";
import { GOAL_METRICS, goalProgress, type GoalProgress } from "../lib/goals";
import { cx, fmt } from "../lib/format";

const DOTS = 30;
const dayFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

const statusStyle = {
  reached: { label: "Reached", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  "on-track": { label: "On track", text: "text-zinc-900 dark:text-white", dot: "bg-zinc-900 dark:bg-white" },
  behind: { label: "Behind", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" },
};

function GoalRow({ p }: { p: GoalProgress }) {
  const meta = GOAL_METRICS[p.goal.metric];
  const show = (n: number) => (meta.money ? fmt(n) : String(Math.round(n)));
  const style = statusStyle[p.status];
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const filled = Math.round((p.pct / 100) * DOTS);
  const projected = Math.min(DOTS, Math.round((Math.max(0, p.projectedMonthEnd) / p.goal.target) * DOTS));
  const todayMark = Math.min(DOTS - 1, Math.floor((now.getDate() / monthEnd.getDate()) * DOTS) - 1);

  let detail: string;
  if (p.status === "reached") detail = `Target ${show(p.goal.target)} hit — ${show(p.current - p.goal.target)} over`;
  else if (!p.eta) detail = `No progress in the last 30 days · need ${show(p.neededPerDay)}/day`;
  else if (p.status === "on-track") detail = `Expected ${dayFmt.format(p.eta)} · ${show(p.projectedMonthEnd)} projected by ${dayFmt.format(monthEnd)}`;
  else detail = `At this pace ${dayFmt.format(p.eta)} · need ${show(p.neededPerDay)}/day to hit by ${dayFmt.format(monthEnd)}`;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="label-mono text-zinc-500">{meta.label}</span>
        <span className={cx("label-mono inline-flex items-center gap-1.5 font-bold", style.text)}>
          <span className={cx("size-1.5 rounded-full", style.dot)} />
          {style.label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-dot text-2xl leading-none font-bold tabular">{show(p.current)}</span>
        <span className="font-mono text-xs text-zinc-500">/ {show(p.goal.target)}</span>
        <span className="ml-auto font-mono text-xs text-zinc-500 tabular">{Math.round(p.pct)}%</span>
      </div>
      <div className="mt-3 flex justify-between gap-0.5" role="progressbar" aria-valuenow={Math.round(p.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={meta.label}>
        {Array.from({ length: DOTS }, (_, i) => (
          <span
            key={i}
            className={cx(
              "size-2 rounded-full",
              i < filled ? style.dot : i < projected ? "bg-zinc-300 dark:bg-zinc-700" : "bg-zinc-100 dark:bg-zinc-900",
              i === todayMark && "ring-2 ring-signal/60 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950",
            )}
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] text-zinc-500">{detail}</p>
    </div>
  );
}

export function Goals() {
  const data = useData();
  const progress = useMemo(() => data.settings.goals.map((g) => goalProgress(data, g)), [data]);
  const monthName = new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date());

  return (
    <Card className="mt-4 p-5">
      <div className="mb-5 flex items-baseline justify-between gap-2">
        <h3 className="label-mono font-bold">Goals · {monthName}</h3>
        <Link to="/settings#goals" className="label-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          Edit
        </Link>
      </div>
      {progress.length ? (
        <>
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {progress.map((p) => (
              <GoalRow key={p.goal.metric} p={p} />
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 font-mono text-[10px] text-zinc-400">
            <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" /> projected by month end
            <span className="ml-3 size-2 rounded-full ring-2 ring-signal/60" /> today
            <span className="ml-3">Pace = last 30 days</span>
          </p>
        </>
      ) : (
        <Link to="/settings#goals" className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-300 dark:hover:text-white">
          <Target className="size-4" /> Set a monthly goal to see progress and when you'll hit it
        </Link>
      )}
    </Card>
  );
}
