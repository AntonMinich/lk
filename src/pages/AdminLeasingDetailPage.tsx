import { useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AdminApplicationDetail } from "../components/AdminApplicationDetail";
import { useAuth } from "../lib/auth";
import { formatLeasingApplicationNo } from "../lib/application-no";
import { formatDateTime } from "../lib/format";
import {
  getLocalLeasing,
  setLocalLeasingManager,
  setLocalLeasingStatus,
} from "../lib/leasing";
import { LEASING_STATUS_LABEL, type LeasingStatus } from "../lib/leasing-status";
import { formatPhoneDisplay } from "../lib/phone";

export function AdminLeasingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { adminName } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const showHistory = Boolean(id) && location.pathname.endsWith("/history");

  const application = useMemo(() => (id ? getLocalLeasing(id) : null), [id, revision]);

  if (!id) {
    return <Navigate to="/admin/leasing" replace />;
  }

  if (!application) {
    return (
      <section className="admin-page">
        <h1>Заявка не найдена</h1>
      </section>
    );
  }

  const current = application;

  function changeStatus(status: LeasingStatus) {
    setError("");
    setBusy(true);
    const updated = setLocalLeasingStatus(current.id, status, adminName);
    setBusy(false);
    if (!updated) {
      setError("Заявка не найдена");
      return;
    }
    setRevision((value) => value + 1);
  }

  function changeManager(name: string) {
    setError("");
    setBusy(true);
    const result = setLocalLeasingManager(current.id, name, adminName);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setRevision((value) => value + 1);
  }

  return (
    <AdminApplicationDetail
      title="Заявка на лизинг"
      crumbs={[
        { label: "Заявки на лизинг", to: "/admin/leasing" },
        { label: formatLeasingApplicationNo(current.seq, current.createdAt) },
      ]}
      status={current.status}
      statusLabel={LEASING_STATUS_LABEL[current.status]}
      manager={current.responsibleManager}
      history={current.history}
      historyHref={`/admin/leasing/${current.id}/history`}
      backHref={`/admin/leasing/${current.id}`}
      pane={showHistory ? "history" : "main"}
      allowManagerChange
      busy={busy}
      error={error}
      onChangeManager={changeManager}
      decisionActions={
        <>
          {current.status !== "in_work" ? (
            <button
              type="button"
              className="action-btn action-btn--ghost"
              disabled={busy}
              onClick={() => changeStatus("in_work")}
            >
              В работе
            </button>
          ) : null}
          {current.status !== "waiting_originals" ? (
            <button
              type="button"
              className="action-btn action-btn--ghost"
              disabled={busy}
              onClick={() => changeStatus("waiting_originals")}
            >
              Ожидание оригиналов
            </button>
          ) : null}
          {current.status !== "completed" ? (
            <button
              type="button"
              className="action-btn action-btn--approve"
              disabled={busy}
              onClick={() => changeStatus("completed")}
            >
              Завершить
            </button>
          ) : null}
          {current.status !== "rejected" ? (
            <button
              type="button"
              className="action-btn action-btn--reject"
              disabled={busy}
              onClick={() => changeStatus("rejected")}
            >
              Отклонить
            </button>
          ) : null}
        </>
      }
      fields={[
        { label: "Номер", value: formatLeasingApplicationNo(current.seq, current.createdAt) },
        { label: "Организация", value: current.companyName },
        { label: "Контактное лицо", value: current.contactName },
        { label: "Телефон", value: formatPhoneDisplay(current.phone) },
        { label: "Предмет лизинга", value: current.asset },
        { label: "Сумма", value: current.amount },
        { label: "Срок, мес.", value: current.termMonths },
        { label: "Дата заявки", value: formatDateTime(current.createdAt) },
      ]}
    />
  );
}
