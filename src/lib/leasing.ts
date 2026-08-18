import { fillApplicationSeq, applicationSeqChanged, nextApplicationSeq } from "../../shared/application-no.ts";
import { isAdminLogin } from "../../shared/admin.ts";
import { createHistoryEvent, createdHistoryEvent, ensureHistory, type HistoryEvent } from "../../shared/history.ts";
import { addNotification } from "./notifications";
import { formatAmountByn } from "./money";
import {
  LEASING_STATUS_LABEL,
  normalizeLeasingStatus,
  type LeasingStatus,
} from "./leasing-status";

export type LeasingApplication = {
  id: string;
  seq: number;
  partnerId: string;
  companyName: string;
  contactName: string;
  phone: string;
  asset: string;
  amount: string;
  termMonths: string;
  createdAt: string;
  status: LeasingStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
  demo?: boolean;
};

const LEASING_KEY = "lk-local-leasing";

const SEED: LeasingApplication[] = [
  {
    id: "lease-demo-1",
    seq: 1,
    partnerId: "",
    companyName: "ООО «Альфа Транс»",
    contactName: "Иван Петров",
    phone: "+375447574025",
    asset: "Тягач MAN TGX",
    amount: "180 000 BYN",
    termMonths: "36",
    createdAt: "2026-08-12T09:20:00.000Z",
    status: "in_work",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-12T09:20:00.000Z")],
  },
  {
    id: "lease-demo-2",
    seq: 2,
    partnerId: "",
    companyName: "ЧТУП «БелСтрой»",
    contactName: "Ольга Сидорова",
    phone: "+375339001122",
    asset: "Экскаватор JCB JS220",
    amount: "95 000 BYN",
    termMonths: "24",
    createdAt: "2026-08-15T14:05:00.000Z",
    status: "waiting_originals",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-15T14:05:00.000Z")],
  },
];

type PartnerDemoRow = {
  seq: number;
  contactName: string;
  asset: string;
  amount: number;
  termMonths: string;
  createdAt: string;
  status: LeasingStatus;
};

const PARTNER_DEMO: PartnerDemoRow[] = [
  {
    seq: 44,
    contactName: "Волкова Наталья Алексеевна",
    asset: "Легковой автомобиль Skoda Octavia",
    amount: 48488,
    termMonths: "36",
    createdAt: "2026-08-16T10:12:00.000Z",
    status: "in_work",
  },
  {
    seq: 49,
    contactName: "Голубев Егор Сергеевич",
    asset: "Фургон Mercedes-Benz Sprinter",
    amount: 41186,
    termMonths: "24",
    createdAt: "2026-08-15T09:40:00.000Z",
    status: "completed",
  },
  {
    seq: 50,
    contactName: "Тарасова Дарья Николаевна",
    asset: "Кроссовер Kia Sportage",
    amount: 50776,
    termMonths: "36",
    createdAt: "2026-08-13T11:05:00.000Z",
    status: "waiting_originals",
  },
  {
    seq: 45,
    contactName: "Козлов Андрей Петрович",
    asset: "Пикап Volkswagen Amarok",
    amount: 38488,
    termMonths: "24",
    createdAt: "2026-08-08T13:20:00.000Z",
    status: "completed",
  },
  {
    seq: 46,
    contactName: "Новикова Мария Игоревна",
    asset: "Легковой автомобиль Toyota Camry",
    amount: 42000,
    termMonths: "36",
    createdAt: "2026-07-21T08:15:00.000Z",
    status: "completed",
  },
  {
    seq: 47,
    contactName: "Смирнов Павел Дмитриевич",
    asset: "Микроавтобус Ford Transit",
    amount: 38500,
    termMonths: "24",
    createdAt: "2026-06-18T15:45:00.000Z",
    status: "completed",
  },
  {
    seq: 48,
    contactName: "Морозова Анна Викторовна",
    asset: "Легковой автомобиль Hyundai Solaris",
    amount: 35000,
    termMonths: "36",
    createdAt: "2026-05-27T12:30:00.000Z",
    status: "completed",
  },
  {
    seq: 51,
    contactName: "Кузнецов Иван Сергеевич",
    asset: "Грузовик MAZ 4371",
    amount: 36837,
    termMonths: "48",
    createdAt: "2026-05-12T09:00:00.000Z",
    status: "completed",
  },
  {
    seq: 52,
    contactName: "Лебедева Ольга Александровна",
    asset: "Легковой автомобиль Volkswagen Polo",
    amount: 29500,
    termMonths: "24",
    createdAt: "2026-07-03T16:10:00.000Z",
    status: "in_work",
  },
];

