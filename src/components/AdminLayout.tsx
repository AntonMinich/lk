import { Navigate, NavLink, Outlet } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { BrandMark } from "./BrandMark";
import { DemoChip } from "./ui/PageHeader";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/admin/partners", label: "Заявки на регистрацию партнера", end: true },
  { to: "/admin/leasing", label: "Заявки на лизинг" },
  { to: "/admin/deals", label: "Сделки" },
  { to: "/admin/directory", label: "Партнеры" },
  { to: "/admin/users", label: "Пользователи" },
];

export function AdminGate() {
  const { ready, admin } = useAuth();

  if (!ready) {
    return null;
  }

  if (!admin) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminLayout />;
}

export function AdminLayout() {
  const { adminName, logoutAdmin } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <BrandMark />
          <p className="admin-sidebar__kicker">Админка</p>
        </div>
        <nav className="admin-nav" aria-label="Разделы админки">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? item.to === "/admin/partners"}
              className={({ isActive }) =>
                isActive ? "admin-nav__link is-active" : "admin-nav__link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <header className="admin-header">
        <div className="admin-header__crumb">
          <span>FINCODE</span>
          <span className="admin-header__slash">/</span>
          <span>Админка</span>
        </div>
        <div className="admin-header__tools">
          <DemoChip />
          <NotificationBell audience="admin" allHref="/admin/notifications" />
          <UserMenu
            name={adminName || "admin"}
            role="Сотрудник"
            items={[
              { label: "Мой профиль", to: "/admin/profile" },
              { label: "Выйти", danger: true, onClick: () => void logoutAdmin() },
            ]}
          />
        </div>
      </header>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
