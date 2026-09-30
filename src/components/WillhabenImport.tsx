import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useData } from "../data/store";
import { Button, Field, Input, Modal, Textarea } from "./ui";
import { parseWillhaben, parseWillhabenUrl } from "../lib/willhaben";
import { fmt, today } from "../lib/format";
import type { Device } from "../lib/types";

export function WillhabenImport({ onClose, onContinue }: { onClose(): void; onContinue(preset: Partial<Device>): void }) {
  const { devices, repairs } = useData();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const used = useMemo(() => [...devices.map((d) => d.model), ...repairs.map((r) => r.device)].filter(Boolean), [devices, repairs]);
  const draft = useMemo(() => parseWillhaben(url, text, used), [url, text, used]);
  const urlInvalid = url.trim() !== "" && !parseWillhabenUrl(url);
  const hasInput = !!draft.url || text.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const notes = [
      draft.url && `willhaben: ${draft.url}`,
      draft.adCode && `willhaben-Code: ${draft.adCode}`,
      draft.title && `Ad: ${draft.title}`,
      draft.price != null && `Asking price: ${fmt(draft.price)}`,
      draft.unlocked && "Unlocked (no SIM lock)",
    ]
      .filter(Boolean)
      .join("\n");
    onContinue({
      model: draft.model ?? draft.title ?? "",
      storage: draft.storage,
      color: draft.color,
      condition: draft.condition,
      batteryBought: draft.battery,
      purchasePrice: draft.price,
      purchasedAt: today(),
      source: "willhaben",
      status: "Acquired",
      notes,
    });
  };

  const rows: [string, string | undefined][] = [
    ["Model", draft.model],
    ["Storage", draft.storage],
    ["Colour", draft.color],
    ["Condition", draft.condition],
    ["Price", draft.price != null ? fmt(draft.price) : undefined],
    ["Battery", draft.battery != null ? `${draft.battery}%` : undefined],
    ["Unlocked", draft.unlocked ? "Yes" : undefined],
  ];
  const linkOnly = !!draft.url && text.trim() === "";

  return (
    <Modal
      open
      onClose={onClose}
      title="Import from willhaben"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="willhaben-form" disabled={!hasInput || urlInvalid}>
            Continue <ArrowRight />
          </Button>
        </>
      }
    >
      <form id="willhaben-form" onSubmit={submit} className="space-y-4 py-2">
        <Field label="Ad link" hint={urlInvalid ? <span className="text-signal">That doesn't look like a willhaben.at link.</span> : undefined}>
          {(id) => <Input id={id} type="url" autoFocus placeholder="https://www.willhaben.at/iad/kaufen-und-verkaufen/d/…" value={url} onChange={(e) => setUrl(e.target.value)} />}
        </Field>
        <Field label="Ad text (optional, for price & details)" hint="On the ad page press Ctrl+A, then Ctrl+C, and paste here.">
          {(id) => <Textarea id={id} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the ad page here…" />}
        </Field>

        <div className="rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <div className="label-mono mb-3 text-zinc-500">Detected</div>
          <dl className="grid grid-cols-[6rem_1fr] gap-y-1.5 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-zinc-500">{label}</dt>
                <dd className={value ? "font-mono" : "text-zinc-400"}>{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {linkOnly && (
            <p className="mt-3 rounded-xl bg-amber-400/15 px-3 py-2 font-mono text-[11px] text-amber-800 dark:text-amber-300">
              Only the link was pasted — it contains just the title. Paste the ad text too to get price, storage, condition and more.
            </p>
          )}
          <p className="mt-3 font-mono text-[11px] text-zinc-500">You can adjust everything on the next screen. The asking price is used as the purchase price; change it to what you actually paid.</p>
        </div>
      </form>
    </Modal>
  );
}
