import { useMemo, useState, type ReactNode } from "react";
import { AdminApplicationTable, type AdminTableColumn } from "./AdminApplicationTable";
import { StatusFilterBar, type StatusFilterItem } from "./StatusFilterBar";
import { PageHeader } from "./ui/PageHeader";
import { formatLeasingApplicationNo } from "../lib/application-no";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import type { LeasingApplication } from "../lib/leasing";
import {
  LEASING_STATUS_LABEL,
  leasingStatusRank,
  matchesLeasingFilter,
  type LeasingFilterKey,
} from "../lib/leasing-status";

type LeasingQueueProps = {
  title: string;
  subtitle?: string;
  banner?: ReactNode;
  actions?: ReactNode;
  items: LeasingApplication[];
  filters: StatusFilterItem<LeasingFilterKey>[];
  onRowClick: (item: LeasingApplication) => void;
  empty: string;
  emptyFilter: string;
  showCompany?: boolean;
  showPhone?: boolean;
};

export function LeasingQueue({
  title,
  subtitle,
  banner,
  actions,
  items,
  filters,
  onRowClick,
  empty,
  emptyFilter,
  showCompany = true,
  showPhone = true,
}: LeasingQueueProps) {
  const [filter, setFilter] = useState<LeasingFilterKey>("all");
  const queue = useMemo(
    () =>
      [...items].sort(
        (a, b) => leasingStatusRank(a.status) - leasingStatusRank(b.status) || b.createdAt.localeCompare(a.createdAt),
      ),
    [items],
  );
  const rows = useMemo(
    () => queue.filter((item) => matchesLeasingFilter(item.status, filter)),
    [filter, queue],
  );

  const columns: AdminTableColumn<LeasingApplication>[] = [
    {
      key: "id",
      label: "Заявка",
      render: (item) => formatLeasingApplicationNo(item.seq, item.createdAt),
    },
  ];
  if (showCompany) {
    columns.push({
      key: "company",
      label: "Организация",
      render: (item) => item.companyName || "—",
    });
  }
  columns.push(
    {
      key: "client",
      label: "Клиент",
      render: (item) => item.contactName || "—",
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
  );
  if (showPhone) {
    columns.push({
      key: "phone",
      label: "Телефон",
      render: (item) => formatPhoneDisplay(item.phone),
    });
  }
  columns.push(
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
  );

  return (
    <section className="admin-page">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {banner}
      <StatusFilterBar items={queue} value={filter} onChange={setFilter} filters={filters} />
      <AdminApplicationTable
        rows={rows}
        empty={queue.length === 0 ? empty : emptyFilter}
        onRowClick={onRowClick}
        columns={columns}
      />
    </section>
  );
}
