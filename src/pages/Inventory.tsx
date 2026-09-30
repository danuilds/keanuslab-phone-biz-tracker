import { useMemo, useState } from "react";
import { KanbanSquare, Plus, Rows3, Smartphone } from "lucide-react";
import { useData } from "../data/store";
import { useEditors } from "../components/editors";
import { useFeedback } from "../components/feedback";
import { DataTable, type Column } from "../components/DataTable";
import { Kanban } from "../components/Kanban";
import { Badge, Button, Card, Chips, EmptyState, PageHeader, Profit, SearchInput, Segmented } from "../components/ui";
import { daysInStock, deviceCost, deviceProfit } from "../lib/calc";
import { fmt, fmtDate } from "../lib/format";
import { deviceTone } from "../lib/status";
import { DEVICE_STATUSES, type Device, type DeviceStatus } from "../lib/types";
import { usePersistentState } from "../lib/usePersistentState";
import { stockNumber } from "../lib/stockId";

export function Inventory() {
  const { devices, saveDevice } = useData();
  const open = useEditors();
  const { run } = useFeedback();
  const [view, setView] = usePersistentState<"table" | "board">("inventory-view", "table");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DeviceStatus | "All">("All");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return devices.filter(
      (d) =>
        (view === "board" || status === "All" || d.status === status) &&
        (!term || [d.stockId, d.model, d.imei, d.storage, d.color, d.source, d.platform, d.notes].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [devices, q, status, view]);

  const inStock = devices.filter((d) => d.status !== "Sold");

  const columns: Column<Device>[] = [
    { key: "stockId", header: "ID", sort: (d) => stockNumber(d.stockId), render: (d) => <span className="font-mono text-xs text-zinc-500">{d.stockId ?? "—"}</span> },
    {
      key: "model",
      header: "Device",
      sort: (d) => d.model.toLowerCase(),
      render: (d) => (
        <div>
          <div className="font-medium">{d.model}</div>
          <div className="text-xs text-zinc-500">{[d.storage, d.color, d.condition].filter(Boolean).join(" · ") || d.imei || "—"}</div>
        </div>
      ),
    },
    { key: "status", header: "Status", sort: (d) => DEVICE_STATUSES.indexOf(d.status), render: (d) => <Badge tone={deviceTone[d.status]} dot>{d.status}</Badge> },
    { key: "bought", header: "Bought", sort: (d) => d.purchasedAt, render: (d) => <span className="text-zinc-500">{fmtDate(d.purchasedAt)}</span> },
    { key: "days", header: "Days", align: "right", sort: (d) => daysInStock(d), render: (d) => <span className="text-zinc-500">{daysInStock(d)}</span> },
    { key: "cost", header: "Total cost", align: "right", sort: deviceCost, render: (d) => fmt(deviceCost(d)) },
    { key: "sale", header: "Sale price", align: "right", sort: (d) => d.salePrice ?? -1, render: (d) => fmt(d.salePrice) },
    { key: "profit", header: "Profit", align: "right", sort: (d) => deviceProfit(d) ?? -Infinity, render: (d) => <Profit value={deviceProfit(d)} /> },
  ];

  const move = (d: Device, to: DeviceStatus) => {
    if (to === "Sold") return open({ kind: "device", record: d, preset: { status: "Sold" } });
    void run(() => saveDevice({ ...d, status: to }), `${d.model} → ${to}`);
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle={`${inStock.length} in stock · ${fmt(inStock.reduce((s, d) => s + deviceCost(d), 0))} invested`}
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
            <Button onClick={() => open({ kind: "device" })}>
              <Plus /> Add device
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search model, IMEI…" />
        {view === "table" && <Chips value={status} onChange={setStatus} options={DEVICE_STATUSES} />}
      </div>

      {view === "table" ? (
        <Card>
          <DataTable
            columns={columns}
            rows={filtered}
            initialSort={{ key: "bought", dir: "desc" }}
            onRowClick={(d) => open({ kind: "device", record: d })}
            empty={
              <EmptyState
                icon={<Smartphone />}
                title={devices.length ? "No matches" : "No devices yet"}
                text={devices.length ? "Try a different search or filter." : "Add the first phone you've bought to start tracking cost and profit."}
                action={!devices.length && <Button onClick={() => open({ kind: "device" })}><Plus /> Add device</Button>}
              />
            }
          />
        </Card>
      ) : (
        <Kanban
          statuses={DEVICE_STATUSES}
          items={filtered}
          getStatus={(d) => d.status}
          tones={deviceTone}
          onMove={move}
          onOpen={(d) => open({ kind: "device", record: d })}
          columnMeta={(s, items) => (s === "Sold" ? null : items.length ? fmt(items.reduce((sum, d) => sum + deviceCost(d), 0)) : null)}
          renderCard={(d) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.model}</div>
                  <div className="truncate text-xs text-zinc-500">{[d.storage, d.color].filter(Boolean).join(" · ") || d.condition}</div>
                </div>
                {d.status === "Sold" ? <Profit value={deviceProfit(d)} /> : <span className="text-sm tabular">{fmt(deviceCost(d))}</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-mono">{d.stockId}</span>
                <span>{daysInStock(d)}d {d.status === "Sold" ? "to sell" : "in stock"}</span>
                {d.parts.length > 0 && <span>{d.parts.length} part{d.parts.length > 1 ? "s" : ""}</span>}
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
