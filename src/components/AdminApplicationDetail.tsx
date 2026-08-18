import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DocumentDownloadButton } from "./DocumentDownloadButton";
import { adminLogins } from "../lib/local-partners";
import { formatDateTime, formatFileSize } from "../lib/format";
import type { HistoryEvent } from "../lib/history";
import { STATUS_LABEL, type ApplicationStatus } from "../lib/status";

export type AdminFormField = {
  label: string;
  value: string;
};

export type AdminDocumentItem = {
  label: string;
  fileName: string;
  size?: number;
  key?: string;
  phone?: string;
};

type AdminApplicationDetailProps = {
  title: string;
  crumbs?: { label: string; to?: string }[];
  fields: AdminFormField[];
  documents?: AdminDocumentItem[];
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

function Fact({ label, value }: AdminFormField) {
  return (
    <div className="admin-fact">
      <span className="admin-fact__label">{label}</span>
      <span className="admin-fact__value">{value || "—"}</span>
    </div>
  );
}

const MANAGERS = adminLogins();

export function AdminApplicationDetail({
  title,
  crumbs,
  fields,
  documents,
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
      {status === "approved" || status === "active" ? (
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
          <>
            <div className="admin-facts">
              {fields.map((field) => (
                <Fact key={field.label} {...field} />
              ))}
            </div>
            {documents ? (
              <div className="admin-docs">
                <h2>Приложенные документы</h2>
                {documents.length === 0 ? (
                  <p className="admin-docs__empty">Документы не загружены</p>
                ) : (
                  <ul className="admin-docs__list">
                    {documents.map((item) => (
                      <li key={`${item.label}-${item.fileName}`} className="admin-docs__item">
                        <span className="admin-docs__icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="18" height="18">
                            <path
                              fill="currentColor"
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L18.5 9H15ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h4v2H8V9Z"
                            />
                          </svg>
                        </span>
                        <span className="admin-docs__meta">
                          <strong>{item.label}</strong>
                          <span>
                            {item.fileName}
                            {item.size ? ` · ${formatFileSize(item.size)}` : ""}
                          </span>
                        </span>
                        {item.phone && item.key ? (
                          <DocumentDownloadButton phone={item.phone} docKey={item.key} fileName={item.fileName} />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>
      <aside className="admin-actions">
        <div className={`admin-status admin-status--${status}`}>
          <p className="admin-actions__title">Статус</p>
          <span className={`status-pill status-pill--${status}`}>{STATUS_LABEL[status]}</span>
        </div>
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
            История ({history.length})
          </Link>
        )}
      </aside>
    </div>
  );
}
