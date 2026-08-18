import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
};

type AdminApplicationTableProps<T extends { id: string }> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  empty: string;
  onRowClick?: (item: T) => void;
};

export function AdminApplicationTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  onRowClick,
}: AdminApplicationTableProps<T>) {
  if (rows.length === 0) {
    return <p className="admin-empty">{empty}</p>;
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr
              key={item.id}
              className={onRowClick ? "admin-table__row--click" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(item);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
