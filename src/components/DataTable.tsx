import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "../lib/format";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sort?: (row: T) => string | number | null | undefined;
  align?: "left" | "right";
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  initialSort,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState(initialSort);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    const get = col.sort;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a) ?? "";
      const y = get(b) ?? "";
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  }, [rows, columns, sort]);

  if (!rows.length && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dashed border-zinc-300 dark:border-zinc-800">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={cx("label-mono px-4 py-3 font-normal whitespace-nowrap text-zinc-500 first:pl-5 last:pr-5", c.align === "right" ? "text-right" : "text-left", c.className)}
                >
                  {c.sort ? (
                    <button
                      type="button"
                      className={cx("inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100", active && "text-zinc-900 dark:text-zinc-100")}
                      onClick={() => setSort({ key: c.key, dir: active && sort?.dir === "desc" ? "asc" : "desc" })}
                    >
                      {c.header}
                      {active && (sort?.dir === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-zinc-200 dark:divide-zinc-800">
          {sorted.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick && (() => onRowClick(row))}
              onKeyDown={onRowClick && ((e) => e.key === "Enter" && onRowClick(row))}
              tabIndex={onRowClick ? 0 : undefined}
              className={cx("transition-colors", onRowClick && "cursor-pointer outline-none hover:bg-zinc-50 focus-visible:bg-zinc-50 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx("px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5", c.align === "right" && "text-right font-mono text-[13px] tabular", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
