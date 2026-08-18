import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { PhoneField } from "../components/PhoneField";
import { useAuth } from "../lib/auth";
import { createLocalLeasing } from "../lib/leasing";
import { extractLocalDigits, formatPhoneDisplay, validatePartnerPhone } from "../lib/phone";
import type { PublicPartner } from "../lib/api";

export function NewApplicationPage() {
  const { ready, partner, logout } = useAuth();

  if (!ready) {
    return null;
  }

  if (!partner) {
    return <Navigate to="/" replace />;
  }

  return <NewApplicationForm partner={partner} logout={logout} />;
}

function NewApplicationForm({
  partner,
  logout,
}: {
  partner: PublicPartner;
  logout: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState(partner.companyName);
  const [contactName, setContactName] = useState(partner.contactName);
  const [phone, setPhone] = useState(extractLocalDigits(partner.phone));
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  function validatePhoneField(nextPhone = phone): boolean {
    const phoneResult = validatePartnerPhone(nextPhone);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.message);
      return false;
    }
    setPhoneError("");
    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!companyName.trim()) {
      setFormError("Укажите название организации");
      return;
    }
    if (!asset.trim()) {
      setFormError("Укажите предмет лизинга");
      return;
    }
    if (!amount.trim()) {
      setFormError("Укажите сумму");
      return;
    }
    if (!termMonths.trim() || Number(termMonths) <= 0) {
      setFormError("Укажите срок в месяцах");
      return;
    }

    const phoneResult = validatePartnerPhone(phone);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.message);
      return;
    }
    setPhoneError("");

    setPending(true);
    createLocalLeasing({
      partnerId: partner.id,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: phoneResult.canonical,
      asset: asset.trim(),
      amount: amount.trim(),
      termMonths: termMonths.trim(),
    });
    setPending(false);
    navigate("/cabinet", { replace: true, state: { created: true } });
  }

  return (
    <div className="cabinet">
      <header className="cabinet__bar">
        <Link to="/cabinet" className="logo logo--wordmark">
          <BrandMark />
          <span className="logo__text">Кабинет партнёра</span>
        </Link>
        <div className="cabinet__user">
          <span>{formatPhoneDisplay(partner.phone)}</span>
          <button type="button" className="ghost-btn" onClick={() => void logout()}>
            Выйти
          </button>
        </div>
      </header>
      <main className="cabinet__main">
        <p className="auth-brand__kicker">Новая заявка</p>
        <h1>Создать заявку на лизинг</h1>
        <p className="cabinet__lead">Заполните данные. После отправки заявка появится в админке.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="lease-company">Название организации</label>
            <input
              id="lease-company"
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="ООО «Партнёр»"
            />
          </div>
          <div className="field">
            <label htmlFor="lease-contact">Контактное лицо</label>
            <input
              id="lease-contact"
              type="text"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Имя и фамилия"
            />
          </div>
          <PhoneField
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
          <div className="field">
            <label htmlFor="lease-asset">Предмет лизинга</label>
            <input
              id="lease-asset"
              type="text"
              value={asset}
              onChange={(event) => setAsset(event.target.value)}
              placeholder="Тягач, оборудование, автомобиль"
            />
          </div>
          <div className="field">
            <label htmlFor="lease-amount">Сумма</label>
            <input
              id="lease-amount"
              type="text"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="180 000 BYN"
            />
          </div>
          <div className="field">
            <label htmlFor="lease-term">Срок, мес.</label>
            <input
              id="lease-term"
              type="number"
              min={1}
              value={termMonths}
              onChange={(event) => setTermMonths(event.target.value)}
              placeholder="36"
            />
          </div>
          {formError ? (
            <p className="field__error" role="alert">
              {formError}
            </p>
          ) : null}
          <button type="submit" className="primary-btn" disabled={pending}>
            {pending ? "Отправляем…" : "Отправить заявку"}
          </button>
          <Link to="/cabinet" className="secondary-btn">
            Отмена
          </Link>
        </form>
      </main>
    </div>
  );
}
