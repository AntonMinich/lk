import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { DateTimeCell } from "../components/DateTimeCell";
import { StatusFilterBar } from "../components/StatusFilterBar";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatPartnerApplicationNo } from "../lib/application-no";
import { formatPhoneDisplay } from "../lib/phone";
import {
  isRegistrationQueue,
  matchesApplicationFilter,
  STATUS_LABEL,
  statusRank,
  type ApplicationFilterKey,
} from "../lib/status";
import type { PublicPartner } from "../lib/api";

export function AdminPartnerListPage() {
  const { listPartners } = useAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [filter, setFilter] = useState<ApplicationFilterKey>("all");
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

  const queue = useMemo(() => partners.filter((item) => isRegistrationQueue(item.status)), [partners]);
  const rows = useMemo(
    () => queue.filter((item) => matchesApplicationFilter(item.status, filter)),
    [filter, queue],
  );

  return (
    <section className="admin-page">
      <PageHeader
        title="Заявки на регистрацию партнера"
        subtitle="Новые заявки появляются здесь сразу после отправки формы"
      />
      <StatusFilterBar items={queue} value={filter} onChange={setFilter} />
      {error ? <p className="field__error">{error}</p> : null}
      <AdminApplicationTable
        rows={rows}
        empty={queue.length === 0 ? "Пока нет заявок на регистрацию." : "Нет заявок в этом отборе."}
        onRowClick={(item) => navigate(`/admin/partners/${item.id}`)}
        columns={[
          {
            key: "id",
            label: "ID",
            render: (item) => formatPartnerApplicationNo(item.seq),
          },
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
            label: "Дата",
            render: (item) => <DateTimeCell value={item.createdAt} />,
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
