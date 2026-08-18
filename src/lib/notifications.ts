export type NotificationAudience = "admin" | "partner";

export type AppNotification = {
  id: string;
  audience: NotificationAudience;
  partnerId: string;
  title: string;
  text: string;
  href: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = "lk-local-notifications";
export const NOTIFICATIONS_EVENT = "lk-notifications";
const MAX_ITEMS = 80;

function readAll(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AppNotification[]) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) => item && typeof item.id === "string" && typeof item.title === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
  }
}

export function addNotification(input: {
  audience: NotificationAudience;
  partnerId?: string;
  title: string;
  text: string;
  href: string;
}): AppNotification {
  const item: AppNotification = {
    id: crypto.randomUUID(),
    audience: input.audience,
    partnerId: input.partnerId ?? "",
    title: input.title,
    text: input.text,
    href: input.href,
    createdAt: new Date().toISOString(),
    read: false,
  };
  writeAll([item, ...readAll()]);
  return item;
}

export function listNotifications(filter: {
  audience: NotificationAudience;
  partnerId?: string;
}): AppNotification[] {
  return readAll()
    .filter((item) => {
      if (item.audience !== filter.audience) {
        return false;
      }
      if (filter.audience === "partner") {
        return item.partnerId === (filter.partnerId ?? "");
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadNotificationCount(filter: {
  audience: NotificationAudience;
  partnerId?: string;
}): number {
  return listNotifications(filter).filter((item) => !item.read).length;
}

export function markNotificationRead(id: string): void {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return;
  }
  const current = items[index];
  if (!current || current.read) {
    return;
  }
  items[index] = { ...current, read: true };
  writeAll(items);
}

export function markNotificationsRead(filter: {
  audience: NotificationAudience;
  partnerId?: string;
}): void {
  const visible = new Set(listNotifications(filter).map((item) => item.id));
  writeAll(
    readAll().map((item) => (visible.has(item.id) ? { ...item, read: true } : item)),
  );
}
