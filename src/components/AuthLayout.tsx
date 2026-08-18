import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { BRAND_SLOGAN } from "../lib/brand";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand__glow" />
        <div className="auth-brand__top">
          <Link to="/" className="logo logo--wordmark">
            <BrandMark />
          </Link>
        </div>
        <div className="auth-brand__copy">
          <p className="auth-brand__kicker">Кабинет партнёра</p>
          <h2>Лизинг и партнёрство в одном окне</h2>
          <p className="logo__slogan">{BRAND_SLOGAN}</p>
          <p>
            Входите по номеру телефона в формате Беларуси: код страны 375, оператор 29, 33 или 44 и
            семь цифр клиента.
          </p>
        </div>
        <ul className="auth-brand__points">
          <li>Заявки и статус обработки</li>
          <li>Вознаграждения и выплаты</li>
          <li>Документы и реквизиты</li>
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="logo logo--mobile logo--wordmark">
            <BrandMark />
          </Link>
          <h1>{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}
