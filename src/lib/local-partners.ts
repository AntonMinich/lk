import { findAdmin, isAdminLogin } from "../../shared/admin.ts";
import { createdHistoryEvent, ensureHistory, type HistoryEvent } from "../../shared/history.ts";
import { applyManagerChange, applyStatusChange } from "../../shared/workflow.ts";
import { addNotification } from "./notifications";
import { sanitizePartnerDocuments, type PartnerDocument } from "./partner-docs";
import { loginBlockedMessage, normalizeStatus, STATUS_LABEL, type ApplicationStatus } from "./status";

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  unp: string;
  email: string;
  documents: PartnerDocument[];
  createdAt: string;
  status: ApplicationStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
};

type StoredPartner = PublicPartner & { password: string };

const PARTNERS_KEY = "lk-local-partners";
const SESSION_KEY = "lk-local-session";
const ADMIN_KEY = "lk-admin-session";

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  localStorage.setItem(key, value);
  sessionStorage.removeItem(key);
}

function storageRemove(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export { ADMIN_ACCOUNTS, adminLogins, ADMIN_DEMO } from "../../shared/admin.ts";

function workflowOf(partner: StoredPartner) {
  return {
    status: partner.status,
    responsibleManager: partner.responsibleManager,
    activatedBy: partner.activatedBy,
    activatedAt: partner.activatedAt,
    history: partner.history,
  };
}

function readAll(): StoredPartner[] {
  try {
    const raw = localStorage.getItem(PARTNERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredPartner[]) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => ({
      ...item,
      unp: item.unp ?? "",
      email: item.email ?? "",
      documents: Array.isArray(item.documents) ? item.documents : [],
      status: normalizeStatus(item.status),
      responsibleManager: item.responsibleManager || item.activatedBy || "",
      activatedBy: item.activatedBy ?? "",
      activatedAt: item.activatedAt ?? "",
      history: ensureHistory(item.history, item.createdAt),
    }));
  } catch {
    return [];
  }
}

function writeAll(partners: StoredPartner[]) {
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
}

function toPublic(partner: StoredPartner): PublicPartner {
  return {
    id: partner.id,
    phone: partner.phone,
    companyName: partner.companyName,
    contactName: partner.contactName,
    unp: partner.unp ?? "",
    email: partner.email ?? "",
    documents: partner.documents ?? [],
    createdAt: partner.createdAt,
    status: normalizeStatus(partner.status),
    responsibleManager: partner.responsibleManager || partner.activatedBy || "",
    activatedBy: partner.activatedBy ?? "",
    activatedAt: partner.activatedAt ?? "",
    history: ensureHistory(partner.history, partner.createdAt),
  };
}

export function listLocalPartners(): PublicPartner[] {
  return readAll().map(toPublic);
}

export function getLocalPartner(id: string): PublicPartner | null {
  const found = readAll().find((item) => item.id === id);
  return found ? toPublic(found) : null;
}

export function registerLocalPartner(input: {
  phone: string;
  password: string;
  companyName: string;
  contactName: string;
  unp?: string;
  email?: string;
  documents?: PartnerDocument[];
}): { ok: true; partner: PublicPartner } | { ok: false; message: string } {
  const partners = readAll();
  if (partners.some((item) => item.phone === input.phone)) {
    return { ok: false, message: "Партнёр с таким номером уже зарегистрирован" };
  }
  if (input.unp && partners.some((item) => item.unp === input.unp)) {
    return { ok: false, message: "Партнёр с таким УНП уже зарегистрирован" };
  }
  const createdAt = new Date().toISOString();
  const partner: StoredPartner = {
    id: crypto.randomUUID(),
    phone: input.phone,
    password: input.password,
    companyName: input.companyName,
    contactName: input.contactName,
    unp: input.unp ?? "",
    email: input.email ?? "",
    documents: sanitizePartnerDocuments(input.documents),
    createdAt,
    status: "pending",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent(createdAt)],
  };
  writeAll([...partners, partner]);
  addNotification({
    audience: "admin",
    title: "Новая заявка на регистрацию",
    text: `${partner.companyName} — ${partner.contactName}`,
    href: `/admin/partners/${partner.id}`,
  });
  return { ok: true, partner: toPublic(partner) };
}

