export type ApplicationStatus = "pending" | "accepted" | "approved" | "active" | "rejected" | "blocked";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Новые",
  accepted: "На проверке",
  approved: "Одобрено",
  active: "Активен",
  rejected: "Отклонено",
  blocked: "Заблокирован",
};

export type ApplicationFilterKey = "all" | "pending" | "accepted" | "approved" | "rejected";

export const APPLICATION_FILTERS: {
  key: ApplicationFilterKey;
  label: string;
  tone: "blue" | "orange" | "purple" | "green" | "red";
}[] = [
  { key: "all", label: "Все заявки", tone: "blue" },
  { key: "pending", label: "Новые", tone: "orange" },
  { key: "accepted", label: "На проверке", tone: "purple" },
  { key: "approved", label: "Одобрено", tone: "green" },
  { key: "rejected", label: "Отклонено", tone: "red" },
];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (
    value === "approved" ||
    value === "active" ||
    value === "rejected" ||
    value === "pending" ||
    value === "blocked" ||
    value === "accepted"
  );
}

export function normalizeStatus(value: string | undefined): ApplicationStatus {
  if (value && isApplicationStatus(value)) {
    return value;
  }
  return "pending";
}

export function statusRank(status: ApplicationStatus): number {
  const order: ApplicationStatus[] = ["pending", "accepted", "approved", "active", "blocked", "rejected"];
  const index = order.indexOf(status);
  return index < 0 ? 99 : index;
}

export function loginBlockedMessage(status: ApplicationStatus): string | null {
  if (status === "approved" || status === "active") {
    return null;
  }
  if (status === "rejected") {
    return "Заявка отклонена. Свяжитесь с fincode.";
  }
  if (status === "blocked") {
    return "Доступ заблокирован.";
  }
  return "Заявка ещё не одобрена. Дождитесь решения в админке.";
}

export function isRegistrationQueue(status: ApplicationStatus): boolean {
  return status === "pending" || status === "accepted" || status === "approved" || status === "rejected";
}

export function isDirectoryPartner(status: ApplicationStatus): boolean {
  return status === "active" || status === "blocked";
}

export type DirectoryFilterKey = "all" | "active" | "blocked";

export const DIRECTORY_FILTERS: {
  key: DirectoryFilterKey;
  label: string;
  tone: "blue" | "green" | "red";
}[] = [
  { key: "all", label: "Все пользователи", tone: "blue" },
  { key: "active", label: "Активные", tone: "green" },
  { key: "blocked", label: "Заблокированные", tone: "red" },
];

export function matchesDirectoryFilter(status: ApplicationStatus, filter: DirectoryFilterKey): boolean {
  if (filter === "all") {
    return isDirectoryPartner(status);
  }
  return status === filter;
}

export function matchesApplicationFilter(status: ApplicationStatus, filter: ApplicationFilterKey): boolean {
  if (filter === "all") {
    return true;
  }
  return status === filter;
}

export function countApplicationFilter<T extends { status: ApplicationStatus }>(
  items: T[],
  filter: ApplicationFilterKey,
): number {
  return items.filter((item) => matchesApplicationFilter(item.status, filter)).length;
}
