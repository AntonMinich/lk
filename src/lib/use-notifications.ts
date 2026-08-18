import { useEffect, useState } from "react";
import {
  listNotifications,
  NOTIFICATIONS_EVENT,
  unreadNotificationCount,
  type NotificationAudience,
  type AppNotification,
} from "./notifications";

export function useNotifications(filter: { audience: NotificationAudience; partnerId?: string }): {
  items: AppNotification[];
  unread: number;
} {
  const audience = filter.audience;
  const partnerId = filter.partnerId ?? "";
  const [items, setItems] = useState<AppNotification[]>(() => listNotifications(filter));
  const [unread, setUnread] = useState(() => unreadNotificationCount(filter));

  useEffect(() => {
    function refresh() {
      const nextFilter = { audience, partnerId: partnerId || undefined };
      setItems(listNotifications(nextFilter));
      setUnread(unreadNotificationCount(nextFilter));
    }
    refresh();
    window.addEventListener(NOTIFICATIONS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [audience, partnerId]);

  return { items, unread };
}
