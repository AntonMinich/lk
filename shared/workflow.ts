import { createHistoryEvent, type HistoryEvent } from "./history.ts";
import { STATUS_LABEL, type ApplicationStatus } from "./status.ts";

export type WorkflowState = {
  status: ApplicationStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
};

export function applyStatusChange(
  current: WorkflowState,
  status: ApplicationStatus,
  actor: string,
): WorkflowState {
  const history = [...current.history];
  const responsibleManager =
    status === "accepted" ? actor || current.responsibleManager : current.responsibleManager;
  const activatedBy = status === "approved" ? actor || current.activatedBy : current.activatedBy;
  const activatedAt = status === "approved" ? new Date().toISOString() : current.activatedAt;

  if (status === "accepted") {
    history.push(
      createHistoryEvent({
        actor,
        text: actor ? `${actor} принял заявку в работу` : "Заявка принята в работу",
      }),
    );
  } else if (status === "active") {
    history.push(
      createHistoryEvent({
        actor,
        text:
          current.status === "blocked"
            ? actor
              ? `${actor} активировал партнёра`
              : "Партнёр активирован"
            : "Партнёр активировал личный кабинет",
      }),
    );
  } else {
    history.push(
      createHistoryEvent({
        actor,
        text: `Статус: ${STATUS_LABEL[current.status]} → ${STATUS_LABEL[status]}`,
      }),
    );
  }

  return {
    status,
    responsibleManager,
    activatedBy,
    activatedAt,
    history,
  };
}

export function applyManagerChange(
  current: WorkflowState,
  manager: string,
  actor: string,
): { ok: true; state: WorkflowState } | { ok: false; message: string } {
  const name = manager.trim();
  if (!name) {
    return { ok: false, message: "Укажите ответственного менеджера" };
  }
  if (name === current.responsibleManager) {
    return { ok: true, state: current };
  }

  const text = current.responsibleManager
    ? `Ответственный менеджер: ${current.responsibleManager} → ${name}`
    : `${actor || "Менеджер"} назначил ответственного: ${name}`;

  return {
    ok: true,
    state: {
      ...current,
      responsibleManager: name,
      history: [...current.history, createHistoryEvent({ actor, text })],
    },
  };
}
