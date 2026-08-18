import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../lib/auth";
import { formatPhoneDisplay } from "../lib/phone";

const NAV = [
  { to: "/cabinet/applications", label: "Мои заявки" },
  { to: "/cabinet/calculator", label: "Калькулятор" },
];

export function CabinetGate() {
  const { ready, partner } = useAuth();

  if (!ready) {
    return null;
  }

  if (!partner) {
    return <Navigate to="/" replace />;
  }

  return <CabinetLayout />;
}

export function CabinetLayout() {
  const { partner, logout } = useAuth();
  const location = useLocation();

  if (!partner) {
    return <Navigate to="/" replace />;
  }

  const creating = location.pathname === "/cabinet/applications/new";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <BrandMark />
          <p className="admin-sidebar__kicker">Кабинет партнёра</p>
        </div>
        <nav className="admin-nav" aria-label="Разделы кабинета">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "admin-nav__link is-active" : "admin-nav__link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <header className="admin-header cabinet-header">
        {creating ? null : (
          <Link to="/cabinet/applications/new" className="primary-btn cabinet__create">
            Создать заявку
          </Link>
        )}
        <div className="admin-header__tools">
          <NotificationBell
            audience="partner"
            partnerId={partner.id}
            allHref="/cabinet/notifications"
          />
          <UserMenu
            name={partner.contactName || partner.companyName || "Партнёр"}
            role={formatPhoneDisplay(partner.phone)}
            items={[{ label: "Выйти", danger: true, onClick: () => void logout() }]}
          />
        </div>
      </header>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
