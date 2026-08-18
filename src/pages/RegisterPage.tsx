import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PhoneField } from "../components/PhoneField";
import { useAuth } from "../lib/auth";
import { validatePartnerPhone } from "../lib/phone";

export function RegisterPage() {
  const { partner, register } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");

  if (partner) {
    return <Navigate to="/cabinet" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!companyName.trim()) {
      setFormError("Укажите название организации");
      return;
    }

    const phoneResult = validatePartnerPhone(phone);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.message);
      return;
    }
    setPhoneError("");

    if (password.length < 6) {
      setFormError("Пароль должен содержать не менее 6 символов");
      return;
    }

    if (password !== passwordRepeat) {
      setFormError("Пароли не совпадают");
      return;
    }

    const result = register({
      phone: phoneResult.canonical,
      password,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
    });

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    navigate("/", { replace: true, state: { registered: true } });
  }

  return (
    <AuthLayout
      title="Регистрация партнёра"
      subtitle="Оставьте данные организации. После проверки можно будет войти в кабинет."
      footer={
        <p className="auth-alt">
          Уже есть доступ?{" "}
          <Link to="/" className="link-button">
            Войти в кабинет
          </Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="company">Название организации</label>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="ООО «Партнёр»"
          />
        </div>

        <div className="field">
          <label htmlFor="contact">Контактное лицо</label>
          <input
            id="contact"
            type="text"
            autoComplete="name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Имя и фамилия"
          />
        </div>

        <PhoneField
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setPhoneError("");
          }}
          error={phoneError}
          autoComplete="tel"
        />

        <div className="field">
          <label htmlFor="new-password">Пароль</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Не менее 6 символов"
          />
        </div>

        <div className="field">
          <label htmlFor="repeat-password">Повтор пароля</label>
          <input
            id="repeat-password"
            type="password"
            autoComplete="new-password"
            value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            placeholder="Повторите пароль"
          />
        </div>

        {formError && (
          <p className="field__error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="primary-btn">
          Отправить заявку
        </button>
      </form>
    </AuthLayout>
  );
}
