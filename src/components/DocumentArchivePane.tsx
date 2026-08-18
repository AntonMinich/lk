import { formatDateTime, formatFileSize } from "../lib/format";
import { listArchivedDocuments } from "../lib/document-archive";
import { DocumentDownloadButton } from "./DocumentDownloadButton";

type DocumentArchivePaneProps = {
  partnerId: string;
};

export function DocumentArchivePane({ partnerId }: DocumentArchivePaneProps) {
  const items = listArchivedDocuments(partnerId);

  if (items.length === 0) {
    return <p className="admin-docs__empty">Архив пуст. Заменённые документы появятся здесь.</p>;
  }

  return (
    <ul className="admin-docs__list">
      {items.map((item) => (
        <li key={item.id} className="admin-docs__item">
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
            <span>
              {item.actor || "Сотрудник"} · {formatDateTime(item.archivedAt)}
            </span>
          </span>
          <DocumentDownloadButton storageKey={item.storageKey} fileName={item.fileName} />
        </li>
      ))}
    </ul>
  );
}
