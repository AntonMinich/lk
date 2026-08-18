import { normalizeStatus, type ApplicationStatus } from "../../shared/status.ts";

export type LeasingApplication = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  asset: string;
  amount: string;
  termMonths: string;
  createdAt: string;
  status: ApplicationStatus;
  activatedBy: string;
  activatedAt: string;
};

const LEASING_KEY = "lk-local-leasing";

const SEED: LeasingApplication[] = [
  {
    id: "lease-demo-1",
    companyName: "ООО «Альфа Транс»",
    contactName: "Иван Петров",
    phone: "+375447574025",
    asset: "Тягач MAN TGX",
    amount: "180 000 BYN",
    termMonths: "36",
    createdAt: "2026-08-12T09:20:00.000Z",
    status: "pending",
    activatedBy: "",
    activatedAt: "",
  },
  {
    id: "lease-demo-2",
    companyName: "ЧТУП «БелСтрой»",
    contactName: "Ольга Сидорова",
    phone: "+375339001122",
    asset: "Экскаватор JCB JS220",
    amount: "95 000 BYN",
    termMonths: "24",
    createdAt: "2026-08-15T14:05:00.000Z",
    status: "pending",
    activatedBy: "",
    activatedAt: "",
  },
];

function normalize(item: LeasingApplication): LeasingApplication {
  return {
    ...item,
    status: normalizeStatus(item.status),
    activatedBy: item.activatedBy ?? "",
    activatedAt: item.activatedAt ?? "",
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

export function getLocalLeasing(id: string): LeasingApplication | null {
  return readAll().find((item) => item.id === id) ?? null;
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
  const next: LeasingApplication = { ...current, status };
  if (status === "approved") {
    next.activatedBy = manager || current.activatedBy || "";
    next.activatedAt = new Date().toISOString();
  }
  items[index] = next;
  writeAll(items);
  return next;
}
