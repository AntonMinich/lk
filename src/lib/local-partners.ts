import { ADMIN_DEMO } from "../../shared/admin.ts";
import { loginBlockedMessage, normalizeStatus, type ApplicationStatus } from "./status";

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  createdAt: string;
  status: ApplicationStatus;
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
    return parsed.map((item) => ({ ...item, status: normalizeStatus(item.status) }));
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
  };
}

export function listLocalPartners(): PublicPartner[] {
  return readAll().map(toPublic);
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
): PublicPartner | null {
  const partners = readAll();
  const index = partners.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }
  partners[index] = { ...partners[index], status };
  writeAll(partners);
  return toPublic(partners[index]);
}

export function readLocalSession(): PublicPartner | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PublicPartner;
    const partner = { ...parsed, status: normalizeStatus(parsed.status) };
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
): { ok: true } | { ok: false; message: string } {
  if (login.trim() !== ADMIN_DEMO.login || password !== ADMIN_DEMO.password) {
    return { ok: false, message: "Неверный логин или пароль администратора" };
  }
  sessionStorage.setItem(ADMIN_KEY, "1");
  return { ok: true };
}

export function isLocalAdmin(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === "1";
}

export function clearLocalAdmin() {
  sessionStorage.removeItem(ADMIN_KEY);
}
