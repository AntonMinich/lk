import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import { isDirectoryPartner, STATUS_LABEL, statusRank } from "../lib/status";
import type { PublicPartner } from "../lib/api";

export function AdminPartnerDirectoryPage() {
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
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setPartners(items);
      })
      .catch((item: unknown) => {
        if (!cancelled) {
          setError(item instanceof Error ? item.message : "Не удалось загрузить партнёров");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [listPartners]);

  const rows = useMemo(
    () =>
      partners
        .filter((item) => isDirectoryPartner(item.status))
        .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.companyName.localeCompare(b.companyName)),
    [partners],
  );

  return (
    <section className="admin-page">
      <PageHeader title="Партнеры" subtitle={`${rows.length} активных партнёров`} />
      {error ? <p className="field__error">{error}</p> : null}
      <AdminApplicationTable
        rows={rows}
        empty="Пока нет активных партнёров. Они появляются здесь после входа в кабинет."
        onRowClick={(item) => navigate(`/admin/directory/${item.id}`)}
        columns={[
          {
            key: "company",
            label: "Организация",
            render: (item) => item.companyName || "—",
          },
          {
            key: "unp",
            label: "УНП",
            render: (item) => item.unp || "—",
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
            label: "Дата заявки",
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
