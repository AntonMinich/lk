import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="page-header__sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number; tone?: "default" | "warning" | "success" | "danger" }[];
}) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <div className="stat-card__label">{item.label}</div>
          <div className={`stat-card__value${item.tone ? ` is-${item.tone}` : ""}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DemoChip() {
  return (
    <span className="demo-chip" title="Сейчас используются тестовые данные.">
      DEMO
    </span>
  );
}
