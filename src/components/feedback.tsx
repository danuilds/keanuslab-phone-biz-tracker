import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Modal } from "./ui";
import { cx } from "../lib/format";

interface Toast {
  id: number;
  text: string;
  tone: "success" | "error";
}
interface ConfirmOpts {
  title: string;
  text?: string;
  confirmLabel?: string;
  danger?: boolean;
}
interface Feedback {
  toast(text: string, tone?: Toast["tone"]): void;
  confirm(opts: ConfirmOpts): Promise<boolean>;
  run(action: () => Promise<unknown>, success?: string): Promise<boolean>;
}

const FeedbackContext = createContext<Feedback | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);
  const nextId = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3000);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => {
    setPending(opts);
    return new Promise<boolean>((resolve) => (resolver.current = resolve));
  }, []);

  const run = useCallback(
    async (action: () => Promise<unknown>, success?: string) => {
      try {
        await action();
        if (success) toast(success);
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
        return false;
      }
    },
    [toast],
  );

  const close = (v: boolean) => {
    resolver.current?.(v);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm, run }}>
      {children}
      <Modal
        open={!!pending}
        onClose={() => close(false)}
        title={pending?.title ?? ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button className={pending?.danger ? "bg-signal! text-white! hover:bg-accent-600!" : ""} onClick={() => close(true)}>
              {pending?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        {pending?.text && <p className="text-sm text-zinc-600 dark:text-zinc-400">{pending.text}</p>}
      </Modal>
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cx(
                "pointer-events-auto flex max-w-md animate-slide-up items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ring-1",
                "bg-white text-zinc-900 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
              )}
            >
              {t.tone === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4 text-signal" />}
              {t.text}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}
