import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { adminLogins } from "../lib/local-partners";
import { formatDateTime } from "../lib/format";
import type { HistoryEvent } from "../lib/history";
import { STATUS_LABEL, type ApplicationStatus } from "../lib/status";

export type AdminFormField = {
  label: string;
  value: string;
};

type AdminApplicationDetailProps = {
  title: string;
  crumbs?: { label: string; to?: string }[];
  fields: AdminFormField[];
  status: ApplicationStatus;
  manager: string;
  history: HistoryEvent[];
  historyHref: string;
  backHref: string;
  showHistory?: boolean;
  busy?: boolean;
  error?: string;
  onAccept: () => void;
  onApprove: () => void;
  onReject: () => void;
  onBlock: () => void;
  onChangeManager: (name: string) => void;
};

function Field({ label, value }: AdminFormField) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="text" readOnly value={value || "—"} />
    </div>
  );
}

const MANAGERS = adminLogins();

export function AdminApplicationDetail({
  title,
  crumbs,
  fields,
  status,
  manager,
  history,
  historyHref,
  backHref,
  showHistory = false,
  busy = false,
  error = "",
  onAccept,
  onApprove,
  onReject,
  onBlock,
  onChangeManager,
}: AdminApplicationDetailProps) {
  const defaultManager = MANAGERS.find((item) => item !== manager) ?? MANAGERS[0] ?? "";
  const [editingManager, setEditingManager] = useState(false);
  const [managerDraft, setManagerDraft] = useState(defaultManager);

  const canAccept = status === "pending" || status === "rejected";
  const canApprove = status === "accepted";
  const canReject = status === "pending" || status === "accepted";
  const canChangeManager = Boolean(manager) || status === "accepted";

  function handleManagerSubmit(event: FormEvent) {
    event.preventDefault();
    onChangeManager(managerDraft);
    setEditingManager(false);
  }

  const actions: ReactNode = (
    <>
      {canAccept ? (
        <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onAccept}>
          Принять
        </button>
      ) : null}
      {canApprove ? (
        <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onApprove}>
          Одобрить
        </button>
      ) : null}
      {canReject ? (
        <button type="button" className="action-btn action-btn--reject" disabled={busy} onClick={onReject}>
          Отклонить
        </button>
      ) : null}
      {status === "approved" ? (
        <button type="button" className="action-btn action-btn--reject" disabled={busy} onClick={onBlock}>
          Заблокировать
        </button>
      ) : null}
      {status === "blocked" ? (
        <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onApprove}>
          Активировать
        </button>
      ) : null}
    </>
  );

  const historyRows = [...history].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="admin-detail">
      <section className="admin-detail__form">
        {crumbs && crumbs.length > 0 ? (
          <nav className="breadcrumbs">
            {crumbs.map((item, index) => (
              <span key={`${item.label}-${index}`}>
                {index > 0 ? <span className="breadcrumbs__sep">/</span> : null}
                {item.to ? (
                  <Link to={item.to} className="breadcrumbs__link">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1>{showHistory ? "История" : title}</h1>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        {showHistory ? (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Сотрудник</th>
                  <th>Событие</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Дата и время">
                      <time dateTime={item.at}>{formatDateTime(item.at)}</time>
                    </td>
                    <td data-label="Сотрудник">{item.actor || "—"}</td>
                    <td data-label="Событие">{item.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-form-grid">
            {fields.map((field) => (
              <Field key={field.label} {...field} />
            ))}
            <Field label="Статус" value={STATUS_LABEL[status]} />
          </div>
        )}
      </section>
      <aside className="admin-actions">
        <p className="admin-actions__title">Ответственный менеджер</p>
        <p className="admin-actions__manager">{manager || "Не назначен"}</p>
        {canChangeManager ? (
          editingManager ? (
            <form className="admin-actions__form" onSubmit={handleManagerSubmit}>
              <label className="admin-actions__select-label" htmlFor="manager-select">
                Менеджер
              </label>
              <select
                id="manager-select"
                value={managerDraft}
                onChange={(event) => setManagerDraft(event.target.value)}
              >
                {MANAGERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <button type="submit" className="action-btn action-btn--approve" disabled={busy}>
                Сохранить
              </button>
              <button
                type="button"
                className="action-btn action-btn--ghost"
                onClick={() => {
                  setEditingManager(false);
                  setManagerDraft(defaultManager);
                }}
              >
                Отмена
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="action-btn action-btn--ghost"
              disabled={busy}
              onClick={() => {
                setManagerDraft(defaultManager);
                setEditingManager(true);
              }}
            >
              Сменить менеджера
            </button>
          )
        ) : null}
        <p className="admin-actions__title">Решение</p>
        {actions}
        {showHistory ? (
          <Link to={backHref} className="admin-actions__link">
            К заявке
          </Link>
        ) : (
          <Link to={historyHref} className="admin-actions__link">
            История
          </Link>
        )}
      </aside>
    </div>
  );
}
