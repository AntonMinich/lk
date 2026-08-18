import {
  APPLICATION_FILTERS,
  countApplicationFilter,
  type ApplicationFilterKey,
  type ApplicationStatus,
} from "../lib/status";

type StatusFilterBarProps<T extends { status: ApplicationStatus }> = {
  items: T[];
  value: ApplicationFilterKey;
  onChange: (key: ApplicationFilterKey) => void;
};

export function StatusFilterBar<T extends { status: ApplicationStatus }>({
  items,
  value,
  onChange,
}: StatusFilterBarProps<T>) {
  return (
    <div className="filter-bar" role="tablist" aria-label="Отбор заявок">
      {APPLICATION_FILTERS.map((item) => {
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
            <span className="filter-card__value">{countApplicationFilter(items, item.key)}</span>
          </button>
        );
      })}
    </div>
  );
}
