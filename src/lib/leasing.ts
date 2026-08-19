import { fillApplicationSeq, applicationSeqChanged, nextApplicationSeq } from "../../shared/application-no.ts";
import { isAdminLogin } from "../../shared/admin.ts";
import { createHistoryEvent, createdHistoryEvent, ensureHistory, type HistoryEvent } from "../../shared/history.ts";
import { addNotification } from "./notifications";
import { formatAmountByn } from "./money";
import {
  LEASING_STATUS_LABEL,
  leasingAdminPath,
  leasingCabinetPath,
  normalizeLeasingPipeline,
  normalizeLeasingStatus,
  pipelineAfterStatusChange,
  type LeasingPipeline,
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
  pipeline: LeasingPipeline;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
  demo?: boolean;
};

const LEASING_KEY = "lk-local-leasing";

const SEED: LeasingApplication[] = [
  {
    id: "lease-demo-draft",
    seq: 1,
    partnerId: "",
    companyName: "ООО «Альфа Транс»",
    contactName: "Иван Петров",
    phone: "+375447574025",
    asset: "Тягач MAN TGX",
    amount: "180 000 BYN",
    termMonths: "36",
    createdAt: "2026-08-12T09:20:00.000Z",
    status: "draft",
    pipeline: "application",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-12T09:20:00.000Z")],
  },
  {
    id: "lease-demo-new",
    seq: 2,
    partnerId: "",
    companyName: "ЧТУП «БелСтрой»",
    contactName: "Ольга Сидорова",
    phone: "+375339001122",
    asset: "Экскаватор JCB JS220",
    amount: "95 000 BYN",
    termMonths: "24",
    createdAt: "2026-08-15T14:05:00.000Z",
    status: "new",
    pipeline: "application",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-15T14:05:00.000Z")],
  },
  {
    id: "lease-demo-work",
    seq: 3,
    partnerId: "",
    companyName: "ООО «ТехЛизинг»",
    contactName: "Сергей Ковалёв",
    phone: "+375447111223",
    asset: "Погрузчик Toyota 8FD30",
    amount: "64 500 BYN",
    termMonths: "36",
    createdAt: "2026-08-14T11:10:00.000Z",
    status: "in_work",
    pipeline: "application",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-14T11:10:00.000Z")],
  },
  {
    id: "lease-demo-quest",
    seq: 4,
    partnerId: "",
    companyName: "ИП «Неман Авто»",
    contactName: "Анна Кравченко",
    phone: "+375339887766",
    asset: "Легковой автомобиль Kia K5",
    amount: "52 300 BYN",
    termMonths: "36",
    createdAt: "2026-08-11T08:40:00.000Z",
    status: "questionnaire",
    pipeline: "application",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-11T08:40:00.000Z")],
  },
  {
    id: "lease-demo-prep",
    seq: 5,
    partnerId: "",
    companyName: "ООО «Гродно Логистик»",
    contactName: "Павел Жук",
    phone: "+375447000111",
    asset: "Фургон Ford Transit",
    amount: "71 200 BYN",
    termMonths: "24",
    createdAt: "2026-08-10T16:00:00.000Z",
    status: "document_prep",
    pipeline: "deal",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-10T16:00:00.000Z")],
  },
  {
    id: "lease-demo-sign",
    seq: 6,
    partnerId: "",
    companyName: "ЧТУП «БрестТранс»",
    contactName: "Елена Савчук",
    phone: "+375339221144",
    asset: "Тягач Volvo FH",
    amount: "210 000 BYN",
    termMonths: "48",
    createdAt: "2026-08-09T12:25:00.000Z",
    status: "signing",
    pipeline: "deal",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-09T12:25:00.000Z")],
  },
  {
    id: "lease-demo-originals",
    seq: 7,
    partnerId: "",
    companyName: "ООО «Минск Флит»",
    contactName: "Дмитрий Орлов",
    phone: "+375447555666",
    asset: "Автобус МАЗ 206",
    amount: "145 000 BYN",
    termMonths: "48",
    createdAt: "2026-08-08T09:15:00.000Z",
    status: "waiting_originals",
    pipeline: "deal",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-08T09:15:00.000Z")],
  },
  {
    id: "lease-demo-done",
    seq: 8,
    partnerId: "",
    companyName: "ООО «Витебск Агро»",
    contactName: "Мария Лебедь",
    phone: "+375339010203",
    asset: "Трактор Belarus 82.1",
    amount: "88 400 BYN",
    termMonths: "36",
    createdAt: "2026-08-05T14:50:00.000Z",
    status: "completed",
    pipeline: "deal",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-05T14:50:00.000Z")],
  },
  {
    id: "lease-demo-cancel",
    seq: 9,
    partnerId: "",
    companyName: "ИП «Гомель Сервис»",
    contactName: "Никита Волков",
    phone: "+375447777888",
    asset: "Легковой автомобиль Skoda Rapid",
    amount: "39 900 BYN",
    termMonths: "24",
    createdAt: "2026-08-04T10:05:00.000Z",
    status: "cancelled",
    pipeline: "application",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent("2026-08-04T10:05:00.000Z")],
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
  const status = normalizeLeasingStatus(item.status);
  return {
    ...item,
    seq: Number(item.seq) > 0 ? Number(item.seq) : 0,
    partnerId: item.partnerId ?? "",
    status,
    pipeline: normalizeLeasingPipeline(status, item.pipeline),
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
      pipeline: normalizeLeasingPipeline(row.status),
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
  const existing = readAll();
  const real = existing.filter((item) => item.partnerId === partnerId);
  if (real.length > 0) {
    return real;
  }
  const demo = buildPartnerDemo(partnerId, companyName, phone);
  writeAll([...existing, ...demo]);
  return demo;
}

export function listLocalLeasing(): LeasingApplication[] {
  return readAll();
}

export function listLocalLeasingByPipeline(pipeline: LeasingPipeline): LeasingApplication[] {
  return readAll().filter((item) => item.pipeline === pipeline);
}

export function listLocalLeasingByPartner(partnerId: string): LeasingApplication[] {
  return readAll().filter((item) => item.partnerId === partnerId);
}

export function listLocalLeasingByPartnerPipeline(
  partnerId: string,
  pipeline: LeasingPipeline,
): LeasingApplication[] {
  return listLocalLeasingByPartner(partnerId).filter((item) => item.pipeline === pipeline);
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
  status?: "draft" | "new";
}): LeasingApplication {
  const items = readAll();
  const createdAt = new Date().toISOString();
  const status = input.status ?? "new";
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
    status,
    pipeline: "application",
    responsibleManager: "",
    activatedBy: "",
    activatedAt: "",
    history: [createdHistoryEvent(createdAt)],
  };
  writeAll([...items, application]);
  if (status !== "draft") {
    addNotification({
      audience: "admin",
      title: "Новая заявка на лизинг",
      text: `${application.companyName} — ${application.asset}`,
      href: leasingAdminPath(application.id, application.pipeline),
    });
  }
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
    pipeline: pipelineAfterStatusChange(status, current.pipeline),
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
      title: next.pipeline === "deal" ? "Сделка" : "Заявка на лизинг",
      text: `${next.asset || "Заявка"}: ${LEASING_STATUS_LABEL[next.status]}`,
      href: leasingCabinetPath(next.id, next.pipeline),
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
      href: leasingCabinetPath(next.id, next.pipeline),
    });
  }
  return { ok: true, application: next };
}
