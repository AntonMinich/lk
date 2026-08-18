import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../lib/format";
import type { HistoryEvent } from "../lib/history";
import { STATUS_LABEL, type ApplicationStatus } from "../lib/status";

export type AdminFormField = {
  label: string;
  value: string;
};

type AdminApplicationDetailProps = {
  title: string;
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

export function AdminApplicationDetail({
  title,
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
  const [editingManager, setEditingManager] = useState(false);
  const [managerDraft, setManagerDraft] = useState(manager);

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

  return (
    <div className="admin-detail">
      <section className="admin-detail__form">
        <h1>{showHistory ? "История" : title}</h1>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        {showHistory ? (
          <ol className="history-list">
            {[...history]
              .sort((a, b) => a.at.localeCompare(b.at))
              .map((item) => (
                <li key={item.id} className="history-list__item">
                  <time dateTime={item.at}>{formatDateTime(item.at)}</time>
                  <p>{item.text}</p>
                </li>
              ))}
          </ol>
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
              <input
                value={managerDraft}
                onChange={(event) => setManagerDraft(event.target.value)}
                placeholder="Имя менеджера"
                autoComplete="off"
              />
              <button type="submit" className="action-btn action-btn--approve" disabled={busy}>
                Сохранить
              </button>
              <button
                type="button"
                className="action-btn action-btn--ghost"
                onClick={() => {
                  setEditingManager(false);
                  setManagerDraft(manager);
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
                setManagerDraft(manager);
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
