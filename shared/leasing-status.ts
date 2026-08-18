export type LeasingStatus = "in_work" | "waiting_originals" | "completed" | "rejected";

export const LEASING_STATUS_LABEL: Record<LeasingStatus, string> = {
  in_work: "В работе",
  waiting_originals: "Ожидание оригиналов",
  completed: "Завершено",
  rejected: "Отклонено",
};

export type LeasingFilterKey = "all" | LeasingStatus;

export const LEASING_FILTERS: {
  key: LeasingFilterKey;
  label: string;
  tone: "blue" | "orange" | "purple" | "green" | "red";
}[] = [
  { key: "all", label: "Все заявки", tone: "blue" },
  { key: "in_work", label: "В работе", tone: "orange" },
  { key: "waiting_originals", label: "Ожидание оригиналов", tone: "purple" },
  { key: "completed", label: "Завершено", tone: "green" },
  { key: "rejected", label: "Отклонено", tone: "red" },
];

export function isLeasingStatus(value: string): value is LeasingStatus {
  return (
    value === "in_work" ||
    value === "waiting_originals" ||
    value === "completed" ||
    value === "rejected"
  );
}

export function normalizeLeasingStatus(value: string | undefined): LeasingStatus {
  if (value && isLeasingStatus(value)) {
    return value;
  }
  if (value === "pending" || value === "accepted") {
    return "in_work";
  }
  if (value === "approved") {
    return "waiting_originals";
  }
  if (value === "active") {
    return "completed";
  }
  if (value === "blocked") {
    return "rejected";
  }
  return "in_work";
}

export function leasingStatusRank(status: LeasingStatus): number {
  const order: LeasingStatus[] = ["in_work", "waiting_originals", "completed", "rejected"];
  const index = order.indexOf(status);
  return index < 0 ? 99 : index;
}

export function matchesLeasingFilter(status: LeasingStatus, filter: LeasingFilterKey): boolean {
  if (filter === "all") {
    return true;
  }
  return status === filter;
}

export function countLeasingFilter<T extends { status: LeasingStatus }>(
  items: T[],
  filter: LeasingFilterKey,
): number {
  return items.filter((item) => matchesLeasingFilter(item.status, filter)).length;
}
