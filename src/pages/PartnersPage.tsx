import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../lib/auth";
import { formatPhoneDisplay } from "../lib/phone";
import type { PublicPartner } from "../lib/api";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("ru-BY");
}

export function PartnersPage() {
  const { ready, apiOnline, listPartners } = useAuth();
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }
    void listPartners()
      .then(setPartners)
      .catch((item: unknown) => {
        setError(item instanceof Error ? item.message : "Не удалось загрузить заявки");
      });
  }, [listPartners, ready]);

  if (!ready) {
    return null;
  }

  return (
    <div className="cabinet">
      <header className="cabinet__bar">
        <Link to="/" className="logo logo--wordmark">
          <BrandMark />
          <span className="logo__text">Заявки партнёров</span>
        </Link>
        <Link to="/" className="ghost-btn">
          Ко входу
        </Link>
      </header>
      <main className="cabinet__main cabinet__main--wide">
        <p className="auth-brand__kicker">Бэкенд</p>
        <h1>Зарегистрированные партнёры</h1>
        <p className="cabinet__lead">
          {apiOnline
            ? "Список из сервера API. Пароли не показываются."
            : "Сервер API сейчас недоступен, поэтому показаны заявки, сохранённые в этом браузере."}
        </p>
        {error ? <p className="field__error">{error}</p> : null}
        {partners.length === 0 && !error ? (
          <p className="cabinet__lead">Пока нет заявок. Отправьте регистрацию партнёра.</p>
        ) : (
          <div className="table-wrap">
            <table className="partners-table">
              <thead>
                <tr>
                  <th>Телефон</th>
                  <th>Организация</th>
                  <th>Контакт</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((item) => (
                  <tr key={item.id}>
                    <td>{formatPhoneDisplay(item.phone)}</td>
                    <td>{item.companyName || "—"}</td>
                    <td>{item.contactName || "—"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
