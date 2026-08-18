import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PhoneField } from "../components/PhoneField";
import { useAuth } from "../lib/auth";
import { createLocalLeasing } from "../lib/leasing";
import { extractLocalDigits, validatePartnerPhone } from "../lib/phone";

type Prefill = {
  amount?: string;
  termMonths?: string;
};

export function NewApplicationPage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as Prefill | null) ?? {};

  const [companyName, setCompanyName] = useState(partner?.companyName ?? "");
  const [contactName, setContactName] = useState(partner?.contactName ?? "");
  const [phone, setPhone] = useState(extractLocalDigits(partner?.phone ?? ""));
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState(prefill.amount ?? "");
  const [termMonths, setTermMonths] = useState(prefill.termMonths ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  if (!partner) {
    return null;
  }

  const currentPartner = partner;

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
      partnerId: currentPartner.id,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: phoneResult.canonical,
      asset: asset.trim(),
      amount: amount.trim(),
      termMonths: termMonths.trim(),
    });
    setPending(false);
    navigate("/cabinet/applications", { replace: true, state: { created: true } });
  }

  return (
    <section className="admin-page">
      <h1>Создать заявку на лизинг</h1>
      <p className="cabinet__lead">Заполните данные. После отправки заявка появится в списке «Мои заявки».</p>
      <form className="auth-form cabinet-form" onSubmit={handleSubmit} noValidate>
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
        <Link to="/cabinet/applications" className="secondary-btn">
          Отмена
        </Link>
      </form>
    </section>
  );
}
