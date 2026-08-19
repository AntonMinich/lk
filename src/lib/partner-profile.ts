import { extractLocalDigits, toCanonicalPhone } from "./phone.ts";

export type PartnerUserStatus = "activated" | "invited" | "blocked";
export type PartnerUserFilterKey = "all" | PartnerUserStatus;
export type OutletStatus = "active" | "closed";
export type GoodsSource = "api" | "manual" | "file";

export type PartnerUser = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: PartnerUserStatus;
};

export type PointOfSale = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  status: OutletStatus;
};

export type FinancingTerms = {
  advanceMin: string;
  termRange: string;
  rateFrom: string;
  currency: string;
  maxAmount: string;
  subject: string;
  partnerFee: string;
};

export type CounterpartySettings = {
  goodsSource: GoodsSource;
  canCreateApplications: boolean;
  notifyEmail: string;
  autoSendOffers: boolean;
  integrationCode: string;
  stockSync: boolean;
  comment: string;
};

export type PartnerProfile = {
  partnerId: string;
  goodsSource: GoodsSource;
  users: PartnerUser[];
  pointsOfSale: PointOfSale[];
  financing: FinancingTerms;
  settings: CounterpartySettings;
};

export type PartnerProfileSeed = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  unp: string;
};

const PROFILE_KEY = "lk-partner-profiles";

export const GOODS_SOURCE_LABEL: Record<GoodsSource, string> = {
  api: "API",
  manual: "Вручную",
  file: "Файл",
};

export const PARTNER_USER_STATUS_LABEL: Record<PartnerUserStatus, string> = {
  activated: "Активирован",
  invited: "Приглашён",
  blocked: "Заблокирован",
};

export const PARTNER_USER_STATUS_TONE: Record<PartnerUserStatus, string> = {
  activated: "active",
  invited: "accepted",
  blocked: "blocked",
};

export const OUTLET_STATUS_LABEL: Record<OutletStatus, string> = {
  active: "Активна",
  closed: "Закрыта",
};

export const PARTNER_USER_FILTERS: { key: PartnerUserFilterKey; label: string }[] = [
  { key: "all", label: "Все статусы" },
  { key: "activated", label: "Активирован" },
  { key: "invited", label: "Приглашён" },
  { key: "blocked", label: "Заблокирован" },
];

export const PARTNER_CARD_SECTIONS = [
  { id: "partner-general", label: "Общая информация" },
  { id: "partner-users", label: "Пользователи" },
  { id: "partner-financing", label: "Условия финансирования" },
  { id: "partner-docs", label: "Документы" },
  { id: "partner-outlets", label: "Торговые точки" },
  { id: "partner-settings", label: "Настройка контрагента" },
  { id: "partner-applications", label: "Заявки" },
] as const;

export function isPartnerUserStatus(value: string): value is PartnerUserStatus {
  return value === "activated" || value === "invited" || value === "blocked";
}

export function isGoodsSource(value: string): value is GoodsSource {
  return value === "api" || value === "manual" || value === "file";
}

export function matchesPartnerUserFilter(status: PartnerUserStatus, filter: PartnerUserFilterKey): boolean {
  return filter === "all" || status === filter;
}

export function filterPartnerUsers(users: PartnerUser[], filter: PartnerUserFilterKey): PartnerUser[] {
  return users.filter((item) => matchesPartnerUserFilter(item.status, filter));
}

export function goodsSourceLabel(source: GoodsSource): string {
  return GOODS_SOURCE_LABEL[source];
}

export function shiftPartnerPhone(phone: string, delta: number): string {
  const local = extractLocalDigits(phone);
  if (local.length !== 9) {
    return phone;
  }
  const operator = local.slice(0, 2);
  const next = (Number(local.slice(2)) + delta + 10_000_000) % 10_000_000;
  return toCanonicalPhone(`${operator}${String(next).padStart(7, "0")}`);
}

export function defaultFinancingTerms(): FinancingTerms {
  return {
    advanceMin: "20%",
    termRange: "12–36 мес.",
    rateFrom: "от 0,01%",
    currency: "BYN",
    maxAmount: "150 000 BYN",
    subject: "Товары партнёра",
    partnerFee: "2%",
  };
}

export function seedPartnerProfile(partner: PartnerProfileSeed): PartnerProfile {
  const adminName = partner.contactName.trim() || "Администратор";
  const integrationCode = partner.unp ? `FC-${partner.unp}` : `FC-${partner.id.slice(0, 8).toUpperCase()}`;
  const outletPhone = shiftPartnerPhone(partner.phone, 17) || partner.phone;
  const invitedPhone = shiftPartnerPhone(partner.phone, 41) || partner.phone;

  return {
    partnerId: partner.id,
    goodsSource: "api",
    users: [
      {
        id: `${partner.id}-user-admin`,
        fullName: adminName,
        phone: partner.phone,
        role: "Администратор",
        status: "activated",
      },
      {
        id: `${partner.id}-user-manager`,
        fullName: "Менеджер торговой точки",
        phone: invitedPhone,
        role: "Менеджер",
        status: "invited",
      },
    ],
    pointsOfSale: [
      {
        id: `${partner.id}-outlet-minsk`,
        name: `${partner.companyName || "Партнёр"} — Минск`,
        address: "пр-т Независимости, 1",
        city: "Минск",
        phone: partner.phone,
        status: "active",
      },
      {
        id: `${partner.id}-outlet-brest`,
        name: `${partner.companyName || "Партнёр"} — Брест`,
        address: "ул. Советская, 15",
        city: "Брест",
        phone: outletPhone,
        status: "active",
      },
    ],
    financing: defaultFinancingTerms(),
    settings: {
      goodsSource: "api",
      canCreateApplications: true,
      notifyEmail: partner.email,
      autoSendOffers: false,
      integrationCode,
      stockSync: true,
      comment: "Товары поступают из API партнёра",
    },
  };
}

function isPartnerUser(value: unknown): value is PartnerUser {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as PartnerUser;
  return (
    typeof item.id === "string" &&
    typeof item.fullName === "string" &&
    typeof item.phone === "string" &&
    typeof item.role === "string" &&
    isPartnerUserStatus(item.status)
  );
}

function isPointOfSale(value: unknown): value is PointOfSale {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as PointOfSale;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.address === "string" &&
    typeof item.city === "string" &&
    typeof item.phone === "string" &&
    (item.status === "active" || item.status === "closed")
  );
}

export function isPartnerProfile(value: unknown): value is PartnerProfile {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as PartnerProfile;
  return (
    typeof item.partnerId === "string" &&
    isGoodsSource(item.goodsSource) &&
    Array.isArray(item.users) &&
    item.users.every(isPartnerUser) &&
    Array.isArray(item.pointsOfSale) &&
    item.pointsOfSale.every(isPointOfSale) &&
    Boolean(item.financing) &&
    Boolean(item.settings) &&
    isGoodsSource(item.settings.goodsSource)
  );
}

function readAll(): Record<string, PartnerProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, PartnerProfile>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(Object.entries(parsed).filter(([, item]) => isPartnerProfile(item)));
  } catch {
    return {};
  }
}

function writeAll(profiles: Record<string, PartnerProfile>) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

export function getPartnerProfile(partner: PartnerProfileSeed): PartnerProfile {
  const all = readAll();
  const existing = all[partner.id];
  if (existing) {
    return existing;
  }
  const seeded = seedPartnerProfile(partner);
  all[partner.id] = seeded;
  writeAll(all);
  return seeded;
}
