import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AdminApplicationDetail } from "../components/AdminApplicationDetail";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { getLocalLeasing, setLocalLeasingStatus } from "../lib/leasing";
import { formatPhoneDisplay } from "../lib/phone";
import type { ApplicationStatus } from "../lib/status";

export function AdminLeasingDetailPage() {
  const { id } = useParams();
  const { adminName } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

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

  function changeStatus(status: ApplicationStatus) {
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

  return (
    <AdminApplicationDetail
      title="Заявка на лизинг"
      status={current.status}
      activatedBy={current.activatedBy}
      busy={busy}
      error={error}
      onApprove={() => changeStatus("approved")}
      onReject={() => changeStatus("rejected")}
      onBlock={() => changeStatus("blocked")}
      fields={[
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
