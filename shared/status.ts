export type ApplicationStatus = "pending" | "accepted" | "approved" | "rejected" | "blocked";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  accepted: "В работе",
  approved: "Активен",
  rejected: "Отклонена",
  blocked: "Заблокирован",
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (
    value === "approved" ||
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
  const order: ApplicationStatus[] = ["pending", "accepted", "approved", "blocked", "rejected"];
  const index = order.indexOf(status);
  return index < 0 ? 99 : index;
}

export function loginBlockedMessage(status: ApplicationStatus): string | null {
  if (status === "approved") {
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
