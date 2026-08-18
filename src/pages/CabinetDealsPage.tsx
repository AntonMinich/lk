import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LeasingQueue } from "../components/LeasingQueue";
import { useAuth } from "../lib/auth";
import { listLocalLeasingByPartnerPipeline } from "../lib/leasing";
import { LEASING_DEAL_FILTERS } from "../lib/leasing-status";

export function CabinetDealsPage() {
  const { partner } = useAuth();
  const navigate = useNavigate();
  const items = useMemo(
    () => (partner ? listLocalLeasingByPartnerPipeline(partner.id, "deal") : []),
    [partner],
  );

  if (!partner) {
    return null;
  }

  return (
    <LeasingQueue
      title="Сделки"
      subtitle={`${items.length} сделок`}
      items={items}
      filters={LEASING_DEAL_FILTERS}
      onRowClick={(item) => navigate(`/cabinet/deals/${item.id}`)}
      empty="Пока нет сделок. Они появляются после статуса «Анкетные данные»."
      emptyFilter="Нет сделок в этом отборе."
      showCompany={false}
      showPhone={false}
    />
  );
}
