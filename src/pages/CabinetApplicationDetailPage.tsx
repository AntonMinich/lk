import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { getLocalLeasing } from "../lib/leasing";
import { formatPhoneDisplay } from "../lib/phone";
import { STATUS_LABEL } from "../lib/status";

export function CabinetApplicationDetailPage() {
  const { id } = useParams();
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

  const fields = [
    { label: "Организация", value: application.companyName },
    { label: "Контактное лицо", value: application.contactName },
    { label: "Телефон", value: formatPhoneDisplay(application.phone) },
    { label: "Предмет лизинга", value: application.asset },
    { label: "Сумма", value: application.amount },
    { label: "Срок, мес.", value: application.termMonths },
    { label: "Дата заявки", value: formatDateTime(application.createdAt) },
    { label: "Статус", value: STATUS_LABEL[application.status] },
    { label: "Менеджер", value: application.responsibleManager || "Не назначен" },
  ];

  return (
    <section className="admin-page">
      <Link to="/cabinet/applications" className="cabinet-back">
        К списку заявок
      </Link>
      <h1>Заявка на лизинг</h1>
      <div className="admin-form-grid">
        {fields.map((field) => (
          <div className="field" key={field.label}>
            <label>{field.label}</label>
            <input type="text" readOnly value={field.value || "—"} />
          </div>
        ))}
      </div>
    </section>
  );
}
