import { Navigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../lib/auth";
import { formatPhoneDisplay } from "../lib/phone";

export function CabinetPage() {
  const { ready, partner, logout } = useAuth();

  if (!ready) {
    return null;
  }

  if (!partner) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="cabinet">
      <header className="cabinet__bar">
        <div className="logo">
          <BrandMark />
          <span className="logo__text">Кабинет партнёра</span>
        </div>
        <div className="cabinet__user">
          <span>{formatPhoneDisplay(partner.phone)}</span>
          <button type="button" className="ghost-btn" onClick={() => void logout()}>
            Выйти
          </button>
        </div>
      </header>
      <main className="cabinet__main">
        <p className="auth-brand__kicker">Макет</p>
        <h1>Добро пожаловать{partner.contactName ? `, ${partner.contactName}` : ""}</h1>
        <p className="cabinet__lead">
          {partner.companyName ? `Организация: ${partner.companyName}. ` : ""}
          Разделы кабинета появятся на следующих экранах макета.
        </p>
      </main>
    </div>
  );
}
