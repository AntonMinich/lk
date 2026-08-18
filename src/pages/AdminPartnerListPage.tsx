import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { PageHeader, StatGrid } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import { STATUS_LABEL, statusRank } from "../lib/status";
import type { PublicPartner } from "../lib/api";

export function AdminPartnerListPage() {
  const { listPartners } = useAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void listPartners()
      .then((items) => {
        if (cancelled) {
          return;
        }
        items.sort(
          (a, b) => statusRank(a.status) - statusRank(b.status) || b.createdAt.localeCompare(a.createdAt),
        );
        setPartners(items);
      })
      .catch((item: unknown) => {
        if (!cancelled) {
          setError(item instanceof Error ? item.message : "Не удалось загрузить заявки");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [listPartners]);

  return (
    <section className="admin-page">
      <PageHeader
        title="Заявки на регистрацию партнера"
        subtitle={`${partners.length} заявок в очереди`}
      />
      <StatGrid
        items={[
          { label: "Всего", value: partners.length },
          {
            label: "На рассмотрении",
            value: partners.filter((item) => item.status === "pending").length,
            tone: "warning",
          },
          {
            label: "В работе",
            value: partners.filter((item) => item.status === "accepted").length,
          },
          {
            label: "Активны",
            value: partners.filter((item) => item.status === "approved").length,
            tone: "success",
          },
        ]}
      />
      {error ? <p className="field__error">{error}</p> : null}
      <AdminApplicationTable
        rows={partners}
        empty="Пока нет заявок на регистрацию."
        onRowClick={(item) => navigate(`/admin/partners/${item.id}`)}
        columns={[
          {
            key: "company",
            label: "Организация",
            render: (item) => item.companyName || "—",
          },
          {
            key: "contact",
            label: "Контакт",
            render: (item) => item.contactName || "—",
          },
          {
            key: "phone",
            label: "Телефон",
            render: (item) => formatPhoneDisplay(item.phone),
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
