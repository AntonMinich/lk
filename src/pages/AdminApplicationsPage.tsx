import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../lib/auth";
import { formatPhoneDisplay } from "../lib/phone";
import type { PublicPartner } from "../lib/api";
import { STATUS_LABEL, type ApplicationStatus } from "../lib/status";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("ru-BY");
}

function statusRank(status: ApplicationStatus) {
  if (status === "pending") {
    return 0;
  }
  if (status === "approved") {
    return 1;
  }
  return 2;
}

function sortApplications(items: PublicPartner[]) {
  return [...items].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function AdminApplicationsPage() {
  const { ready, admin, apiOnline, listPartners, setPartnerStatus, logoutAdmin } = useAuth();
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!ready || !admin) {
      return;
    }
    let cancelled = false;
    void listPartners()
      .then((items) => {
        if (!cancelled) {
          setPartners(sortApplications(items));
        }
      })
      .catch((item: unknown) => {
        if (!cancelled) {
          setError(item instanceof Error ? item.message : "Не удалось загрузить заявки");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [admin, listPartners, ready]);

  if (!ready) {
    return null;
  }

  if (!admin) {
    return <Navigate to="/admin" replace />;
  }

  async function changeStatus(id: string, status: ApplicationStatus) {
    setError("");
    setBusyId(id);
    const result = await setPartnerStatus(id, status);
    setBusyId("");
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPartners(sortApplications(await listPartners()));
  }

  return (
    <div className="cabinet">
      <header className="cabinet__bar">
        <Link to="/admin/applications" className="logo logo--wordmark">
          <BrandMark />
          <span className="logo__text">Админка</span>
        </Link>
        <div className="cabinet__user">
          <Link to="/" className="ghost-btn">
            Кабинет партнёра
          </Link>
          <button type="button" className="ghost-btn" onClick={() => void logoutAdmin()}>
            Выйти
          </button>
        </div>
      </header>
      <main className="cabinet__main cabinet__main--wide">
        <p className="auth-brand__kicker">Заявки</p>
        <h1>Регистрации партнёров</h1>
        <p className="cabinet__lead">
          {apiOnline
            ? "Одобрите заявку — после этого партнёр сможет войти в кабинет."
            : "Сервер API недоступен. Показаны заявки из этого браузера. Одобрение тоже действует только здесь."}
        </p>
        {error ? <p className="field__error">{error}</p> : null}
        {partners.length === 0 && !error ? (
          <p className="cabinet__lead">Пока нет заявок.</p>
        ) : (
          <div className="table-wrap">
            <table className="partners-table">
              <thead>
                <tr>
                  <th>Телефон</th>
                  <th>Организация</th>
                  <th>Контакт</th>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((item) => (
                  <tr key={item.id}>
                    <td>{formatPhoneDisplay(item.phone)}</td>
                    <td>{item.companyName || "—"}</td>
                    <td>{item.contactName || "—"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <span className={`status-pill status-pill--${item.status}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-btn action-btn--approve"
                          disabled={busyId === item.id || item.status === "approved"}
                          onClick={() => void changeStatus(item.id, "approved")}
                        >
                          Одобрить
                        </button>
                        <button
                          type="button"
                          className="action-btn action-btn--reject"
                          disabled={busyId === item.id || item.status === "rejected"}
                          onClick={() => void changeStatus(item.id, "rejected")}
                        >
                          Отклонить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
