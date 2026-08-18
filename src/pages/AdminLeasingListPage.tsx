import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { StatusFilterBar } from "../components/StatusFilterBar";
import { PageHeader } from "../components/ui/PageHeader";
import { formatLeasingApplicationNo } from "../lib/application-no";
import { listLocalLeasing, type LeasingApplication } from "../lib/leasing";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import {
  LEASING_FILTERS,
  LEASING_STATUS_LABEL,
  leasingStatusRank,
  matchesLeasingFilter,
  type LeasingFilterKey,
} from "../lib/leasing-status";

export function AdminLeasingListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LeasingFilterKey>("all");
  const queue = useMemo(() => {
    const items = listLocalLeasing();
    items.sort(
      (a, b) => leasingStatusRank(a.status) - leasingStatusRank(b.status) || b.createdAt.localeCompare(a.createdAt),
    );
    return items;
  }, []);
  const rows = useMemo(
    () => queue.filter((item) => matchesLeasingFilter(item.status, filter)),
    [filter, queue],
  );

  return (
    <section className="admin-page">
      <PageHeader title="Заявки на лизинг" subtitle="Отбор по статусу среди активных заявок" />
      <StatusFilterBar items={queue} value={filter} onChange={setFilter} filters={LEASING_FILTERS} />
      <AdminApplicationTable
        rows={rows}
        empty={queue.length === 0 ? "Пока нет заявок на лизинг." : "Нет заявок в этом отборе."}
        onRowClick={(item) => navigate(`/admin/leasing/${item.id}`)}
        columns={[
          {
            key: "id",
            label: "Заявка",
            render: (item: LeasingApplication) => formatLeasingApplicationNo(item.seq, item.createdAt),
          },
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
              <span className={`status-pill status-pill--${item.status}`}>{LEASING_STATUS_LABEL[item.status]}</span>
            ),
          },
        ]}
      />
    </section>
  );
}
