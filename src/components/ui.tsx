import { useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx, fmt } from "../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200",
  secondary: "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:ring-zinc-900 dark:bg-black dark:text-zinc-100 dark:ring-zinc-700 dark:hover:ring-zinc-300",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
  danger: "text-signal hover:bg-signal/10",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 gap-1.5 rounded-full",
  md: "h-10 px-5 gap-2 rounded-full",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      className={cx(
        "label-mono inline-flex shrink-0 items-center justify-center font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-signal dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 [&_svg]:size-[18px]",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-950", className)}>
      {children}
    </div>
  );
}

export type Tone = "zinc" | "blue" | "amber" | "violet" | "emerald" | "rose" | "sky";
const tones: Record<Tone, string> = {
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  amber: "bg-amber-400/15 text-amber-800 dark:text-amber-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "bg-signal/10 text-signal",
};
export const toneDot: Record<Tone, string> = {
  zinc: "bg-zinc-400 dark:bg-zinc-500",
  blue: "bg-blue-500",
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-signal",
};
export const toneColumn: Record<Tone, string> = {
  zinc: "bg-zinc-200/40 dark:bg-zinc-900/60",
  blue: "bg-blue-500/5 dark:bg-blue-400/5",
  sky: "bg-sky-500/5 dark:bg-sky-400/5",
  amber: "bg-amber-400/10 dark:bg-amber-300/5",
  violet: "bg-violet-500/5 dark:bg-violet-400/5",
  emerald: "bg-emerald-500/5 dark:bg-emerald-400/5",
  rose: "bg-signal/5",
};

export function Badge({ tone = "zinc", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx("label-mono inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 whitespace-nowrap", tones[tone])}>
      {dot && <span className={cx("size-1.5 rounded-full", toneDot[tone])} />}
      {children}
    </span>
  );
}

const control =
  "w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:bg-black dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-200";

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx(control, "h-10", className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} className={cx(control, className)} {...p} />;
export function Select({ className, options, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
  return (
    <select className={cx(control, "h-10 pr-8", className)} {...p}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="label-mono text-zinc-500">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose(): void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/30 backdrop-blur-[3px] dark:bg-black/60" onClick={onClose} />
      <div
        className={cx(
          "relative flex max-h-[92dvh] w-full animate-slide-up flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-zinc-950 dark:ring-1 dark:ring-zinc-800",
          wide ? "sm:max-w-3xl" : "sm:max-w-xl",
        )}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="font-dot text-2xl font-bold tracking-tight uppercase">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 pb-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-dot text-4xl leading-none font-bold tracking-tight uppercase sm:text-5xl">{title}</h1>
        {subtitle && <p className="label-mono mt-3 text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange(v: NoInfer<T>): void; options: { value: NoInfer<T>; label: ReactNode; title?: string }[] }) {
  return (
    <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-zinc-200 dark:bg-black dark:ring-zinc-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "label-mono inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 font-bold transition-all [&_svg]:size-4",
            value === o.value
              ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700 [&_svg]:size-6">{icon}</div>
      <h3 className="font-dot text-xl font-bold uppercase">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-zinc-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange(v: string): void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-64">
      <svg className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, options }: { value: NoInfer<T> | "All"; onChange(v: NoInfer<T> | "All"): void; options: readonly T[] }) {
  return (
    <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
      {(["All", ...options] as (T | "All")[]).map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cx(
            "label-mono h-8 shrink-0 rounded-full px-3.5 font-bold whitespace-nowrap transition-colors",
            value === o
              ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
              : "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:ring-zinc-900 dark:bg-black dark:text-zinc-400 dark:ring-zinc-800 dark:hover:ring-zinc-400",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Profit({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-zinc-400">—</span>;
  return <span className={cx("font-mono tabular", value < 0 ? "text-signal" : "text-emerald-600 dark:text-emerald-400")}>{value > 0 ? "+" : ""}{fmt(value)}</span>;
}
