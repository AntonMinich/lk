import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  filterPartnerUsers,
  OUTLET_STATUS_LABEL,
  PARTNER_USER_FILTERS,
  PARTNER_USER_STATUS_LABEL,
  PARTNER_USER_STATUS_TONE,
  type PartnerProfile,
  type PartnerUserFilterKey,
} from "../lib/partner-profile";
import { formatPhoneDisplay } from "../lib/phone";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-fact">
      <span className="admin-fact__label">{label}</span>
      <span className="admin-fact__value">{value || "—"}</span>
    </div>
  );
}

export function PartnerUsersSection({
  profile,
  userHref,
}: {
  profile: PartnerProfile;
  userHref: (userId: string) => string;
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PartnerUserFilterKey>("all");
  const rows = useMemo(() => filterPartnerUsers(profile.users, filter), [filter, profile.users]);

  return (
    <section className="partner-profile-section">
      <div className="partner-profile-section__head">
        <h2>Пользователи</h2>
        <label className="partner-profile-filter">
          <span>Статус пользователя</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as PartnerUserFilterKey)}>
            {PARTNER_USER_FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Роль</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>Нет пользователей с выбранным статусом</td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.id}
                  className="admin-table__row--click"
                  tabIndex={0}
                  onClick={() => navigate(userHref(item.id))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(userHref(item.id));
                    }
                  }}
                >
                  <td data-label="ФИО">{item.fullName}</td>
                  <td data-label="Телефон">{formatPhoneDisplay(item.phone)}</td>
                  <td data-label="Роль">{item.role}</td>
                  <td data-label="Статус">
                    <span className={`status-pill status-pill--${PARTNER_USER_STATUS_TONE[item.status]}`}>
                      {PARTNER_USER_STATUS_LABEL[item.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PartnerFinancingSection({ profile }: { profile: PartnerProfile }) {
  const terms = profile.financing;
  return (
    <section className="partner-profile-section">
      <h2>Условия финансирования</h2>
      <div className="admin-facts">
        <Fact label="Минимальный аванс" value={terms.advanceMin} />
        <Fact label="Срок лизинга" value={terms.termRange} />
        <Fact label="Ставка" value={terms.rateFrom} />
        <Fact label="Валюта" value={terms.currency} />
        <Fact label="Лимит финансирования" value={terms.maxAmount} />
        <Fact label="Предмет лизинга" value={terms.subject} />
        <Fact label="Вознаграждение партнёра" value={terms.partnerFee} />
      </div>
    </section>
  );
}

export function PartnerOutletsSection({ profile }: { profile: PartnerProfile }) {
  return (
    <section className="partner-profile-section">
      <h2>Торговые точки</h2>
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Город</th>
              <th>Адрес</th>
              <th>Телефон</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {profile.pointsOfSale.length === 0 ? (
              <tr>
                <td colSpan={5}>Торговые точки не указаны</td>
              </tr>
            ) : (
              profile.pointsOfSale.map((item) => (
                <tr key={item.id}>
                  <td data-label="Название">{item.name}</td>
                  <td data-label="Город">{item.city}</td>
                  <td data-label="Адрес">{item.address}</td>
                  <td data-label="Телефон">{formatPhoneDisplay(item.phone)}</td>
                  <td data-label="Статус">
                    <span className={`status-pill status-pill--${item.status === "active" ? "active" : "rejected"}`}>
                      {OUTLET_STATUS_LABEL[item.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
