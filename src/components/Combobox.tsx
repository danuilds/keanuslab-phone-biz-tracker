import { useId, useMemo, useState } from "react";
import { History } from "lucide-react";
import { Input } from "./ui";
import { modelKey, type Suggestion } from "../lib/models";
import { cx } from "../lib/format";

const MAX = 8;

function filter(suggestions: Suggestion[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return suggestions.slice(0, MAX);
  const tokens = q.split(/\s+/);
  const qKey = modelKey(q);
  const hits = suggestions.filter((s) => tokens.every((t) => s.search.includes(t)) || (qKey && modelKey(s.search).includes(qKey)));
  const rank = (s: Suggestion) => (s.mine ? 0 : 2) + (s.value.toLowerCase().startsWith(q) ? 0 : 1);
  return hits
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .slice(0, MAX)
    .map((x) => x.s);
}

export function Combobox({
  id,
  value,
  onChange,
  onCommit,
  suggestions,
  placeholder,
  required,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange(v: string): void;
  onCommit?(v: string): void;
  suggestions: Suggestion[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = useMemo(() => filter(suggestions, value), [suggestions, value]);
  const exact = matches.length === 1 && matches[0].value === value;
  const show = open && matches.length > 0 && !exact;

  const pick = (v: string) => {
    onChange(v);
    onCommit?.(v);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          onCommit?.(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          } else if (e.key === "Enter" && show && active >= 0) {
            e.preventDefault();
            pick(matches[active].value);
          } else if (e.key === "Escape" && show) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1.5 max-h-72 w-full animate-fade-in overflow-y-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
        >
          {matches.map((s, i) => (
            <li
              key={s.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s.value);
              }}
              onMouseEnter={() => setActive(i)}
              className={cx(
                "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
                i === active && "bg-zinc-100 dark:bg-zinc-700/60",
              )}
            >
              {s.value}
              {s.mine && <History className="size-3.5 text-zinc-400" aria-label="Used before" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
