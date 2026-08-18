import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth";
import { ADMIN_DEMO } from "../lib/local-partners";

export function AdminLoginPage() {
  const { ready, admin, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  if (!ready) {
    return null;
  }

  if (admin) {
    return <Navigate to="/admin/partners" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!login.trim() || !password) {
      setFormError("Введите логин и пароль");
      return;
    }

    setPending(true);
    const result = await loginAdmin(login, password);
    setPending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    navigate("/admin/partners", { replace: true });
  }

  return (
    <AuthLayout
      kicker="Админка"
      title="Вход для сотрудников"
      subtitle="Одобряйте заявки партнёров и лизинга."
      footer={
        <p className="auth-alt">
          Кабинет партнёра?{" "}
          <Link to="/" className="link-button">
            Войти как партнёр
          </Link>
        </p>
      }
    >
      <p className="banner banner--ok" role="note">
        Демо: логин <strong>{ADMIN_DEMO.login}</strong>, пароль <strong>{ADMIN_DEMO.password}</strong>
      </p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="admin-login">Логин</label>
          <input
            id="admin-login"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="admin"
          />
        </div>
        <div className={`field ${formError ? "field--invalid" : ""}`}>
          <label htmlFor="admin-password">Пароль</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError("");
            }}
            placeholder="Пароль"
          />
          {formError && (
            <p className="field__error" role="alert">
              {formError}
            </p>
          )}
        </div>
        <button type="submit" className="primary-btn" disabled={pending}>
          {pending ? "Входим…" : "Войти в админку"}
        </button>
      </form>
    </AuthLayout>
  );
}
