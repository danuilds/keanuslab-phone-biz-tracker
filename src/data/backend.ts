import {
  collection,
  doc,
  increment,
  onSnapshot,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

export type DocData = Record<string, unknown>;
export type Op =
  | { type: "set"; col: string; id: string; data: DocData }
  | { type: "delete"; col: string; id: string }
  | { type: "increment"; col: string; id: string; field: string; by: number };

export interface Backend {
  newId(): string;
  subscribe(col: string, cb: (docs: DocData[]) => void, onError: (e: Error) => void): () => void;
  commit(ops: Op[]): Promise<void>;
}

const stripId = ({ id: _id, ...rest }: DocData) => rest;

export function firestoreBackend(db: Firestore, uid: string): Backend {
  const ref = (col: string, id: string) => doc(db, "users", uid, col, id);
  return {
    newId: () => doc(collection(db, "_")).id,
    subscribe(col, cb, onError) {
      return onSnapshot(
        collection(db, "users", uid, col),
        (snap) => cb(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
        onError,
      );
    },
    async commit(ops) {
      // Firestore batches are capped at 500 writes.
      for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db);
        for (const op of ops.slice(i, i + 450)) {
          if (op.type === "set") batch.set(ref(op.col, op.id), stripId(op.data));
          else if (op.type === "delete") batch.delete(ref(op.col, op.id));
          else batch.update(ref(op.col, op.id), { [op.field]: increment(op.by) });
        }
        await batch.commit();
      }
    },
  };
}

const DEMO_KEY = "phonebiz-demo-v2";
type Store = Record<string, Record<string, DocData>>;

export function localBackend(): Backend & { clear(): void; isEmpty(): boolean } {
  let store: Store;
  try {
    store = JSON.parse(localStorage.getItem(DEMO_KEY) || "{}");
  } catch {
    store = {};
  }
  const listeners = new Map<string, Set<(docs: DocData[]) => void>>();
  const emit = (col: string) => {
    const docs = Object.entries(store[col] ?? {}).map(([id, d]) => ({ ...d, id }));
    listeners.get(col)?.forEach((cb) => cb(docs));
  };
  const save = () => localStorage.setItem(DEMO_KEY, JSON.stringify(store));

  return {
    newId: () => crypto.randomUUID(),
    subscribe(col, cb) {
      if (!listeners.has(col)) listeners.set(col, new Set());
      listeners.get(col)!.add(cb);
      queueMicrotask(() => emit(col));
      return () => listeners.get(col)!.delete(cb);
    },
    async commit(ops) {
      const touched = new Set<string>();
      for (const op of ops) {
        store[op.col] ??= {};
        touched.add(op.col);
        if (op.type === "set") store[op.col][op.id] = stripId(op.data);
        else if (op.type === "delete") delete store[op.col][op.id];
        else {
          const d = store[op.col][op.id];
          if (d) d[op.field] = (Number(d[op.field]) || 0) + op.by;
        }
      }
      save();
      touched.forEach(emit);
    },
    clear() {
      store = {};
      save();
      listeners.forEach((_, col) => emit(col));
    },
    isEmpty: () => Object.values(store).every((c) => !c || Object.keys(c).length === 0),
  };
}
