import { useState } from "react";
import { LogOut, RotateCw } from "lucide-react";
import { useAuth } from "../data/auth";
import { Button } from "../components/ui";
import { Logo } from "../layouts/AppLayout";

export function NoAccess() {
  const { user, signOut, recheckAccess } = useAuth();
  const [checking, setChecking] = useState(false);

  const retry = async () => {
    setChecking(true);
    await recheckAccess();
    setChecking(false);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo className="text-2xl" />
      <div className="mt-10 max-w-md rounded-2xl border border-zinc-200/70 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-fit items-center gap-2">
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="label-mono font-bold">Access pending</span>
        </div>
        <h1 className="mt-4 font-dot text-3xl font-bold uppercase">Not on the list yet</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          You're signed in as <b className="font-mono text-zinc-900 dark:text-white">{user?.email}</b>, but this account hasn't been approved. Ask the owner to add this email under
          Settings → Access.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => void retry()} disabled={checking}>
            <RotateCw /> {checking ? "Checking…" : "Check again"}
          </Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
