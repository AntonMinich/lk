import { useMemo, useState } from "react";
import {
  filterPartnerUsers,
  goodsSourceLabel,
  OUTLET_STATUS_LABEL,
  PARTNER_USER_FILTERS,
  PARTNER_USER_STATUS_LABEL,
  PARTNER_USER_STATUS_TONE,
  type PartnerProfile,
  type PartnerUserFilterKey,
} from "../lib/partner-profile";
import { formatPhoneDisplay } from "../lib/phone";

type PartnerProfilePanelProps = {
  profile: PartnerProfile;
  slot: "before-docs" | "after-docs";
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-fact">
      <span className="admin-fact__label">{label}</span>
      <span className="admin-fact__value">{value || "—"}</span>
    </div>
  );
}

function UsersSection({ profile }: { profile: PartnerProfile }) {
  const [filter, setFilter] = useState<PartnerUserFilterKey>("all");
  const rows = useMemo(() => filterPartnerUsers(profile.users, filter), [filter, profile.users]);

  return (
    <section className="partner-profile-section" id="partner-users">
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
                <tr key={item.id}>
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

function FinancingSection({ profile }: { profile: PartnerProfile }) {
  const terms = profile.financing;
  return (
    <section className="partner-profile-section" id="partner-financing">
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

function OutletsSection({ profile }: { profile: PartnerProfile }) {
  return (
    <section className="partner-profile-section" id="partner-outlets">
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

function SettingsSection({ profile }: { profile: PartnerProfile }) {
  const settings = profile.settings;
  return (
    <section className="partner-profile-section" id="partner-settings">
      <h2>Настройка контрагента</h2>
      <div className="admin-facts">
        <Fact label="Источник товаров" value={goodsSourceLabel(settings.goodsSource)} />
        <Fact label="Создание заявок" value={settings.canCreateApplications ? "Разрешено" : "Запрещено"} />
        <Fact label="Email уведомлений" value={settings.notifyEmail} />
        <Fact label="Автоотправка предложений" value={settings.autoSendOffers ? "Включена" : "Выключена"} />
        <Fact label="Код интеграции" value={settings.integrationCode} />
        <Fact label="Синхронизация остатков" value={settings.stockSync ? "Включена" : "Выключена"} />
        <Fact label="Комментарий" value={settings.comment} />
      </div>
    </section>
  );
}

export function PartnerProfilePanel({ profile, slot }: PartnerProfilePanelProps) {
  if (slot === "before-docs") {
    return (
      <>
        <UsersSection profile={profile} />
        <FinancingSection profile={profile} />
      </>
    );
  }

  return (
    <>
      <OutletsSection profile={profile} />
      <SettingsSection profile={profile} />
    </>
  );
}
