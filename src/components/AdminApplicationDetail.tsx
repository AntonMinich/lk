import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DocumentDownloadButton } from "./DocumentDownloadButton";
import { adminLogins } from "../lib/local-partners";
import { formatDateTime, formatFileSize } from "../lib/format";
import type { HistoryEvent } from "../lib/history";
import { isApplicationStatus, STATUS_LABEL } from "../lib/status";
import type { PartnerDocumentKey } from "../lib/partner-docs";

export type AdminFormField = {
  label: string;
  value: string;
  tone?: string;
};

export type AdminDocumentItem = {
  label: string;
  fileName: string;
  size?: number;
  key?: string;
  phone?: string;
};

export type AdminDetailPane =
  | "main"
  | "history"
  | "archive"
  | "comments"
  | "users"
  | "user"
  | "financing"
  | "documents"
  | "outlets"
  | "settings"
  | "applications";

export type AdminDetailLink = {
  to: string;
  label: string;
  count?: number;
  active?: boolean;
};

type AdminApplicationDetailProps = {
  title: string;
  crumbs?: { label: string; to?: string }[];
  fields: AdminFormField[];
  documents?: AdminDocumentItem[];
  extraContent?: ReactNode;
  afterDocuments?: ReactNode;
  dashboards?: ReactNode;
  sectionNav?: ReactNode;
  factsTitle?: string;
  factsId?: string;
  documentsTitle?: string;
  documentsId?: string;
  showFacts?: boolean;
  showDocuments?: boolean;
  status: string;
  statusLabel?: string;
  manager: string;
  history: HistoryEvent[];
  historyHref: string;
  backHref: string;
  backLabel?: string;
  pane?: AdminDetailPane;
  extraLinks?: AdminDetailLink[];
  allowManagerChange?: boolean;
  busy?: boolean;
  error?: string;
  canReplaceDocuments?: boolean;
  onReplaceDocument?: (key: PartnerDocumentKey, file: File) => void | Promise<void>;
  decisionActions?: ReactNode;
  onAccept?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onBlock?: () => void;
  onChangeManager: (name: string) => void;
  archiveContent?: ReactNode;
  commentsContent?: ReactNode;
};

function Fact({ label, value, tone }: AdminFormField) {
  return (
    <div className="admin-fact">
      <span className="admin-fact__label">{label}</span>
      {tone ? (
        <span className={`status-pill status-pill--${tone}`}>{value || "—"}</span>
      ) : (
        <span className="admin-fact__value">{value || "—"}</span>
      )}
    </div>
  );
}

const MANAGERS = adminLogins();

function DocumentReplaceButton({
  docKey,
  busy,
  onReplace,
}: {
  docKey: PartnerDocumentKey;
  busy: boolean;
  onReplace: (key: PartnerDocumentKey, file: File) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            void onReplace(docKey, file);
          }
        }}
      />
      <button
        type="button"
        className="admin-docs__replace"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        Заменить
      </button>
    </>
  );
}

