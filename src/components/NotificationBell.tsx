import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateTime } from "../lib/format";
import {
  markNotificationRead,
  markNotificationsRead,
  type NotificationAudience,
} from "../lib/notifications";
import { useNotifications } from "../lib/use-notifications";

type NotificationBellProps = {
  audience: NotificationAudience;
  partnerId?: string;
  allHref: string;
};

export function NotificationBell({ audience, partnerId, allHref }: NotificationBellProps) {
  const { items, unread } = useNotifications({ audience, partnerId });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const preview = items.slice(0, 6);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="notice-bell" ref={rootRef}>
      <button
        type="button"
        className="notice-bell__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread ? `Уведомления, непрочитанных ${unread}` : "Уведомления"}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.4 2.4 0 0 0 2.4-2.4h-4.8A2.4 2.4 0 0 0 12 22Zm7.2-6V10.4a7.2 7.2 0 1 0-14.4 0V16L3 17.6V19h18v-1.4L19.2 16Z"
          />
        </svg>
        {unread > 0 ? <span className="notice-bell__badge">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notice-bell__dropdown" role="menu">
          <div className="notice-bell__head">
            <strong>Уведомления</strong>
            {unread > 0 ? (
              <button
                type="button"
                className="notice-bell__read-all"
                onClick={() => markNotificationsRead({ audience, partnerId })}
              >
                Прочитать все
              </button>
            ) : null}
          </div>
          {preview.length === 0 ? (
            <p className="notice-bell__empty">Пока нет уведомлений</p>
          ) : (
            preview.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.read ? "notice-bell__item" : "notice-bell__item is-unread"}
                onClick={() => {
                  markNotificationRead(item.id);
                  setOpen(false);
                  navigate(item.href);
                }}
              >
                <span className="notice-bell__title">{item.title}</span>
                <span className="notice-bell__text">{item.text}</span>
                <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
              </button>
            ))
          )}
          <Link to={allHref} className="notice-bell__all" onClick={() => setOpen(false)}>
            Все уведомления
          </Link>
        </div>
      ) : null}
    </div>
  );
}
