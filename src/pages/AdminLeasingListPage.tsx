import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LeasingQueue } from "../components/LeasingQueue";
import { listLocalLeasingByPipeline } from "../lib/leasing";
import { LEASING_APPLICATION_FILTERS } from "../lib/leasing-status";

export function AdminLeasingListPage() {
  const navigate = useNavigate();
  const items = useMemo(() => listLocalLeasingByPipeline("application"), []);

  return (
    <LeasingQueue
      title="Заявки на лизинг"
      subtitle="Черновик, новая, в работе и анкетные данные"
      items={items}
      filters={LEASING_APPLICATION_FILTERS}
      onRowClick={(item) => navigate(`/admin/leasing/${item.id}`)}
      empty="Пока нет заявок на лизинг."
      emptyFilter="Нет заявок в этом отборе."
    />
  );
}
