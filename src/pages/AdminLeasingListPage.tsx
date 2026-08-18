import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { PageHeader, StatGrid } from "../components/ui/PageHeader";
import { listLocalLeasing, type LeasingApplication } from "../lib/leasing";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import { STATUS_LABEL, statusRank } from "../lib/status";

export function AdminLeasingListPage() {
  const navigate = useNavigate();
  const rows = useMemo(() => {
    const items = listLocalLeasing();
    items.sort((a, b) => statusRank(a.status) - statusRank(b.status) || b.createdAt.localeCompare(a.createdAt));
    return items;
  }, []);

  return (
    <section className="admin-page">
      <PageHeader title="Заявки на лизинг" subtitle={`${rows.length} заявок в работе системы`} />
      <StatGrid
        items={[
          { label: "Всего", value: rows.length },
          {
            label: "На рассмотрении",
            value: rows.filter((item) => item.status === "pending").length,
            tone: "warning",
          },
          {
            label: "В работе",
            value: rows.filter((item) => item.status === "accepted").length,
          },
          {
            label: "Одобрены",
            value: rows.filter((item) => item.status === "approved").length,
            tone: "success",
          },
        ]}
      />
      <AdminApplicationTable
        rows={rows}
        empty="Пока нет заявок на лизинг."
        onRowClick={(item) => navigate(`/admin/leasing/${item.id}`)}
        columns={[
          {
            key: "company",
            label: "Организация",
            render: (item: LeasingApplication) => item.companyName || "—",
          },
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
            key: "manager",
            label: "Менеджер",
            render: (item) => item.responsibleManager || "—",
          },
          {
            key: "phone",
            label: "Телефон",
            render: (item) => formatPhoneDisplay(item.phone),
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
