import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LeasingQueue } from "../components/LeasingQueue";
import { useAuth } from "../lib/auth";
import { listLocalLeasingByPartnerPipeline } from "../lib/leasing";
import { LEASING_APPLICATION_FILTERS } from "../lib/leasing-status";

export function CabinetPage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const created = Boolean((location.state as { created?: boolean } | null)?.created);
  const items = useMemo(
    () => (partner ? listLocalLeasingByPartnerPipeline(partner.id, "application") : []),
    [partner],
  );

  if (!partner) {
    return null;
  }

  return (
    <LeasingQueue
      title="Мои заявки"
      subtitle={`${items.length} заявок на лизинг`}
      banner={
        created ? (
          <p className="banner banner--ok" role="status">
            Заявка отправлена. Её можно отслеживать в списке ниже.
          </p>
        ) : null
      }
      items={items}
      filters={LEASING_APPLICATION_FILTERS}
      onRowClick={(item) => navigate(`/cabinet/applications/${item.id}`)}
      empty="Пока нет заявок. Нажмите «Создать заявку»."
      emptyFilter="Нет заявок в этом отборе."
      showCompany={false}
      showPhone={false}
    />
  );
}
