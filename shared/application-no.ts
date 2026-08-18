export function formatPartnerApplicationNo(seq: number): string {
  const n = Math.max(0, Math.floor(Number(seq) || 0));
  if (!n) {
    return "—";
  }
  return `P-${String(n).padStart(3, "0")}`;
}

export function nextApplicationSeq(items: { seq?: number }[]): number {
  return items.reduce((acc, item) => Math.max(acc, Number(item.seq) || 0), 0) + 1;
}

export function fillApplicationSeq<T extends { id: string; createdAt: string; seq?: number }>(items: T[]): T[] {
  let max = items.reduce((acc, item) => Math.max(acc, Number(item.seq) || 0), 0);
  const assigned = new Map<string, number>();
  const missing = [...items]
    .filter((item) => !(Number(item.seq) > 0))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const item of missing) {
    max += 1;
    assigned.set(item.id, max);
  }
  return items.map((item) => ({
    ...item,
    seq: Number(item.seq) > 0 ? Number(item.seq) : (assigned.get(item.id) ?? 0),
  }));
}

export function applicationSeqChanged<T extends { seq?: number }>(before: T[], after: T[]): boolean {
  if (before.length !== after.length) {
    return true;
  }
  return before.some((item, index) => Number(item.seq) !== Number(after[index]?.seq));
}
