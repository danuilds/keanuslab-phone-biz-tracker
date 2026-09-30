import { useEffect, useState, type FormEvent } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../data/auth";
import { db } from "../lib/firebase";
import { today } from "../lib/format";
import { useFeedback } from "./feedback";
import { Badge, Button, IconButton, Input } from "./ui";

interface Entry {
  email: string;
  admin: boolean;
  addedAt?: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function AccessManager() {
  const { user } = useAuth();
  const { run, confirm } = useFeedback();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, "allowlist"), (snap) =>
      setEntries(snap.docs.map((d) => ({ email: d.id, admin: d.data().admin === true, addedAt: d.data().addedAt })).sort((a, b) => a.email.localeCompare(b.email))),
    );
  }, []);

  const me = user?.email?.toLowerCase();

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!db || !EMAIL.test(clean)) return;
    const ok = await run(() => setDoc(doc(db!, "allowlist", clean), { admin, addedBy: me ?? "", addedAt: today() }), `${clean} can now sign in`);
    if (ok) {
      setEmail("");
      setAdmin(false);
    }
  };

  const toggleAdmin = (entry: Entry) =>
    run(() => setDoc(doc(db!, "allowlist", entry.email), { admin: !entry.admin, addedBy: me ?? "", addedAt: entry.addedAt ?? today() }), entry.admin ? "Admin removed" : "Made admin");

  const remove = async (entry: Entry) => {
    if (!(await confirm({ title: `Remove ${entry.email}?`, text: "They'll lose access immediately. Their data is kept and comes back if you add them again.", confirmLabel: "Remove", danger: true }))) return;
    await run(() => deleteDoc(doc(db!, "allowlist", entry.email)), "Access removed");
  };

  return (
    <div className="max-w-lg space-y-4">
      <ul className="divide-y divide-dashed divide-zinc-200 rounded-xl border border-zinc-200/70 dark:divide-zinc-800 dark:border-zinc-800">
        {entries.map((entry) => (
          <li key={entry.email} className="flex items-center gap-3 px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-sm">{entry.email}</span>
            {entry.email === me && <Badge>You</Badge>}
            <button
              type="button"
              disabled={entry.email === me}
              onClick={() => void toggleAdmin(entry)}
              title={entry.email === me ? "You can't remove your own admin rights" : "Toggle admin"}
              className="disabled:cursor-not-allowed"
            >
              <Badge tone={entry.admin ? "violet" : "zinc"} dot>
                {entry.admin ? "Admin" : "Member"}
              </Badge>
            </button>
            <IconButton label={`Remove ${entry.email}`} disabled={entry.email === me} onClick={() => void remove(entry)} className="hover:text-signal! disabled:opacity-30">
              <Trash2 />
            </IconButton>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <Input type="email" required placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-56 flex-1" aria-label="Email to allow" />
        <label className="label-mono flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} className="size-4 accent-zinc-900 dark:accent-white" />
          Admin
        </label>
        <Button type="submit">
          <Plus /> Allow
        </Button>
      </form>
      <p className="font-mono text-[11px] text-zinc-500">Each person gets their own separate data. Admins can manage this list.</p>
    </div>
  );
}
