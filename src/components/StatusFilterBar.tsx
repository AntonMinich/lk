import { APPLICATION_FILTERS, type ApplicationFilterKey } from "../lib/status";

export type StatusFilterTone = "blue" | "orange" | "purple" | "green" | "red" | "slate";

export type StatusFilterItem<K extends string = string> = {
  key: K;
  label: string;
  tone: StatusFilterTone;
};

type StatusFilterBarProps<T extends { status: string }, K extends string> = {
  items: T[];
  value: K;
  onChange: (key: K) => void;
  filters?: StatusFilterItem<K>[];
};

export function StatusFilterBar<T extends { status: string }, K extends string = ApplicationFilterKey>({
  items,
  value,
  onChange,
  filters,
}: StatusFilterBarProps<T, K>) {
  const list = (filters ?? (APPLICATION_FILTERS as StatusFilterItem<K>[])) as StatusFilterItem<K>[];

  function count(key: K): number {
    if (key === "all") {
      return items.length;
    }
    return items.filter((item) => item.status === key).length;
  }

  return (
    <div className="filter-bar" role="tablist" aria-label="Отбор заявок">
      {list.map((item) => {
        const selected = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`filter-card filter-card--${item.tone}${selected ? " is-active" : ""}`}
            onClick={() => onChange(item.key)}
          >
            <span className="filter-card__label">{item.label}</span>
            <span className="filter-card__value">{count(item.key)}</span>
          </button>
        );
      })}
    </div>
  );
}
