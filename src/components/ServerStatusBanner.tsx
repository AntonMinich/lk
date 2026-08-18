import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ServerStatusBanner() {
  const { apiOnline } = useAuth();

  if (apiOnline) {
    return (
      <p className="banner banner--ok" role="status">
        Сервер API онлайн. Заявки смотрите в{" "}
        <Link to="/partners" className="link-button">
          списке партнёров
        </Link>
        .
      </p>
    );
  }

  return (
    <p className="banner banner--warn" role="status">
      Сервер API недоступен (GitHub Pages или нет бэкенда). Заявки сохраняются в этом браузере.{" "}
      <Link to="/partners" className="link-button">
        Открыть список
      </Link>
    </p>
  );
}