function normalize(item: LeasingApplication): LeasingApplication {
  return {
    ...item,
    seq: Number(item.seq) > 0 ? Number(item.seq) : 0,
    partnerId: item.partnerId ?? "",
    status: normalizeLeasingStatus(item.status),
    responsibleManager: item.responsibleManager || item.activatedBy || "",
    activatedBy: item.activatedBy ?? "",
    activatedAt: item.activatedAt ?? "",
    history: ensureHistory(item.history, item.createdAt),
    demo: Boolean(item.demo),
  };
}

function persist(items: LeasingApplication[]) {
  const numbered = fillApplicationSeq(items.map(normalize));
  localStorage.setItem(LEASING_KEY, JSON.stringify(numbered));
  return numbered;
}

function readAll(): LeasingApplication[] {
  try {
    const raw = localStorage.getItem(LEASING_KEY);
    if (!raw) {
      return persist(SEED.map(normalize));
    }
    const parsed = JSON.parse(raw) as LeasingApplication[];
    if (!Array.isArray(parsed)) {
      return persist(SEED.map(normalize));
    }
    const mapped = parsed.map(normalize);
    if (applicationSeqChanged(mapped, fillApplicationSeq(mapped))) {
      return persist(mapped);
    }
    return fillApplicationSeq(mapped);
  } catch {
    return persist(SEED.map(normalize));
  }
}

function writeAll(items: LeasingApplication[]) {
  persist(items);
}

function buildPartnerDemo(partnerId: string, companyName: string, phone: string): LeasingApplication[] {
  const existing = readAll();
  const taken = new Set(existing.map((item) => item.seq));
  let nextSeq = Math.max(nextApplicationSeq(existing), 44);
  return PARTNER_DEMO.map((row) => {
    let seq = row.seq;
    if (taken.has(seq)) {
      seq = nextSeq;
      nextSeq += 1;
    }
    taken.add(seq);
    return {
      id: `lease-demo-${partnerId}-${row.seq}`,
      seq,
      partnerId,
      companyName,
      contactName: row.contactName,
      phone,
      asset: row.asset,
      amount: formatAmountByn(row.amount),
      termMonths: row.termMonths,
      createdAt: row.createdAt,
      status: row.status,
      responsibleManager: "",
      activatedBy: "",
      activatedAt: "",
      history: [createdHistoryEvent(row.createdAt)],
      demo: true,
    };
  });
}

export function leasingForPartnerCard(
  partnerId: string,
  companyName = "",
  phone = "",
): LeasingApplication[] {
  if (!partnerId) {
    return [];
  }
  const real = readAll().filter((item) => item.partnerId === partnerId);
  if (real.length > 0) {
    return real;
  }
  return buildPartnerDemo(partnerId, companyName, phone);
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
  const items = readAll();
  const createdAt = new Date().toISOString();
  const application: LeasingApplication = {
    id: crypto.randomUUID(),
    seq: nextApplicationSeq(items),
    partnerId: input.partnerId,
    companyName: input.companyName,
    contactName: input.contactName,
    phone: input.phone,
    asset: input.asset,
    amount: input.amount,
    termMonths: input.termMonths,
    createdAt,
    status: "in_work",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent(createdAt)],
  };
  writeAll([...items, application]);
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
  status: LeasingStatus,
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
  const next: LeasingApplication = {
    ...current,
    status,
    history: [
      ...current.history,
      createHistoryEvent({
        actor: manager,
        text: `Статус: ${LEASING_STATUS_LABEL[current.status]} → ${LEASING_STATUS_LABEL[status]}`,
      }),
    ],
  };
  items[index] = next;
  writeAll(items);
  if (next.partnerId) {
    addNotification({
      audience: "partner",
      partnerId: next.partnerId,
      title: "Заявка на лизинг",
      text: `${next.asset || "Заявка"}: ${LEASING_STATUS_LABEL[next.status]}`,
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
  if (manager === current.responsibleManager) {
    return { ok: true, application: current };
  }
  const text = current.responsibleManager
    ? `Ответственный менеджер: ${current.responsibleManager} → ${manager}`
    : `${actor || "Менеджер"} назначил ответственного: ${manager}`;
  const next: LeasingApplication = {
    ...current,
    responsibleManager: manager,
    history: [...current.history, createHistoryEvent({ actor, text })],
  };
  items[index] = next;
  writeAll(items);
  if (next.partnerId) {
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
