import { Navigate, NavLink, Outlet } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/admin/partners", label: "Заявки на регистрацию партнера" },
  { to: "/admin/leasing", label: "Заявки на лизинг" },
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
  const { logoutAdmin } = useAuth();

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
              className={({ isActive }) =>
                isActive ? "admin-nav__link is-active" : "admin-nav__link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="ghost-btn admin-sidebar__logout" onClick={() => void logoutAdmin()}>
          Выйти
        </button>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
