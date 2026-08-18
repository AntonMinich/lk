import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";

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
          <Link to="/" className="logo logo--wordmark auth-card__logo">
            <BrandMark />
          </Link>
          <p className="auth-brand__kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}
