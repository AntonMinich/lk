import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FileDrop } from "../components/FileDrop";
import { OsMark } from "../components/OsMark";
import { PhoneField } from "../components/PhoneField";
import { DemoChip } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { brandAsset } from "../lib/brand";
import {
  PARTNER_DOCUMENT_LABEL,
  REQUIRED_DOCUMENT_KEYS,
  validateEmail,
  validateUnp,
  type PartnerDocument,
  type PartnerDocumentKey,
} from "../lib/partner-docs";
import { validatePartnerPhone } from "../lib/phone";

const AGREEMENT_HREF = brandAsset("docs/dogovor-o-sotrudnichestve.html");

export function RegisterPage() {
  const { ready, partner, register } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [unp, setUnp] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<Partial<Record<PartnerDocumentKey, File | null>>>({});
  const [phoneError, setPhoneError] = useState("");
  const [unpError, setUnpError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  if (!ready) {
    return null;
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

    if (!companyName.trim()) {
      setFormError("Укажите наименование юридического лица");
      return;
    }

    const unpResult = validateUnp(unp);
    if (!unpResult.ok) {
      setUnpError(unpResult.message);
      setFormError(unpResult.message);
      return;
    }
    setUnpError("");

    if (!contactName.trim()) {
      setFormError("Укажите ФИО контактного лица");
      return;
    }

    const phoneResult = validatePartnerPhone(phone);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.message);
      setFormError(phoneResult.message);
      return;
    }
    setPhoneError("");

    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      setEmailError(emailResult.message);
      setFormError(emailResult.message);
      return;
    }
    setEmailError("");

    const documents: PartnerDocument[] = [];
    for (const key of REQUIRED_DOCUMENT_KEYS) {
      const file = files[key];
      if (!file) {
        setFormError(`Приложите: ${PARTNER_DOCUMENT_LABEL[key]}`);
        return;
      }
      documents.push({
        key,
        fileName: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
      });
    }

    setPending(true);
    const result = await register({
      phone: phoneResult.canonical,
      password: unpResult.value,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      unp: unpResult.value,
      email: emailResult.value,
      documents,
    });
    setPending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    navigate("/", { replace: true, state: { registered: true } });
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
          <form className="register-form" onSubmit={handleSubmit} noValidate>
            <section className="register-section">
              <h2>1. Скачайте, ознакомьтесь и подпишите документы:</h2>
              <a className="register-doc-link" href={AGREEMENT_HREF} download="dogovor-o-sotrudnichestve.html">
                Договор о сотрудничестве
              </a>
            </section>

            <section className="register-section">
              <h2>2. Заполните информацию</h2>
              <div className="field">
                <label htmlFor="company">Наименование юридического лица</label>
                <input
                  id="company"
                  type="text"
                  autoComplete="organization"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="ООО «Партнёр»"
                />
              </div>
              <div className={`field ${unpError ? "field--invalid" : ""}`}>
                <label htmlFor="unp">УНП</label>
                <input
                  id="unp"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={unp}
                  onChange={(event) => {
                    setUnp(event.target.value.replace(/\D/g, "").slice(0, 9));
                    setUnpError("");
                  }}
                  placeholder="123456789"
                />
                {unpError ? (
                  <p className="field__error" role="alert">
                    {unpError}
                  </p>
                ) : null}
              </div>
              <div className="field">
                <label htmlFor="contact">
                  ФИО контактного лица
                  <span
                    className="field-tip"
                    title="Укажите фамилию, имя и отчество человека, с которым можно связаться по заявке."
                  >
                    ⓘ
                  </span>
                </label>
                <input
                  id="contact"
                  type="text"
                  autoComplete="name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <PhoneField
                label="Контактный номер"
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
              <div className={`field ${emailError ? "field--invalid" : ""}`}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError("");
                  }}
                  placeholder="partner@example.by"
                />
                {emailError ? (
                  <p className="field__error" role="alert">
                    {emailError}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="register-section">
              <h2>3. Загрузите сканы указанных документов:</h2>
              {REQUIRED_DOCUMENT_KEYS.map((key) => (
                <FileDrop
                  key={key}
                  label={PARTNER_DOCUMENT_LABEL[key]}
                  file={files[key] ?? null}
                  onChange={(file) => setFiles((current) => ({ ...current, [key]: file }))}
                />
              ))}
            </section>

            {formError ? (
              <p className="field__error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="register-actions">
              <Link to="/" className="secondary-btn">
                Отмена
              </Link>
              <button type="submit" className="primary-btn" disabled={pending}>
                {pending ? "Отправляем…" : "Отправить заявку"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
