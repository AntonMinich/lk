import { isAdminLogin } from "../../shared/admin.ts";
import { createdHistoryEvent, ensureHistory, type HistoryEvent } from "../../shared/history.ts";
import { normalizeStatus, STATUS_LABEL, type ApplicationStatus } from "../../shared/status.ts";
import { applyManagerChange, applyStatusChange } from "../../shared/workflow.ts";
import { addNotification } from "./notifications";

export type LeasingApplication = {
  id: string;
  partnerId: string;
  companyName: string;
  contactName: string;
  phone: string;
  asset: string;
  amount: string;
  termMonths: string;
  createdAt: string;
  status: ApplicationStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
};

const LEASING_KEY = "lk-local-leasing";

const SEED: LeasingApplication[] = [
  {
    id: "lease-demo-1",
    partnerId: "",
    companyName: "ООО «Альфа Транс»",
    contactName: "Иван Петров",
    phone: "+375447574025",
    asset: "Тягач MAN TGX",
    amount: "180 000 BYN",
    termMonths: "36",
    createdAt: "2026-08-12T09:20:00.000Z",
    status: "pending",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-12T09:20:00.000Z")],
  },
  {
    id: "lease-demo-2",
    partnerId: "",
    companyName: "ЧТУП «БелСтрой»",
    contactName: "Ольга Сидорова",
    phone: "+375339001122",
    asset: "Экскаватор JCB JS220",
    amount: "95 000 BYN",
    termMonths: "24",
    createdAt: "2026-08-15T14:05:00.000Z",
    status: "accepted",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-15T14:05:00.000Z")],
  },
];

function workflowOf(item: LeasingApplication) {
  return {
    status: item.status,
    responsibleManager: item.responsibleManager,
    activatedBy: item.activatedBy,
    activatedAt: item.activatedAt,
    history: item.history,
  };
}

function normalize(item: LeasingApplication): LeasingApplication {
  return {
    ...item,
    partnerId: item.partnerId ?? "",
    status: normalizeStatus(item.status),
    responsibleManager: item.responsibleManager || item.activatedBy || "",
    activatedBy: item.activatedBy ?? "",
    activatedAt: item.activatedAt ?? "",
    history: ensureHistory(item.history, item.createdAt),
  };
}

function readAll(): LeasingApplication[] {
  try {
    const raw = localStorage.getItem(LEASING_KEY);
    if (!raw) {
      const seeded = SEED.map(normalize);
      writeAll(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as LeasingApplication[];
    if (!Array.isArray(parsed)) {
      return SEED.map(normalize);
    }
    return parsed.map(normalize);
  } catch {
    return SEED.map(normalize);
  }
}

function writeAll(items: LeasingApplication[]) {
  localStorage.setItem(LEASING_KEY, JSON.stringify(items));
}

export function listLocalLeasing(): LeasingApplication[] {
  return readAll();
}

export function listLocalLeasingByPartner(partnerId: string): LeasingApplication[] {
  return readAll().filter((item) => item.partnerId === partnerId);
}

export function getLocalLeasing(id: string): LeasingApplication | null {
  return readAll().find((item) => item.id === id) ?? null;
}

export function createLocalLeasing(input: {
  partnerId: string;
  companyName: string;
  contactName: string;
  phone: string;
  asset: string;
  amount: string;
  termMonths: string;
}): LeasingApplication {
  const createdAt = new Date().toISOString();
  const application: LeasingApplication = {
    id: crypto.randomUUID(),
    partnerId: input.partnerId,
    companyName: input.companyName,
    contactName: input.contactName,
    phone: input.phone,
    asset: input.asset,
    amount: input.amount,
    termMonths: input.termMonths,
    createdAt,
    status: "pending",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent(createdAt)],
  };
  writeAll([...readAll(), application]);
  addNotification({
    audience: "admin",
    title: "Новая заявка на лизинг",
    text: `${application.companyName} — ${application.asset}`,
    href: `/admin/leasing/${application.id}`,
  });
  return application;
}

export function setLocalLeasingStatus(
  id: string,
  status: ApplicationStatus,
  manager = "",
): LeasingApplication | null {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }
  const current = items[index];
  if (!current) {
    return null;
  }
  const next = { ...current, ...applyStatusChange(workflowOf(current), status, manager) };
  items[index] = next;
  writeAll(items);
  if (next.partnerId) {
    addNotification({
      audience: "partner",
      partnerId: next.partnerId,
      title: "Заявка на лизинг",
      text: `${next.asset || "Заявка"}: ${STATUS_LABEL[next.status]}`,
      href: `/cabinet/applications/${next.id}`,
    });
  }
  return next;
}

export function setLocalLeasingManager(
  id: string,
  manager: string,
  actor = "",
): { ok: true; application: LeasingApplication } | { ok: false; message: string } {
  if (!isAdminLogin(manager)) {
    return { ok: false, message: "Выберите менеджера из списка" };
  }
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return { ok: false, message: "Заявка не найдена" };
  }
  const current = items[index];
  if (!current) {
    return { ok: false, message: "Заявка не найдена" };
  }
  const result = applyManagerChange(workflowOf(current), manager, actor);
  if (!result.ok) {
    return result;
  }
  const next = { ...current, ...result.state };
  items[index] = next;
  writeAll(items);
  if (next.partnerId && next.responsibleManager !== current.responsibleManager) {
    addNotification({
      audience: "partner",
      partnerId: next.partnerId,
      title: "Назначен менеджер",
      text: `${next.asset || "Заявка"}: ${next.responsibleManager}`,
      href: `/cabinet/applications/${next.id}`,
    });
  }
  return { ok: true, application: next };
}
