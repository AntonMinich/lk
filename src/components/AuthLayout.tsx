import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { DemoChip } from "./ui/PageHeader";
import { OsMark } from "./OsMark";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  kicker = "Кабинет партнёра",
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card__top">
            <Link to="/" className="os-mark-link">
              <OsMark subtitle={kicker} />
            </Link>
            <DemoChip />
          </div>
          <h1>{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}
