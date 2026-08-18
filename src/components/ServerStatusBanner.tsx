import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ServerStatusBanner() {
  const { apiOnline } = useAuth();

  if (apiOnline) {
    return (
      <p className="banner banner--ok" role="status">
        Сервер API онлайн. Заявки партнёров одобряются в{" "}
        <Link to="/admin" className="link-button">
          админке
        </Link>
        .
      </p>
    );
  }

  return (
    <p className="banner banner--warn" role="status">
      Сервер API недоступен (GitHub Pages). Заявка сохранится в этом браузере. Одобрить её можно в{" "}
      <Link to="/admin" className="link-button">
        админке
      </Link>{" "}
      — тоже в этом же браузере.
    </p>
  );
}
