import { ADMIN_DEMO } from "../../shared/admin.ts";
import { loginBlockedMessage, normalizeStatus, type ApplicationStatus } from "./status";

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  createdAt: string;
  status: ApplicationStatus;
  activatedBy: string;
  activatedAt: string;
};

type StoredPartner = PublicPartner & { password: string };

const PARTNERS_KEY = "lk-local-partners";
const SESSION_KEY = "lk-local-session";
const ADMIN_KEY = "lk-admin-session";

export { ADMIN_DEMO };

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
      activatedBy: item.activatedBy ?? "",
      activatedAt: item.activatedAt ?? "",
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
    activatedBy: partner.activatedBy ?? "",
    activatedAt: partner.activatedAt ?? "",
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
  const partner: StoredPartner = {
    id: crypto.randomUUID(),
    phone: input.phone,
    password: input.password,
    companyName: input.companyName,
    contactName: input.contactName,
    createdAt: new Date().toISOString(),
    status: "pending",
    activatedBy: "",
    activatedAt: "",
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
  const next: StoredPartner = { ...current, status };
  if (status === "approved") {
    next.activatedBy = manager || current.activatedBy || "";
    next.activatedAt = new Date().toISOString();
  }
  partners[index] = next;
  writeAll(partners);
  return toPublic(next);
}

export function readLocalSession(): PublicPartner | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PublicPartner;
    const partner = {
      ...parsed,
      status: normalizeStatus(parsed.status),
      activatedBy: parsed.activatedBy ?? "",
      activatedAt: parsed.activatedAt ?? "",
    };
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
  const name = login.trim();
  if (name !== ADMIN_DEMO.login || password !== ADMIN_DEMO.password) {
    return { ok: false, message: "Неверный логин или пароль администратора" };
  }
  sessionStorage.setItem(ADMIN_KEY, name);
  return { ok: true, login: name };
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
