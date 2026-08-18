import { useNavigate } from "react-router-dom";
import { PartnerRegisterForm } from "../components/PartnerRegisterForm";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../lib/auth";
import { createLocalPartnerByAdmin } from "../lib/local-partners";

export function AdminCreatePartnerPage() {
  const navigate = useNavigate();
  const { adminName } = useAuth();

  return (
    <section className="admin-page">
      <PageHeader title="Создать партнёра" subtitle="Та же анкета, что и при регистрации партнёра." />
      <div className="register-card register-card--embedded">
        <PartnerRegisterForm
          submitLabel="Создать партнёра"
          cancelTo="/admin/directory"
          onSubmit={async (payload) => {
            const result = createLocalPartnerByAdmin(payload, adminName);
            if (!result.ok) {
              return result;
            }
            navigate(`/admin/directory/${result.partner.id}`, { replace: true });
            return { ok: true };
          }}
        />
      </div>
    </section>
  );
}
