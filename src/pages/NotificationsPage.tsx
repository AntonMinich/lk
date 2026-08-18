import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import {
  markNotificationRead,
  markNotificationsRead,
  type AppNotification,
  type NotificationAudience,
} from "../lib/notifications";
import { useNotifications } from "../lib/use-notifications";

export function AdminNotificationsPage() {
  return <NotificationsPage audience="admin" />;
}

export function CabinetNotificationsPage() {
  const { partner } = useAuth();
  if (!partner) {
    return null;
  }
  return <NotificationsPage audience="partner" partnerId={partner.id} />;
}

type NotificationsPageProps = {
  audience: NotificationAudience;
  partnerId?: string;
};

type NoticeTab = "unread" | "read";

export function NotificationsPage({ audience, partnerId }: NotificationsPageProps) {
  const { items, unread } = useNotifications({ audience, partnerId });
  const navigate = useNavigate();
  const [tab, setTab] = useState<NoticeTab>("unread");
  const fresh = items.filter((item) => !item.read);
  const seen = items.filter((item) => item.read);
  const visible = tab === "unread" ? fresh : seen;

  function openItem(item: AppNotification) {
    markNotificationRead(item.id);
    navigate(item.href);
  }

  return (
    <section className="admin-page">
      <PageHeader
        title="Уведомления"
        subtitle={unread > 0 ? `${unread} непросмотренных` : "Все уведомления просмотрены"}
        actions={
          unread > 0 ? (
            <button type="button" className="ghost-btn" onClick={() => markNotificationsRead({ audience, partnerId })}>
              Прочитать все
            </button>
          ) : null
        }
      />
      {items.length === 0 ? (
        <p className="admin-empty">Пока нет уведомлений.</p>
      ) : (
        <>
          <div className="notice-tabs" role="tablist" aria-label="Уведомления">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "unread"}
              className={tab === "unread" ? "notice-tab is-active" : "notice-tab"}
              onClick={() => setTab("unread")}
            >
              Непросмотренные <span>{fresh.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "read"}
              className={tab === "read" ? "notice-tab is-active" : "notice-tab"}
              onClick={() => setTab("read")}
            >
              Прочитанные <span>{seen.length}</span>
            </button>
          </div>
          {visible.length === 0 ? (
            <p className="admin-empty">
              {tab === "unread" ? "Нет непросмотренных уведомлений." : "Нет прочитанных уведомлений."}
            </p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Событие</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr
                      key={item.id}
                      className={item.read ? "admin-table__row--click" : "admin-table__row--click is-unread"}
                      tabIndex={0}
                      onClick={() => openItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openItem(item);
                        }
                      }}
                    >
                      <td data-label="Дата">
                        <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                      </td>
                      <td data-label="Событие">
                        <strong>{item.title}</strong>
                        <span className="notice-page__text">{item.text}</span>
                      </td>
                      <td data-label="Статус">{item.read ? "Прочитано" : "Непросмотренное"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
