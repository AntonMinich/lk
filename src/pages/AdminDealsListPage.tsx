import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LeasingQueue } from "../components/LeasingQueue";
import { listLocalLeasingByPipeline } from "../lib/leasing";
import { LEASING_DEAL_FILTERS } from "../lib/leasing-status";

export function AdminDealsListPage() {
  const navigate = useNavigate();
  const items = useMemo(() => listLocalLeasingByPipeline("deal"), []);

  return (
    <LeasingQueue
      title="Сделки"
      subtitle="После статуса «Анкетные данные» заявка переходит в сделки"
      items={items}
      filters={LEASING_DEAL_FILTERS}
      onRowClick={(item) => navigate(`/admin/deals/${item.id}`)}
      empty="Пока нет сделок."
      emptyFilter="Нет сделок в этом отборе."
    />
  );
}
