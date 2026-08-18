import type { ReactNode } from "react";
import { STATUS_LABEL, type ApplicationStatus } from "../lib/status";

export type AdminFormField = {
  label: string;
  value: string;
};

type AdminApplicationDetailProps = {
  title: string;
  fields: AdminFormField[];
  status: ApplicationStatus;
  activatedBy: string;
  busy?: boolean;
  error?: string;
  onApprove: () => void;
  onReject: () => void;
  onBlock: () => void;
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
  activatedBy,
  busy = false,
  error = "",
  onApprove,
  onReject,
  onBlock,
}: AdminApplicationDetailProps) {
  const showManager = status === "approved" || status === "blocked";

  let actions: ReactNode;
  if (status === "approved") {
    actions = (
      <button type="button" className="action-btn action-btn--reject" disabled={busy} onClick={onBlock}>
        Заблокировать
      </button>
    );
  } else if (status === "blocked") {
    actions = (
      <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onApprove}>
        Активировать
      </button>
    );
  } else {
    actions = (
      <>
        <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onApprove}>
          Одобрить
        </button>
        <button
          type="button"
          className="action-btn action-btn--reject"
          disabled={busy || status === "rejected"}
          onClick={onReject}
        >
          Отклонить
        </button>
      </>
    );
  }

  return (
    <div className="admin-detail">
      <section className="admin-detail__form">
        <h1>{title}</h1>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="admin-form-grid">
          {fields.map((field) => (
            <Field key={field.label} {...field} />
          ))}
          <Field label="Статус" value={STATUS_LABEL[status]} />
          {showManager ? <Field label="Ответственный менеджер" value={activatedBy || "—"} /> : null}
        </div>
      </section>
      <aside className="admin-actions">
        <p className="admin-actions__title">Решение</p>
        {actions}
      </aside>
    </div>
  );
}
