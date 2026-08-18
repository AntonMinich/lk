import { Link, Navigate, useNavigate } from "react-router-dom";
import { OsMark } from "../components/OsMark";
import { PartnerRegisterForm } from "../components/PartnerRegisterForm";
import { DemoChip } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { PARTNER_PASSWORD } from "../lib/partner-password";

export function RegisterPage() {
  const { ready, partner, register } = useAuth();
  const navigate = useNavigate();

  if (!ready) {
    return null;
  }

  if (partner) {
    return <Navigate to="/cabinet" replace />;
  }

  return (
    <div className="register-shell">
      <header className="register-bar">
        <Link to="/" className="os-mark-link">
          <OsMark subtitle="Регистрация партнёра" />
        </Link>
        <div className="register-bar__tools">
          <DemoChip />
          <Link to="/" className="secondary-btn">
            Ко входу
          </Link>
        </div>
      </header>
      <main className="register-main">
        <div className="register-card">
          <h1>Регистрация партнера</h1>
          <p className="register-lead">Заполните информацию и приложите обязательные документы.</p>
          <PartnerRegisterForm
            submitLabel="Отправить заявку"
            cancelTo="/"
            cancelLabel="Отмена"
            onSubmit={async (payload) => {
              const result = await register({
                ...payload,
                password: PARTNER_PASSWORD,
              });
              if (result.ok) {
                navigate("/", { replace: true, state: { registered: true } });
                return { ok: true };
              }
              return result;
            }}
          />
        </div>
      </main>
    </div>
  );
}
