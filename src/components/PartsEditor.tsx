import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button, IconButton, Input } from "./ui";
import { fmt, num } from "../lib/format";
import type { Part, PartLine } from "../lib/types";

export interface DraftLine {
  key: string;
  partId?: string;
  name: string;
  unitCost: string;
  qty: string;
}

export const toDraftLines = (lines: PartLine[] = []): DraftLine[] =>
  lines.map((l) => ({ key: crypto.randomUUID(), partId: l.partId, name: l.name, unitCost: String(l.unitCost ?? ""), qty: String(l.qty ?? 1) }));

export const fromDraftLines = (lines: DraftLine[]): PartLine[] =>
  lines
    .filter((l) => l.name.trim())
    .map((l) => ({ ...(l.partId ? { partId: l.partId } : {}), name: l.name.trim(), unitCost: num(l.unitCost), qty: Math.max(1, Math.round(num(l.qty)) || 1) }));

const CUSTOM = "__custom";

export function PartsEditor({ value, onChange, stock, original }: { value: DraftLine[]; onChange(v: DraftLine[]): void; stock: Part[]; original: PartLine[] }) {
  const update = (key: string, patch: Partial<DraftLine>) => onChange(value.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const available = (partId: string) => {
    const part = stock.find((p) => p.id === partId);
    const prev = original.filter((l) => l.partId === partId).reduce((s, l) => s + l.qty, 0);
    const otherRows = value.filter((l) => l.partId === partId).reduce((s, l) => s + (num(l.qty) || 1), 0);
    return part ? part.qtyOnHand + prev - otherRows : Infinity;
  };
  const total = value.reduce((s, l) => s + num(l.unitCost) * (num(l.qty) || 1), 0);
  const sortedStock = [...stock].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-2">
      {value.map((l) => {
        const short = l.partId ? available(l.partId) < 0 : false;
        return (
          <div key={l.key} className="rounded-xl bg-zinc-50 p-2 ring-1 ring-zinc-200/70 dark:bg-zinc-950/50 dark:ring-zinc-800">
            <div className="grid grid-cols-[1fr_5rem_auto] gap-2 sm:grid-cols-[1.6fr_0.8fr_4.5rem_auto]">
              <div className="col-span-3 flex gap-2 sm:col-span-1">
                <select
                  aria-label="Part"
                  className="h-10 w-full min-w-0 rounded-xl border-0 bg-white px-3 text-sm ring-1 ring-zinc-300 ring-inset focus:ring-2 focus:ring-zinc-900 focus:outline-none dark:bg-black dark:ring-zinc-700 dark:focus:ring-zinc-200"
                  value={l.partId ?? CUSTOM}
                  onChange={(e) => {
                    const p = stock.find((s) => s.id === e.target.value);
                    update(l.key, p ? { partId: p.id, name: p.name, unitCost: String(p.unitCost) } : { partId: undefined, name: "" });
                  }}
                >
                  <option value={CUSTOM}>Custom part…</option>
                  {sortedStock.length > 0 && (
                    <optgroup label="From stock">
                      {sortedStock.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.qtyOnHand} left)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {!l.partId && <Input aria-label="Custom part name" placeholder="Part name" value={l.name} onChange={(e) => update(l.key, { name: e.target.value })} />}
              </div>
              <Input aria-label="Unit cost" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Unit cost" value={l.unitCost} onChange={(e) => update(l.key, { unitCost: e.target.value })} />
              <Input aria-label="Quantity" type="number" inputMode="numeric" min="1" step="1" placeholder="Qty" value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value })} />
              <IconButton label="Remove part" onClick={() => onChange(value.filter((x) => x.key !== l.key))} className="hover:text-signal!">
                <Trash2 />
              </IconButton>
            </div>
            {short && (
              <p className="mt-2 flex items-center gap-1.5 px-1 font-mono text-[11px] text-signal">
                <AlertTriangle className="size-3.5" /> Not enough in stock — stock will go negative.
              </p>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onChange([...value, { key: crypto.randomUUID(), name: "", unitCost: "", qty: "1" }])}>
          <Plus /> Add part
        </Button>
        {value.length > 0 && <span className="text-sm text-zinc-500 tabular">Parts total: {fmt(total)}</span>}
      </div>
    </div>
  );
}
