import { useEffect, useState } from "react";

export function usePersistentState<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => (localStorage.getItem(key) as T | null) ?? initial);
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue] as const;
}
