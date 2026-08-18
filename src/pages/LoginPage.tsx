import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PhoneField } from "../components/PhoneField";
import { useAuth } from "../lib/auth";
import { validatePartnerPhone } from "../lib/phone";

export function LoginPage() {
  const { ready, partner, admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  if (!ready) {
    return null;
  }

  if (admin) {
    return <Navigate to="/admin/partners" replace />;
  }

  if (partner) {
    return <Navigate to="/cabinet" replace />;
  }

  function validatePhoneField(nextPhone = phone): boolean {
    const phoneResult = validatePartnerPhone(nextPhone);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.message);
      return false;
    }
    setPhoneError("");
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const phoneResult = validatePartnerPhone(phone);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.message);
      return;
    }
    setPhoneError("");

    if (!password.trim()) {
      setFormError("Введите пароль");
      return;
    }

    setPending(true);
    const result = await login(phoneResult.canonical, password);
    setPending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    navigate("/cabinet", { replace: true });
  }

  return (
    <AuthLayout title="Вход в кабинет">
      {registered && (
        <p className="banner banner--ok" role="status">
          Заявка отправлена. После одобрения вход: телефон и пароль 111111.
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <PhoneField
          label="Логин"
          value={phone}
          onChange={(value) => {
            setPhone(value);
            if (phoneError) {
              validatePhoneField(value);
            }
          }}
          onBlur={() => {
            if (phone) {
              validatePhoneField();
            }
          }}
          error={phoneError}
        />

        <div className={`field ${formError && !phoneError ? "field--invalid" : ""}`}>
          <label htmlFor="password">Пароль</label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFormError("");
              }}
              placeholder="111111"
            />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? "Скрыть" : "Показать"}
            </button>
          </div>
          {formError && (
            <p className="field__error" role="alert">
              {formError}
            </p>
          )}
        </div>

        <button type="submit" className="primary-btn" disabled={pending}>
          {pending ? "Входим…" : "Войти"}
        </button>

        <Link to="/register" className="secondary-btn">
          Регистрация партнёра
        </Link>
        <Link to="/admin" className="text-link">
          Вход для сотрудников
        </Link>
      </form>
    </AuthLayout>
  );
}
