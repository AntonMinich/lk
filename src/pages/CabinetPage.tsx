import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatPhoneDisplay } from "../lib/phone";

export function CabinetPage() {
  const { partner, logout } = useAuth();

  if (!partner) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="cabinet">
      <header className="cabinet__bar">
        <div className="logo">
          <span className="logo__mark">LK</span>
          <span className="logo__text">Кабинет партнёра</span>
        </div>
        <div className="cabinet__user">
          <span>{formatPhoneDisplay(partner.phone)}</span>
          <button type="button" className="ghost-btn" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <main className="cabinet__main">
        <p className="auth-brand__kicker">Макет</p>
        <h1>Добро пожаловать{partner.contactName ? `, ${partner.contactName}` : ""}</h1>
        <p className="cabinet__lead">
          {partner.companyName !== "Партнёр"
            ? `Организация: ${partner.companyName}. `
            : ""}
          Разделы кабинета появятся на следующих экранах макета.
        </p>
      </main>
    </div>
  );
}
