import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatLeasingApplicationNo } from "../lib/application-no";
import { formatDateTime } from "../lib/format";
import { getLocalLeasing } from "../lib/leasing";
import { formatPhoneDisplay } from "../lib/phone";
import { LEASING_STATUS_LABEL, leasingCabinetPath } from "../lib/leasing-status";

export function CabinetApplicationDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { partner } = useAuth();

  if (!id) {
    return <Navigate to="/cabinet/applications" replace />;
  }

  const application = getLocalLeasing(id);
  if (!partner || !application || application.partnerId !== partner.id) {
    return (
      <section className="admin-page">
        <h1>Заявка не найдена</h1>
        <Link to="/cabinet/applications" className="cabinet-back">
          К списку заявок
        </Link>
      </section>
    );
  }

  const listHref = application.pipeline === "deal" ? "/cabinet/deals" : "/cabinet/applications";
  const listLabel = application.pipeline === "deal" ? "К списку сделок" : "К списку заявок";
  const expected = leasingCabinetPath(application.id, application.pipeline);
  if (!location.pathname.startsWith(expected)) {
    return <Navigate to={expected} replace />;
  }

  const fields = [
    { label: "Номер", value: formatLeasingApplicationNo(application.seq, application.createdAt) },
    { label: "Организация", value: application.companyName },
    { label: "Контактное лицо", value: application.contactName },
    { label: "Телефон", value: formatPhoneDisplay(application.phone) },
    { label: "Предмет лизинга", value: application.asset },
    { label: "Сумма", value: application.amount },
    { label: "Срок, мес.", value: application.termMonths },
    { label: "Дата заявки", value: formatDateTime(application.createdAt) },
    { label: "Статус", value: LEASING_STATUS_LABEL[application.status] },
    { label: "Менеджер", value: application.responsibleManager || "Не назначен" },
  ];

  return (
    <section className="admin-page">
      <PageHeader
        title={application.pipeline === "deal" ? "Сделка" : "Заявка на лизинг"}
        subtitle={application.asset || application.companyName}
        actions={
          <Link to={listHref} className="secondary-btn">
            {listLabel}
          </Link>
        }
      />
      <div className="panel">
        <div className="admin-form-grid">
          {fields.map((field) => (
            <div className="field" key={field.label}>
              <label>{field.label}</label>
              <input type="text" readOnly value={field.value || "—"} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
