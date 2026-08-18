import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PhoneField } from "../components/PhoneField";
import { useAuth } from "../lib/auth";
import { validatePartnerPhone } from "../lib/phone";

export function LoginPage() {
  const { partner, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");

  if (partner) {
    return <Navigate to="/cabinet" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const result = login(phoneResult.canonical, password);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    navigate("/cabinet", { replace: true });
  }

  return (
    <AuthLayout
      title="Вход в кабинет"
      subtitle="Укажите номер телефона и пароль, выданные при подключении."
      footer={
        <p className="auth-alt">
          Ещё не партнёр?{" "}
          <Link to="/register" className="link-button">
            Регистрация партнёра
          </Link>
        </p>
      }
    >
      {registered && (
        <p className="banner banner--ok" role="status">
          Заявка на регистрацию принята. Войдите по номеру телефона и паролю.
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <PhoneField
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setPhoneError("");
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
              placeholder="Введите пароль"
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

        <button type="submit" className="primary-btn">
          Войти
        </button>
      </form>
    </AuthLayout>
  );
}
