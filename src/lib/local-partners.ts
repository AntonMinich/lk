import { findAdmin, isAdminLogin } from "../../shared/admin.ts";
import { createdHistoryEvent, ensureHistory, type HistoryEvent } from "../../shared/history.ts";
import { loginBlockedMessage, normalizeStatus, type ApplicationStatus } from "./status";
import { applyManagerChange, applyStatusChange } from "../../shared/workflow.ts";

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
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
}): { ok: true; partner: PublicPartner } | { ok: false; message: string } {
  const partners = readAll();
  if (partners.some((item) => item.phone === input.phone)) {
    return { ok: false, message: "Партнёр с таким номером уже зарегистрирован" };
  }
  const createdAt = new Date().toISOString();
  const partner: StoredPartner = {
    id: crypto.randomUUID(),
    phone: input.phone,
    password: input.password,
    companyName: input.companyName,
    contactName: input.contactName,
    createdAt,
    status: "pending",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent(createdAt)],
  };
  writeAll([...partners, partner]);
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
  const partner = toPublic(found);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(partner));
  return { ok: true, partner };
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
  return { ok: true, partner: toPublic(next) };
}

export function readLocalSession(): PublicPartner | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PublicPartner;
    const partner = toPublic({ ...parsed, password: "" });
    if (loginBlockedMessage(partner.status)) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return partner;
  } catch {
    return null;
  }
}

export function clearLocalSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function loginLocalAdmin(
  login: string,
  password: string,
): { ok: true; login: string } | { ok: false; message: string } {
  const found = findAdmin(login, password);
  if (!found) {
    return { ok: false, message: "Неверный логин или пароль администратора" };
  }
  sessionStorage.setItem(ADMIN_KEY, found.login);
  return { ok: true, login: found.login };
}

export function localAdminName(): string | null {
  return sessionStorage.getItem(ADMIN_KEY);
}

export function isLocalAdmin(): boolean {
  return Boolean(localAdminName());
}

export function clearLocalAdmin() {
  sessionStorage.removeItem(ADMIN_KEY);
}
