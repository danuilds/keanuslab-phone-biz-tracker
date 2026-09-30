import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useData } from "../data/store";
import { Button, Field, Input, Modal, Textarea } from "./ui";
import { buildListing } from "../lib/listing";
import type { Device } from "../lib/types";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? "Copied" : label}
    </Button>
  );
}

export function ListingText({ device, onClose }: { device: Device; onClose(): void }) {
  const { parts } = useData();
  const [listing] = useState(() => buildListing(device, parts));
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Listing · ${device.stockId ?? device.model}`}
      footer={
        <>
          <CopyButton text={`${title}\n\n${description}`} label="Copy all" />
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <p className="font-mono text-[11px] text-zinc-500">Ready to sell. Here's a draft ad — edit it, then copy it into willhaben or any marketplace.</p>
        <Field label={`Title (${title.length} chars)`}>
          {(id) => (
            <div className="flex gap-2">
              <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} />
              <CopyButton text={title} label="Copy" />
            </div>
          )}
        </Field>
        <Field label="Description" hint="Check the claims (tested, reset, no activation lock) before posting.">
          {(id) => (
            <div className="space-y-2">
              <Textarea id={id} rows={13} value={description} onChange={(e) => setDescription(e.target.value)} className="font-mono text-[13px] leading-relaxed" />
              <CopyButton text={description} label="Copy description" />
            </div>
          )}
        </Field>
      </div>
    </Modal>
  );
}
