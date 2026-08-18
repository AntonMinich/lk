import { useAuth } from "../lib/auth";
import { PageHeader } from "../components/ui/PageHeader";

export function AdminProfilePage() {
  const { adminName } = useAuth();

  return (
    <section className="admin-page">
      <PageHeader title="Мой профиль" subtitle="Учётная запись сотрудника FINCODE OS" />
      <div className="panel">
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
      </div>
    </section>
  );
}
