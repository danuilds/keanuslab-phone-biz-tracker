import { useMemo, useState } from "react";
import { KanbanSquare, Plus, Rows3, Wrench } from "lucide-react";
import { useData } from "../data/store";
import { useEditors } from "../components/editors";
import { useFeedback } from "../components/feedback";
import { DataTable, type Column } from "../components/DataTable";
import { Kanban } from "../components/Kanban";
import { Badge, Button, Card, Chips, EmptyState, PageHeader, Profit, SearchInput, Segmented } from "../components/ui";
import { isRepairDone, partsCost, repairProfit } from "../lib/calc";
import { daysBetween, fmt, fmtDate, today } from "../lib/format";
import { repairTone } from "../lib/status";
import { REPAIR_STATUSES, type Repair, type RepairStatus } from "../lib/types";
import { usePersistentState } from "../lib/usePersistentState";

export function Repairs() {
  const { repairs, saveRepair } = useData();
  const open = useEditors();
  const { run } = useFeedback();
  const [view, setView] = usePersistentState<"table" | "board">("repairs-view", "board");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RepairStatus | "All">("All");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return repairs.filter(
      (r) =>
        (view === "board" || status === "All" || r.status === status) &&
        (!term || [r.customer, r.contact, r.device, r.issue, r.notes].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [repairs, q, status, view]);

  const openCount = repairs.filter((r) => !isRepairDone(r)).length;
  const awaiting = repairs.filter((r) => r.status === "Done");

  const columns: Column<Repair>[] = [
    { key: "date", header: "Received", sort: (r) => r.date, render: (r) => <span className="text-zinc-500">{fmtDate(r.date)}</span> },
    {
      key: "customer",
      header: "Customer",
      sort: (r) => r.customer.toLowerCase(),
      render: (r) => (
        <div>
          <div className="font-medium">{r.customer}</div>
          <div className="text-xs text-zinc-500">{r.contact || "—"}</div>
        </div>
      ),
    },
    {
      key: "device",
      header: "Device",
      sort: (r) => r.device.toLowerCase(),
      render: (r) => (
        <div className="max-w-64">
          <div>{r.device}</div>
          <div className="truncate text-xs text-zinc-500">{r.issue || "—"}</div>
        </div>
      ),
    },
    { key: "status", header: "Status", sort: (r) => REPAIR_STATUSES.indexOf(r.status), render: (r) => <Badge tone={repairTone[r.status]} dot>{r.status}</Badge> },
    { key: "parts", header: "Parts", align: "right", sort: (r) => partsCost(r.parts), render: (r) => fmt(partsCost(r.parts)) },
    { key: "charged", header: "Charged", align: "right", sort: (r) => r.charged ?? -1, render: (r) => fmt(r.charged) },
    { key: "profit", header: "Profit", align: "right", sort: repairProfit, render: (r) => (r.charged == null ? <Profit value={null} /> : <Profit value={repairProfit(r)} />) },
  ];

  return (
    <>
      <PageHeader
        title="Repairs"
        subtitle={`${openCount} open · ${awaiting.length} ready for pickup${awaiting.length ? ` (${fmt(awaiting.reduce((s, r) => s + (r.charged ?? 0), 0))})` : ""}`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "table", label: <Rows3 />, title: "Table" },
                { value: "board", label: <KanbanSquare />, title: "Board" },
              ]}
            />
            <Button onClick={() => open({ kind: "repair" })}>
              <Plus /> New job
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search customer, device…" />
        {view === "table" && <Chips value={status} onChange={setStatus} options={REPAIR_STATUSES} />}
      </div>

      {view === "table" ? (
        <Card>
          <DataTable
            columns={columns}
            rows={filtered}
            initialSort={{ key: "date", dir: "desc" }}
            onRowClick={(r) => open({ kind: "repair", record: r })}
            empty={
              <EmptyState
                icon={<Wrench />}
                title={repairs.length ? "No matches" : "No repair jobs yet"}
                text={repairs.length ? "Try a different search or filter." : "Log customer repairs to track parts, charges and profit per job."}
                action={!repairs.length && <Button onClick={() => open({ kind: "repair" })}><Plus /> New job</Button>}
              />
            }
          />
        </Card>
      ) : (
        <Kanban
          statuses={REPAIR_STATUSES}
          items={filtered}
          getStatus={(r) => r.status}
          tones={repairTone}
          onMove={(r, to) => void run(() => saveRepair({ ...r, status: to }), `${r.customer} → ${to}`)}
          onOpen={(r) => open({ kind: "repair", record: r })}
          renderCard={(r) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.device}</div>
                  <div className="truncate text-xs text-zinc-500">{r.customer}</div>
                </div>
                {r.charged != null && <span className="text-sm tabular">{fmt(r.charged)}</span>}
              </div>
              {r.issue && <p className="line-clamp-2 text-xs text-zinc-500">{r.issue}</p>}
              <div className="text-xs text-zinc-400">
                {isRepairDone(r) ? `Finished ${fmtDate(r.completedAt)}` : `${daysBetween(r.date, today())}d since intake`}
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
