let money = new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" });
let moneyCompact = new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", notation: "compact" });

export function setCurrency(currency: string) {
  money = new Intl.NumberFormat(undefined, { style: "currency", currency });
  moneyCompact = new Intl.NumberFormat(undefined, { style: "currency", currency, notation: "compact" });
}

export const fmt = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? "—" : money.format(n));
export const fmtCompact = (n: number) => moneyCompact.format(n);
export const num = (v: unknown) => Number(v) || 0;

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate(new Date());
export const parseDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`);

export const daysBetween = (a: string, b: string) =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtDate = (iso?: string) => (iso ? dateFmt.format(parseDate(iso)) : "—");

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${Math.round(n)}%`;

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
