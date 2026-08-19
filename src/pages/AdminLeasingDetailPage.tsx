import { useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AdminApplicationDetail } from "../components/AdminApplicationDetail";
import { useAuth } from "../lib/auth";
import { formatLeasingApplicationNo } from "../lib/application-no";
import { formatDateTime } from "../lib/format";
import { getLocalLeasing, setLocalLeasingManager, setLocalLeasingStatus } from "../lib/leasing";
import {
  LEASING_STATUS_LABEL,
  leasingAdminPath,
  type LeasingStatus,
} from "../lib/leasing-status";
import { formatPhoneDisplay } from "../lib/phone";

const APPLICATION_ACTIONS: { status: LeasingStatus; label: string; kind: "ghost" | "approve" | "reject" }[] = [
  { status: "draft", label: "Черновик", kind: "ghost" },
  { status: "new", label: "Новая", kind: "ghost" },
  { status: "in_work", label: "В работе", kind: "ghost" },
  { status: "questionnaire", label: "Анкетные данные", kind: "ghost" },
  { status: "cancelled", label: "Отменить", kind: "reject" },
];

const DEAL_ACTIONS: { status: LeasingStatus; label: string; kind: "ghost" | "approve" | "reject" }[] = [
  { status: "document_prep", label: "Подготовка документов", kind: "ghost" },
  { status: "signing", label: "Подписание документов", kind: "ghost" },
  { status: "waiting_originals", label: "Ожидание оригиналов", kind: "ghost" },
  { status: "completed", label: "Завершить", kind: "approve" },
  { status: "cancelled", label: "Отменить", kind: "reject" },
];

export function AdminLeasingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { adminName } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const showHistory = Boolean(id) && location.pathname.endsWith("/history");
  const fromDeals = location.pathname.startsWith("/admin/deals");

  const application = useMemo(() => (id ? getLocalLeasing(id) : null), [id, revision]);

  if (!id) {
    return <Navigate to={fromDeals ? "/admin/deals" : "/admin/leasing"} replace />;
  }

  if (!application) {
    return (
      <section className="admin-page">
        <h1>{fromDeals ? "Сделка не найдена" : "Заявка не найдена"}</h1>
      </section>
    );
  }

  const current = application;
  if (fromDeals && current.pipeline !== "deal") {
    return <Navigate to={leasingAdminPath(current.id, current.pipeline)} replace />;
  }
  if (!fromDeals && current.pipeline === "deal") {
    return <Navigate to={leasingAdminPath(current.id, current.pipeline)} replace />;
  }

  const listHref = current.pipeline === "deal" ? "/admin/deals" : "/admin/leasing";
  const listLabel = current.pipeline === "deal" ? "Сделки" : "Заявки на лизинг";
  const detailHref = leasingAdminPath(current.id, current.pipeline);
  const title = current.pipeline === "deal" ? "Сделка" : "Заявка на лизинг";
  const actions = current.pipeline === "deal" ? DEAL_ACTIONS : APPLICATION_ACTIONS;

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
      title={title}
      crumbs={[
        { label: listLabel, to: listHref },
        {
          label: formatLeasingApplicationNo(current.seq, current.createdAt),
          to: showHistory ? detailHref : undefined,
        },
        ...(showHistory ? [{ label: "История" }] : []),
      ]}
      status={current.status}
      statusLabel={LEASING_STATUS_LABEL[current.status]}
      manager={current.responsibleManager}
      history={current.history}
      historyHref={`${detailHref}/history`}
      backHref={detailHref}
      backLabel={current.pipeline === "deal" ? "К сделке" : "К заявке"}
      pane={showHistory ? "history" : "main"}
      allowManagerChange
      busy={busy}
      error={error}
      onChangeManager={changeManager}
      decisionActions={
        <>
          {current.pipeline === "application" && current.status === "questionnaire" ? (
            <button
              type="button"
              className="action-btn action-btn--approve"
              disabled={busy}
              onClick={() => changeStatus("document_prep")}
            >
              Подготовка документов
            </button>
          ) : null}
          {actions.map((item) =>
            item.status === current.status ? null : (
              <button
                key={item.status}
                type="button"
                className={`action-btn action-btn--${item.kind}`}
                disabled={busy}
                onClick={() => changeStatus(item.status)}
              >
                {item.label}
              </button>
            ),
          )}
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
