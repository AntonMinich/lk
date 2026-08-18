export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  createdAt: string;
};

type StoredPartner = PublicPartner & { password: string };

const PARTNERS_KEY = "lk-local-partners";
const SESSION_KEY = "lk-local-session";

function readAll(): StoredPartner[] {
  try {
    const raw = localStorage.getItem(PARTNERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredPartner[]) : [];
    return Array.isArray(parsed) ? parsed : [];
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
  const partner = toPublic(found);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(partner));
  return { ok: true, partner };
}

export function readLocalSession(): PublicPartner | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PublicPartner) : null;
  } catch {
    return null;
  }
}

export function clearLocalSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
