import type { Device } from "./types";

const PREFIX = "PB-";

export const stockNumber = (id?: string) => Number(id?.match(/(\d+)$/)?.[1] ?? 0);
export const formatStockId = (n: number) => `${PREFIX}${String(n).padStart(4, "0")}`;

export function nextStockIds(existing: Pick<Device, "stockId">[], count: number) {
  const max = existing.reduce((m, d) => Math.max(m, stockNumber(d.stockId)), 0);
  return Array.from({ length: count }, (_, i) => formatStockId(max + 1 + i));
}
