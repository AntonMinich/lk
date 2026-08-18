import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { useAuth } from "../lib/auth";
import { formatDateTime } from "../lib/format";
import { formatPhoneDisplay } from "../lib/phone";
import { STATUS_LABEL, type ApplicationStatus } from "../lib/status";
import type { PublicPartner } from "../lib/api";

function statusRank(status: ApplicationStatus) {
  if (status === "pending") {
    return 0;
  }
  if (status === "approved") {
    return 1;
  }
  if (status === "blocked") {
    return 2;
  }
  return 3;
}

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
      <h1>Заявки на регистрацию партнера</h1>
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
