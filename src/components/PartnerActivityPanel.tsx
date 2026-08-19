import { useMemo, useState } from "react";
import { formatLeasingApplicationNo } from "../lib/application-no";
import { formatDate } from "../lib/format";
import { formatAmountByn, formatPercent } from "../lib/money";
import {
  ACTIVITY_RANGES,
  activityBars,
  filterByActivityPeriod,
  partnerKpis,
  type ActivityRange,
} from "../lib/partner-insights";
import { LEASING_STATUS_LABEL } from "../lib/leasing-status";
import type { LeasingApplication } from "../lib/leasing";

type PartnerActivityPanelProps = {
  applications: LeasingApplication[];
};

export function PartnerActivityPanel({ applications }: PartnerActivityPanelProps) {
  const [range, setRange] = useState<ActivityRange>("3m");
  const now = useMemo(() => {
    const today = Date.now();
    const latest = applications.reduce((max, item) => {
      const time = new Date(item.createdAt).getTime();
      return Number.isFinite(time) && time > max ? time : max;
    }, today);
    return new Date(latest);
  }, [applications]);
  const kpis = useMemo(() => partnerKpis(applications), [applications]);
  const bars = useMemo(() => activityBars(applications, range, now), [applications, now, range]);
  const rows = useMemo(
    () =>
      filterByActivityPeriod(applications, range, now).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [applications, now, range],
  );
  const maxBar = Math.max(...bars.map((item) => item.value), 1);

  return (
    <div className="partner-activity">
      <div className="partner-kpi">
        <article className="stat-card">
          <p className="stat-card__label">Заявки</p>
          <p className="stat-card__value">{kpis.applications}</p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Сделки</p>
          <p className="stat-card__value">{kpis.deals}</p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Конверсия</p>
          <p className="stat-card__value">{formatPercent(kpis.conversion)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Финансирование</p>
          <p className="stat-card__value stat-card__value--compact">{formatAmountByn(kpis.financing)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Средний чек</p>
          <p className="stat-card__value stat-card__value--compact">{formatAmountByn(kpis.averageCheck)}</p>
        </article>
      </div>

      <section className="activity-panel">
        <div className="activity-panel__head">
          <h2>График активности</h2>
          <div className="activity-range" role="tablist" aria-label="Период графика">
            {ACTIVITY_RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={range === item.key}
                className={`activity-range__btn${range === item.key ? " is-active" : ""}`}
                onClick={() => setRange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="activity-chart" role="img" aria-label="Продажи за период">
          {bars.map((bar) => (
            <div key={bar.key} className="activity-chart__col">
              <div className="activity-chart__track">
                <div
                  className="activity-chart__bar"
                  style={{ height: `${Math.max(4, (bar.value / maxBar) * 100)}%` }}
                  title={formatAmountByn(bar.value)}
                />
              </div>
              <span>{bar.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="partner-apps">
        <h2>Заявки</h2>
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Заявка</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>Нет заявок за выбранный период</td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Заявка">{formatLeasingApplicationNo(item.seq, item.createdAt)}</td>
                    <td data-label="Клиент">{item.contactName || "—"}</td>
                    <td data-label="Сумма">{item.amount || "—"}</td>
                    <td data-label="Статус">
                      <span className={`status-pill status-pill--${item.status}`}>
                        {LEASING_STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td data-label="Дата">
                      <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
