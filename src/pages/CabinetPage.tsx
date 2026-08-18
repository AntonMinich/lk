import { Link, Navigate, useLocation } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { listLocalLeasingByPartner } from "../lib/leasing";
import { formatPhoneDisplay } from "../lib/phone";
import { STATUS_LABEL, statusRank } from "../lib/status";

export function CabinetPage() {
  const { ready, partner, logout } = useAuth();
  const location = useLocation();
  const created = Boolean((location.state as { created?: boolean } | null)?.created);

  if (!ready) {
    return null;
  }

  if (!partner) {
    return <Navigate to="/" replace />;
  }

  const applications = listLocalLeasingByPartner(partner.id).sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="cabinet">
      <header className="cabinet__bar">
        <div className="logo logo--wordmark">
          <BrandMark />
          <span className="logo__text">Кабинет партнёра</span>
        </div>
        <div className="cabinet__user">
          <Link to="/cabinet/applications/new" className="primary-btn cabinet__create">
            Создать заявку
          </Link>
          <span>{formatPhoneDisplay(partner.phone)}</span>
          <button type="button" className="ghost-btn" onClick={() => void logout()}>
            Выйти
          </button>
        </div>
      </header>
      <main className="cabinet__main cabinet__main--wide">
        <p className="auth-brand__kicker">Кабинет партнёра</p>
        <h1>Добро пожаловать{partner.contactName ? `, ${partner.contactName}` : ""}</h1>
        {created ? (
          <p className="banner banner--ok" role="status">
            Заявка отправлена. Её можно отслеживать в списке ниже.
          </p>
        ) : null}
        <h2 className="cabinet__section-title">Мои заявки на лизинг</h2>
        <AdminApplicationTable
          rows={applications}
          empty="Пока нет заявок. Нажмите «Создать заявку»."
          columns={[
            {
              key: "asset",
              label: "Предмет",
              render: (item) => item.asset || "—",
            },
            {
              key: "amount",
              label: "Сумма",
              render: (item) => item.amount || "—",
            },
            {
              key: "term",
              label: "Срок, мес.",
              render: (item) => item.termMonths || "—",
            },
            {
              key: "date",
              label: "Дата",
              render: (item) => formatDateTime(item.createdAt),
            },
            {
              key: "status",
              label: "Статус",
              render: (item) => (
                <span className={`status-pill status-pill--${item.status}`}>{STATUS_LABEL[item.status]}</span>
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}
