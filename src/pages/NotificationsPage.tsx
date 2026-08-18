import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import {
  markNotificationRead,
  markNotificationsRead,
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

export function NotificationsPage({ audience, partnerId }: NotificationsPageProps) {
  const { items, unread } = useNotifications({ audience, partnerId });
  const navigate = useNavigate();

  return (
    <section className="admin-page">
      <PageHeader
        title="Уведомления"
        subtitle={unread > 0 ? `${unread} непрочитанных` : "Все уведомления прочитаны"}
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
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={item.read ? "admin-table__row--click" : "admin-table__row--click is-unread"}
                  tabIndex={0}
                  onClick={() => {
                    markNotificationRead(item.id);
                    navigate(item.href);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      markNotificationRead(item.id);
                      navigate(item.href);
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
                  <td data-label="Статус">{item.read ? "Прочитано" : "Новое"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
