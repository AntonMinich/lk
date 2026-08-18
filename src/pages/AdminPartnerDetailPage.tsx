import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AdminApplicationDetail } from "../components/AdminApplicationDetail";
import { useAuth } from "../lib/auth";
import { formatPartnerApplicationNo } from "../lib/application-no";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import { partnerDocumentLabel } from "../lib/partner-docs";
import type { PublicPartner } from "../lib/api";
import { isDirectoryPartner, type ApplicationStatus } from "../lib/status";

export function AdminPartnerDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { listPartners, setPartnerStatus, setPartnerManager } = useAuth();
  const [partner, setPartner] = useState<PublicPartner | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const showHistory = Boolean(id) && location.pathname.endsWith("/history");

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    void listPartners()
      .then((items) => {
        if (!cancelled) {
          setPartner(items.find((item) => item.id === id) ?? null);
        }
      })
      .catch((item: unknown) => {
        if (!cancelled) {
          setError(item instanceof Error ? item.message : "Не удалось загрузить заявку");
          setPartner(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, listPartners]);

  if (!id) {
    return <Navigate to="/admin/partners" replace />;
  }

  if (partner === undefined) {
    return null;
  }

  if (!partner) {
    return (
      <section className="admin-page">
        <h1>Заявка не найдена</h1>
      </section>
    );
  }

  const current = partner;

  async function changeStatus(status: ApplicationStatus) {
    setError("");
    setBusy(true);
    const result = await setPartnerStatus(current.id, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPartner(result.partner);
  }

  async function changeManager(name: string) {
    setError("");
    setBusy(true);
    const result = await setPartnerManager(current.id, name);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPartner(result.partner);
  }

  const fromDirectory = location.pathname.startsWith("/admin/directory") || isDirectoryPartner(current.status);
  const listHref = fromDirectory ? "/admin/directory" : "/admin/partners";
  const listLabel = fromDirectory ? "Партнеры" : "Заявки на регистрацию";
  const detailHref = fromDirectory ? `/admin/directory/${current.id}` : `/admin/partners/${current.id}`;

  return (
    <AdminApplicationDetail
      title={fromDirectory ? "Партнёр" : "Заявка на регистрацию партнера"}
      crumbs={[
        { label: listLabel, to: listHref },
        { label: current.companyName || (fromDirectory ? "Партнёр" : "Заявка") },
      ]}
      status={current.status}
      manager={current.responsibleManager}
      history={current.history}
      historyHref={`${detailHref}/history`}
      backHref={detailHref}
      showHistory={showHistory}
      busy={busy}
      error={error}
      onAccept={() => void changeStatus("accepted")}
      onApprove={() => void changeStatus("approved")}
      onReject={() => void changeStatus("rejected")}
      onBlock={() => void changeStatus("blocked")}
      onChangeManager={(name) => void changeManager(name)}
      fields={[
        { label: "ID", value: formatPartnerApplicationNo(current.seq) },
        { label: "Наименование юридического лица", value: current.companyName },
        { label: "УНП", value: current.unp },
        { label: "ФИО контактного лица", value: current.contactName },
        { label: "Телефон", value: formatPhoneDisplay(current.phone) },
        { label: "Email", value: current.email },
        { label: "Дата заявки", value: formatDateTime(current.createdAt) },
      ]}
      documents={current.documents.map((item) => ({
        label: partnerDocumentLabel(item.key),
        fileName: item.fileName,
        size: item.size,
        key: item.key,
        phone: current.phone,
      }))}
    />
  );
}
