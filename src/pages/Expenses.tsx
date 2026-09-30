import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Receipt } from "lucide-react";
import { useData } from "../data/store";
import { useEditors } from "../components/editors";
import { DataTable, type Column } from "../components/DataTable";
import { Badge, Button, Card, Chips, EmptyState, IconButton, PageHeader, SearchInput } from "../components/ui";
import { inRange, periodRange } from "../lib/calc";
import { fmt, fmtDate } from "../lib/format";
import { EXPENSE_CATEGORIES, type Expense } from "../lib/types";

export function Expenses() {
  const { expenses } = useData();
  const open = useEditors();
  const [offset, setOffset] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number] | "All">("All");

  const range = useMemo(() => (offset == null ? periodRange("all") : periodRange("month", offset)), [offset]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return expenses.filter(
      (x) => inRange(x.date, range) && (category === "All" || x.category === category) && (!term || x.description.toLowerCase().includes(term)),
    );
  }, [expenses, range, category, q]);
  const total = filtered.reduce((s, x) => s + x.amount, 0);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of expenses.filter((x) => inRange(x.date, range))) m.set(x.category, (m.get(x.category) ?? 0) + x.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses, range]);
  const maxCat = byCategory[0]?.[1] ?? 0;

  const columns: Column<Expense>[] = [
    { key: "date", header: "Date", sort: (x) => x.date, render: (x) => <span className="text-zinc-500">{fmtDate(x.date)}</span> },
    { key: "description", header: "Description", sort: (x) => x.description.toLowerCase(), render: (x) => <span className="font-medium">{x.description}</span> },
    { key: "category", header: "Category", sort: (x) => x.category, render: (x) => <Badge>{x.category}</Badge> },
    { key: "amount", header: "Amount", align: "right", sort: (x) => x.amount, render: (x) => fmt(x.amount) },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${fmt(total)} across ${filtered.length} expense${filtered.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => open({ kind: "expense" })}>
            <Plus /> Add expense
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <IconButton label="Previous month" className="size-8" onClick={() => setOffset((o) => (o ?? 0) - 1)}>
            <ChevronLeft />
          </IconButton>
          <span className="min-w-36 text-center text-sm font-medium">{range.label}</span>
          <IconButton label="Next month" className="size-8" onClick={() => setOffset((o) => (o ?? 0) + 1)}>
            <ChevronRight />
          </IconButton>
        </div>
        <Button variant={offset == null ? "primary" : "secondary"} onClick={() => setOffset((o) => (o == null ? 0 : null))}>
          All time
        </Button>
        <SearchInput value={q} onChange={setQ} placeholder="Search expenses…" />
      </div>
      <div className="mb-4">
        <Chips value={category} onChange={setCategory} options={EXPENSE_CATEGORIES} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Card>
          <DataTable
            columns={columns}
            rows={filtered}
            initialSort={{ key: "date", dir: "desc" }}
            onRowClick={(x) => open({ kind: "expense", record: x })}
            empty={<EmptyState icon={<Receipt />} title="No expenses" text={`Nothing recorded for ${range.label.toLowerCase()}.`} />}
          />
        </Card>
        <Card className="h-fit p-5">
          <h3 className="text-sm font-medium">By category</h3>
          <div className="mt-4 space-y-3">
            {byCategory.length === 0 && <p className="text-sm text-zinc-500">No data.</p>}
            {byCategory.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{cat}</span>
                  <span className="font-medium tabular">{fmt(amount)}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full rounded-full bg-zinc-900 dark:bg-white" style={{ width: `${(amount / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
