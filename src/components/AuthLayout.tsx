import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";

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
        <Link to="/" className="logo">
          <BrandMark />
          <span className="logo__text">Кабинет партнёра</span>
        </Link>
        <div className="auth-brand__copy">
          <p className="auth-brand__kicker">Партнёрская программа</p>
          <h2>Всё сотрудничество — в одном кабинете</h2>
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
          <Link to="/" className="logo logo--mobile">
            <BrandMark />
            <span className="logo__text">Кабинет партнёра</span>
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
