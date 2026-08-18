import { useLocation, useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { listLocalLeasingByPartner } from "../lib/leasing";
import { STATUS_LABEL, statusRank } from "../lib/status";

export function CabinetPage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const created = Boolean((location.state as { created?: boolean } | null)?.created);

  if (!partner) {
    return null;
  }

  const applications = listLocalLeasingByPartner(partner.id).sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section className="admin-page">
      <PageHeader title="Мои заявки" subtitle={`${applications.length} заявок на лизинг`} />
      {created ? (
        <p className="banner banner--ok" role="status">
          Заявка отправлена. Её можно отслеживать в списке ниже.
        </p>
      ) : null}
      <AdminApplicationTable
        rows={applications}
        empty="Пока нет заявок. Нажмите «Создать заявку»."
        onRowClick={(item) => navigate(`/cabinet/applications/${item.id}`)}
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
            key: "manager",
            label: "Менеджер",
            render: (item) => item.responsibleManager || "—",
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
    </section>
  );
}
