import { useAuth } from "../lib/auth";

export function AdminProfilePage() {
  const { adminName } = useAuth();

  return (
    <section className="admin-page">
      <h1>Мой профиль</h1>
      <div className="admin-form-grid">
        <div className="field">
          <label>Логин</label>
          <input type="text" readOnly value={adminName || "—"} />
        </div>
        <div className="field">
          <label>Роль</label>
          <input type="text" readOnly value="Сотрудник" />
        </div>
      </div>
    </section>
  );
}