export function loginLocalPartner(
  phone: string,
  password: string,
): { ok: true; partner: PublicPartner } | { ok: false; message: string } {
  const found = readAll().find((item) => item.phone === phone);
  if (!found) {
    return { ok: false, message: "Партнёр с таким номером не зарегистрирован" };
  }
  if (found.password !== password) {
    return { ok: false, message: "Неверный пароль" };
  }
  const blocked = loginBlockedMessage(found.status);
  if (blocked) {
    return { ok: false, message: blocked };
  }
  const partner = toPublic(activateCabinetIfApproved(found));
  writeLocalSession(partner);
  return { ok: true, partner };
}

function activateCabinetIfApproved(partner: StoredPartner): StoredPartner {
  if (normalizeStatus(partner.status) !== "approved") {
    return partner;
  }
  const next: StoredPartner = {
    ...partner,
    ...applyStatusChange(workflowOf(partner), "active", "Партнёр"),
  };
  const partners = readAll();
  const index = partners.findIndex((item) => item.id === partner.id);
  if (index >= 0) {
    partners[index] = next;
    writeAll(partners);
  }
  return next;
}

export function setLocalPartnerStatus(
  id: string,
  status: ApplicationStatus,
  manager = "",
): PublicPartner | null {
  const partners = readAll();
  const index = partners.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }
  const current = partners[index];
  if (!current) {
    return null;
  }
  const next: StoredPartner = { ...current, ...applyStatusChange(workflowOf(current), status, manager) };
  partners[index] = next;
  writeAll(partners);
  addNotification({
    audience: "partner",
    partnerId: next.id,
    title: "Заявка на регистрацию",
    text: `Статус: ${STATUS_LABEL[next.status]}`,
    href: "/cabinet/applications",
  });
  return toPublic(next);
}

export function setLocalPartnerManager(
  id: string,
  manager: string,
  actor = "",
): { ok: true; partner: PublicPartner } | { ok: false; message: string } {
  if (!isAdminLogin(manager)) {
    return { ok: false, message: "Выберите менеджера из списка" };
  }
  const partners = readAll();
  const index = partners.findIndex((item) => item.id === id);
  if (index < 0) {
    return { ok: false, message: "Заявка не найдена" };
  }
  const current = partners[index];
  if (!current) {
    return { ok: false, message: "Заявка не найдена" };
  }
  const result = applyManagerChange(workflowOf(current), manager, actor);
  if (!result.ok) {
    return result;
  }
  const next: StoredPartner = { ...current, ...result.state };
  partners[index] = next;
  writeAll(partners);
  if (next.responsibleManager !== current.responsibleManager) {
    addNotification({
      audience: "partner",
      partnerId: next.id,
      title: "Назначен менеджер",
      text: `Ответственный: ${next.responsibleManager}`,
      href: "/cabinet/applications",
    });
  }
  return { ok: true, partner: toPublic(next) };
}

export function writeLocalSession(partner: PublicPartner) {
  storageSet(SESSION_KEY, JSON.stringify(toPublic({ ...partner, password: "" })));
}

export function readLocalSession(): PublicPartner | null {
  try {
    const raw = storageGet(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PublicPartner;
    const stored = readAll().find((item) => item.id === parsed.id);
    const partner = toPublic(stored ? activateCabinetIfApproved(stored) : { ...parsed, password: "" });
    if (loginBlockedMessage(partner.status)) {
      storageRemove(SESSION_KEY);
      return null;
    }
    if (stored && partner.status === "active" && parsed.status !== "active") {
      writeLocalSession(partner);
    }
    return partner;
  } catch {
    return null;
  }
}

export function clearLocalSession() {
  storageRemove(SESSION_KEY);
}

export function loginLocalAdmin(
  login: string,
  password: string,
): { ok: true; login: string } | { ok: false; message: string } {
  const found = findAdmin(login, password);
  if (!found) {
    return { ok: false, message: "Неверный логин или пароль администратора" };
  }
  writeLocalAdmin(found.login);
  return { ok: true, login: found.login };
}

export function writeLocalAdmin(login: string) {
  storageSet(ADMIN_KEY, login);
}

export function localAdminName(): string | null {
  return storageGet(ADMIN_KEY);
}

export function isLocalAdmin(): boolean {
  return Boolean(localAdminName());
}

export function clearLocalAdmin() {
  storageRemove(ADMIN_KEY);
}
