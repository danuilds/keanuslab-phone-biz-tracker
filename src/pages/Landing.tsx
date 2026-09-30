import { useState } from "react";
import { ArrowRight, BarChart3, Boxes, FileSpreadsheet, KanbanSquare, Moon, ShieldCheck, Sun, Wrench, type LucideIcon } from "lucide-react";
import { useAuth } from "../data/auth";
import { Button, IconButton } from "../components/ui";
import { Logo } from "../layouts/AppLayout";
import { useTheme } from "../lib/theme";

const features: { icon: LucideIcon; title: string; text: string; dot: string }[] = [
  { icon: KanbanSquare, title: "Inventory (pipeline)", text: "Acquired → sold, cost incl. parts", dot: "bg-violet-500" },
  { icon: Wrench, title: "Repairs (jobs)", text: "Intake to pickup, profit per job", dot: "bg-sky-400" },
  { icon: Boxes, title: "Parts (stock)", text: "Auto-deducted, low-stock alerts", dot: "bg-amber-400" },
  { icon: BarChart3, title: "Analytics (profit)", text: "Monthly net, best models to flip", dot: "bg-emerald-500" },
  { icon: FileSpreadsheet, title: "CSV (in/out)", text: "Import sheets, export anytime", dot: "bg-blue-500" },
  { icon: ShieldCheck, title: "Private (default)", text: "Google sign-in, locked by rules", dot: "bg-signal" },
];

/** Dot-matrix bar chart, drawn as a grid of dots. */
function DotChart() {
  const bars = [3, 4, 3, 5, 5, 6, 5, 7, 7, 8, 7, 9];
  const rows = 9;
  return (
    <div className="grid grid-cols-12 gap-1.5" aria-hidden>
      {bars.map((b, x) => (
        <div key={x} className="flex flex-col-reverse gap-1.5">
          {Array.from({ length: rows }, (_, y) => (
            <span
              key={y}
              className={
                y < b
                  ? x === bars.length - 1 && y === b - 1
                    ? "mx-auto size-2 rounded-full bg-signal"
                    : "mx-auto size-2 rounded-full bg-zinc-900 dark:bg-white"
                  : "mx-auto size-2 rounded-full bg-zinc-200 dark:bg-zinc-800"
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const bar = "rounded-2xl border border-zinc-200/70 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95";

export function Landing() {
  const { signIn, startDemo, firebaseEnabled } = useAuth();
  const { theme, toggle } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState(true);

  const login = () => signIn().catch((e: Error) => setError(e.message));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-3 z-30 mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-md">
        <div className={`${bar} grid h-11 grid-cols-[1fr_auto_1fr] items-center px-2`}>
          <IconButton label="Toggle theme" onClick={toggle} className="size-8">
            {theme === "dark" ? <Sun /> : <Moon />}
          </IconButton>
          <Logo className="text-lg" />
          <div className="justify-self-end">
            {firebaseEnabled && (
              <button type="button" onClick={login} className="label-mono rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                Sign in
              </button>
            )}
          </div>
        </div>
        {offer && (
          <div className={`${bar} label-mono relative mt-2 flex h-7 items-center justify-center gap-1.5`}>
            New here?
            <button type="button" onClick={startDemo} className="underline underline-offset-2 hover:text-signal">
              Try the demo
            </button>
            <button type="button" aria-label="Dismiss" onClick={() => setOffer(false)} className="absolute right-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              ✕
            </button>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <h1 className="font-dot text-5xl leading-[0.95] font-black tracking-tight uppercase sm:text-7xl">
          Every phone.
          <br />
          Every euro.
        </h1>
        <p className="label-mono mx-auto mt-6 max-w-md text-zinc-500">Inventory · repairs · parts · profit — for phone repair &amp; resale</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {firebaseEnabled && (
            <Button onClick={login} className="h-12 px-7">
              Continue with Google
            </Button>
          )}
          <Button variant="secondary" onClick={startDemo} className="h-12 px-7">
            Try the demo <ArrowRight />
          </Button>
        </div>
        {error && <p className="mt-4 font-mono text-xs text-signal">{error}</p>}

        <div className="mx-auto mt-20 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
          {[
            ["Net profit", "€2,418", "+18%"],
            ["Devices sold", "14", "+4"],
            ["Days to sell", "11", "−3"],
          ].map(([l, v, d], i) => (
            <div
              key={l}
              className={
                i === 0
                  ? "rounded-2xl bg-zinc-900 p-5 text-white dark:bg-white dark:text-black"
                  : "rounded-2xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              }
            >
              <div className="flex justify-between">
                <span className="label-mono opacity-60">{l}</span>
                <span className="font-mono text-xs text-emerald-500">{d}</span>
              </div>
              <div className="mt-6 font-dot text-4xl leading-none font-bold">{v}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 sm:col-span-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-5 flex justify-between">
              <span className="label-mono font-bold">Profit</span>
              <span className="label-mono text-zinc-400">Last 12 months</span>
            </div>
            <DotChart />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center font-dot text-3xl font-bold uppercase">Features</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text, dot }) => (
            <div key={title} className="group text-center">
              <div className="relative mx-auto flex aspect-[4/5] max-w-44 items-center justify-center rounded-2xl border border-zinc-200/70 bg-white transition-colors group-hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:border-zinc-400">
                <span className={`absolute top-3 right-3 size-2 rounded-full ${dot}`} />
                <Icon className="size-10 text-zinc-800 dark:text-zinc-200" strokeWidth={1.25} />
              </div>
              <h3 className="mt-4 text-sm">{title}</h3>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="label-mono border-t border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-800">
        PhoneBiz <span className="text-signal">●</span> Hosted on Firebase
      </footer>
    </div>
  );
}
