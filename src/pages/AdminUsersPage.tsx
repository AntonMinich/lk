import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminApplicationTable } from "../components/AdminApplicationTable";
import { StatusFilterBar } from "../components/StatusFilterBar";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { formatPhoneDisplay } from "../lib/phone";
import {
  listDirectoryUsers,
  PARTNER_USER_FILTERS,
  PARTNER_USER_STATUS_LABEL,
  PARTNER_USER_STATUS_TONE,
  type DirectoryUserRow,
  type PartnerUserFilterKey,
} from "../lib/partner-profile";
import { isDirectoryPartner } from "../lib/status";
import type { PublicPartner } from "../lib/api";

export function AdminUsersPage() {
  const { listPartners } = useAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [filter, setFilter] = useState<PartnerUserFilterKey>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void listPartners()
      .then((items) => {
        if (!cancelled) {
          setPartners(items.filter((item) => isDirectoryPartner(item.status)));
        }
      })
      .catch((item: unknown) => {
        if (!cancelled) {
          setError(item instanceof Error ? item.message : "Не удалось загрузить пользователей");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [listPartners]);

  const users = useMemo(
    () =>
      listDirectoryUsers(
        partners.map((item) => ({
          id: item.id,
          companyName: item.companyName,
          contactName: item.contactName,
          phone: item.phone,
          email: item.email,
          unp: item.unp,
        })),
      ),
    [partners],
  );
  const rows = useMemo(
    () => (filter === "all" ? users : users.filter((item) => item.status === filter)),
    [filter, users],
  );

  return (
    <section className="admin-page">
      <PageHeader title="Пользователи" subtitle={`${users.length} пользователей партнёров`} />
      <StatusFilterBar
        items={users}
        value={filter}
        onChange={setFilter}
        filters={PARTNER_USER_FILTERS.map((item) => ({
          key: item.key,
          label: item.label,
          tone: item.key === "blocked" ? "red" : item.key === "activated" ? "green" : item.key === "invited" ? "purple" : "blue",
        }))}
      />
      {error ? <p className="field__error">{error}</p> : null}
      <AdminApplicationTable
        rows={rows}
        empty="Пока нет пользователей партнёров."
        onRowClick={(item: DirectoryUserRow) => navigate(`/admin/directory/${item.partnerId}/users/${item.id}`)}
        columns={[
          {
            key: "name",
            label: "ФИО",
            render: (item) => item.fullName,
          },
          {
            key: "company",
            label: "Партнёр",
            render: (item) => item.companyName || "—",
          },
          {
            key: "phone",
            label: "Телефон",
            render: (item) => formatPhoneDisplay(item.phone),
          },
          {
            key: "role",
            label: "Роль",
            render: (item) => item.role,
          },
          {
            key: "status",
            label: "Статус",
            render: (item) => (
              <span className={`status-pill status-pill--${PARTNER_USER_STATUS_TONE[item.status]}`}>
                {PARTNER_USER_STATUS_LABEL[item.status]}
              </span>
            ),
          },
        ]}
      />
    </section>
  );
}
