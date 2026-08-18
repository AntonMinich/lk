export type ApplicationStatus = "pending" | "approved" | "rejected";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return value === "approved" || value === "rejected" || value === "pending";
}

export function normalizeStatus(value: string | undefined): ApplicationStatus {
  if (value && isApplicationStatus(value)) {
    return value;
  }
  return "pending";
}

export function loginBlockedMessage(status: ApplicationStatus): string | null {
  if (status === "approved") {
    return null;
  }
  if (status === "rejected") {
    return "Заявка отклонена. Свяжитесь с fincode.";
  }
  return "Заявка ещё не одобрена. Дождитесь решения в админке.";
}