export function AdminApplicationDetail({
  title,
  crumbs,
  fields,
  documents,
  extraContent,
  afterDocuments,
  dashboards,
  sectionNav,
  factsTitle,
  factsId,
  documentsTitle = "Приложенные документы",
  documentsId,
  showFacts = true,
  showDocuments = true,
  status,
  statusLabel,
  manager,
  history,
  historyHref,
  backHref,
  backLabel = "К заявке",
  pane = "main",
  extraLinks,
  allowManagerChange,
  busy = false,
  error = "",
  canReplaceDocuments = false,
  onReplaceDocument,
  decisionActions,
  onAccept,
  onApprove,
  onReject,
  onBlock,
  onChangeManager,
  archiveContent,
  commentsContent,
}: AdminApplicationDetailProps) {
  const defaultManager = MANAGERS.find((item) => item !== manager) ?? MANAGERS[0] ?? "";
  const [editingManager, setEditingManager] = useState(false);
  const [managerDraft, setManagerDraft] = useState(defaultManager);
  const partnerStatus = isApplicationStatus(status) ? status : null;

  const canAccept = partnerStatus === "pending" || partnerStatus === "rejected";
  const canApprove = partnerStatus === "accepted" || partnerStatus === "blocked";
  const canReject = partnerStatus === "pending" || partnerStatus === "accepted";
  const canChangeManager = allowManagerChange ?? (Boolean(manager) || partnerStatus === "accepted");
  const resolvedStatusLabel = statusLabel ?? (partnerStatus ? STATUS_LABEL[partnerStatus] : status);

  function handleManagerSubmit(event: FormEvent) {
    event.preventDefault();
    onChangeManager(managerDraft);
    setEditingManager(false);
  }

  const actions: ReactNode = decisionActions ?? (
    <>
      {canAccept && onAccept ? (
        <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onAccept}>
          Принять
        </button>
      ) : null}
      {canApprove && onApprove ? (
        <button type="button" className="action-btn action-btn--approve" disabled={busy} onClick={onApprove}>
          {partnerStatus === "blocked" ? "Активировать" : "Одобрить"}
        </button>
      ) : null}
      {canReject && onReject ? (
        <button type="button" className="action-btn action-btn--reject" disabled={busy} onClick={onReject}>
          Отклонить
        </button>
      ) : null}
      {(partnerStatus === "approved" || partnerStatus === "active") && onBlock ? (
        <button type="button" className="action-btn action-btn--reject" disabled={busy} onClick={onBlock}>
          Заблокировать
        </button>
      ) : null}
    </>
  );

  const historyRows = [...history].sort((a, b) => a.at.localeCompare(b.at));
  const archiveCount = extraLinks?.find((item) => item.to.endsWith("/archive"))?.count;
  const commentsCount = extraLinks?.find((item) => item.to.endsWith("/comments"))?.count;
  const heading =
    pane === "history"
      ? `История (${history.length})`
      : pane === "archive"
        ? `Архив документов (${archiveCount ?? 0})`
        : pane === "comments"
          ? `Комментарий (${commentsCount ?? 0})`
          : title;

  return (
    <div className={`admin-detail${sectionNav ? " admin-detail--with-tabs" : ""}`}>
      {sectionNav}
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
        <h1>{heading}</h1>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        {pane === "history" ? (
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
        ) : pane === "archive" ? (
          archiveContent
        ) : pane === "comments" ? (
          commentsContent
        ) : (
          <>
            {dashboards}
            {showFacts ? (
              <section className="admin-facts-block" id={factsId}>
                {factsTitle ? <h2>{factsTitle}</h2> : null}
                <div className="admin-facts">
                  {fields.map((field) => (
                    <Fact key={field.label} {...field} />
                  ))}
                </div>
              </section>
            ) : null}
            {extraContent}
            {showDocuments && documents ? (
              <div className="admin-docs" id={documentsId}>
                {documentsTitle ? <h2>{documentsTitle}</h2> : null}
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
                        <span className="admin-docs__actions">
                          {item.phone && item.key ? (
                            <DocumentDownloadButton phone={item.phone} docKey={item.key} fileName={item.fileName} />
                          ) : null}
                          {canReplaceDocuments && onReplaceDocument && item.key ? (
                            <DocumentReplaceButton
                              docKey={item.key as PartnerDocumentKey}
                              busy={busy}
                              onReplace={onReplaceDocument}
                            />
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            {afterDocuments}
          </>
        )}
      </section>
      <aside className="admin-actions">
        <div className="admin-actions__sticky">
          {pane !== "main" ? (
            <Link to={backHref} className="admin-actions__back">
              <span aria-hidden="true">←</span>
              {backLabel}
            </Link>
          ) : null}
          <div className={`admin-status admin-status--${status}`}>
            <p className="admin-actions__title">Статус</p>
            <span className={`status-pill status-pill--${status}`}>{resolvedStatusLabel}</span>
          </div>
          <div className="admin-manager">
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
          </div>
          <p className="admin-actions__title">Решение</p>
          {actions}
          <nav className="admin-actions__nav" aria-label="Разделы заявки">
            <Link to={historyHref} className={`admin-actions__link${pane === "history" ? " is-active" : ""}`}>
              История ({history.length})
            </Link>
            {extraLinks?.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-actions__link${item.active ? " is-active" : ""}`}
              >
                {item.label}
                {typeof item.count === "number" ? ` (${item.count})` : ""}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
