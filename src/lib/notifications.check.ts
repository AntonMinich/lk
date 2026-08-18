import {
  addNotification,
  listNotifications,
  markNotificationRead,
  markNotificationsRead,
  unreadNotificationCount,
} from "./notifications.ts";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    key(index: number) {
      return [...memory.keys()][index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(key, String(value));
    },
  } satisfies Storage,
});

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

localStorage.clear();

const adminItem = addNotification({
  audience: "admin",
  title: "Новая заявка на лизинг",
  text: "ООО «Тест» — тягач",
  href: "/admin/leasing/1",
});
addNotification({
  audience: "partner",
  partnerId: "p1",
  title: "Заявка на лизинг",
  text: "Статус: В работе",
  href: "/cabinet/applications/1",
});
addNotification({
  audience: "partner",
  partnerId: "p2",
  title: "Чужая заявка",
  text: "не должна быть видна",
  href: "/cabinet/applications/2",
});

assertEqual(listNotifications({ audience: "admin" }).length, 1, "admin list");
assertEqual(listNotifications({ audience: "partner", partnerId: "p1" }).length, 1, "partner filter");
assertEqual(unreadNotificationCount({ audience: "admin" }), 1, "unread admin");

markNotificationRead(adminItem.id);
assertEqual(unreadNotificationCount({ audience: "admin" }), 0, "read one");

markNotificationsRead({ audience: "partner", partnerId: "p1" });
assertEqual(unreadNotificationCount({ audience: "partner", partnerId: "p1" }), 0, "read all partner");
assertEqual(unreadNotificationCount({ audience: "partner", partnerId: "p2" }), 1, "other partner unread");

console.log("notification checks passed");
