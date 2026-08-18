export type LeasingPipeline = "application" | "deal";

export type LeasingStatus =
  | "draft"
  | "new"
  | "in_work"
  | "questionnaire"
  | "document_prep"
  | "signing"
  | "waiting_originals"
  | "completed"
  | "cancelled";

export const LEASING_STATUS_LABEL: Record<LeasingStatus, string> = {
  draft: "Черновик",
  new: "Новая",
  in_work: "В работе",
  questionnaire: "Анкетные данные",
  document_prep: "Подготовка документов",
  signing: "Подписание документов",
  waiting_originals: "Ожидание оригиналов",
  completed: "Завершено",
  cancelled: "Отменено",
};

export const APPLICATION_LEASING_STATUSES: LeasingStatus[] = [
  "draft",
  "new",
  "in_work",
  "questionnaire",
];

export const DEAL_LEASING_STATUSES: LeasingStatus[] = [
  "document_prep",
  "signing",
  "waiting_originals",
  "completed",
];

export type LeasingFilterKey = "all" | LeasingStatus;

export const LEASING_APPLICATION_FILTERS: {
  key: LeasingFilterKey;
  label: string;
  tone: "blue" | "orange" | "purple" | "green" | "red" | "slate";
}[] = [
  { key: "all", label: "Все заявки", tone: "blue" },
  { key: "draft", label: "Черновик", tone: "slate" },
  { key: "new", label: "Новая", tone: "orange" },
  { key: "in_work", label: "В работе", tone: "purple" },
  { key: "questionnaire", label: "Анкетные данные", tone: "green" },
  { key: "cancelled", label: "Отменено", tone: "red" },
];

export const LEASING_DEAL_FILTERS: {
  key: LeasingFilterKey;
  label: string;
  tone: "blue" | "orange" | "purple" | "green" | "red" | "slate";
}[] = [
  { key: "all", label: "Все сделки", tone: "blue" },
  { key: "document_prep", label: "Подготовка документов", tone: "orange" },
  { key: "signing", label: "Подписание документов", tone: "purple" },
  { key: "waiting_originals", label: "Ожидание оригиналов", tone: "slate" },
  { key: "completed", label: "Завершено", tone: "green" },
  { key: "cancelled", label: "Отменено", tone: "red" },
];

export function isLeasingStatus(value: string): value is LeasingStatus {
  return value in LEASING_STATUS_LABEL;
}

export function isDealLeasingStatus(status: LeasingStatus): boolean {
  return DEAL_LEASING_STATUSES.includes(status);
}

export function normalizeLeasingStatus(value: string | undefined): LeasingStatus {
  if (value && isLeasingStatus(value)) {
    return value;
  }
  if (value === "pending") {
    return "new";
  }
  if (value === "accepted") {
    return "in_work";
  }
  if (value === "approved") {
    return "questionnaire";
  }
  if (value === "active") {
    return "completed";
  }
  if (value === "rejected" || value === "blocked") {
    return "cancelled";
  }
  return "new";
}

export function normalizeLeasingPipeline(
  status: LeasingStatus,
  pipeline?: string,
): LeasingPipeline {
  if (status === "cancelled") {
    return pipeline === "deal" ? "deal" : "application";
  }
  return isDealLeasingStatus(status) ? "deal" : "application";
}

export function pipelineAfterStatusChange(
  status: LeasingStatus,
  current: LeasingPipeline,
): LeasingPipeline {
  if (status === "cancelled") {
    return current;
  }
  return isDealLeasingStatus(status) ? "deal" : "application";
}

export function leasingStatusRank(status: LeasingStatus): number {
  const order: LeasingStatus[] = [
    "draft",
    "new",
    "in_work",
    "questionnaire",
    "document_prep",
    "signing",
    "waiting_originals",
    "completed",
    "cancelled",
  ];
  const index = order.indexOf(status);
  return index < 0 ? 99 : index;
}

export function matchesLeasingFilter(status: LeasingStatus, filter: LeasingFilterKey): boolean {
  if (filter === "all") {
    return true;
  }
  return status === filter;
}

export function leasingAdminPath(id: string, pipeline: LeasingPipeline): string {
  return pipeline === "deal" ? `/admin/deals/${id}` : `/admin/leasing/${id}`;
}

export function leasingCabinetPath(id: string, pipeline: LeasingPipeline): string {
  return pipeline === "deal" ? `/cabinet/deals/${id}` : `/cabinet/applications/${id}`;
}
