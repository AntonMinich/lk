export type HistoryEvent = {
  id: string;
  at: string;
  actor: string;
  text: string;
};

export function createHistoryEvent(input: {
  at?: string;
  actor?: string;
  text: string;
}): HistoryEvent {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    at: input.at ?? new Date().toISOString(),
    actor: input.actor ?? "",
    text: input.text,
  };
}

export function createdHistoryEvent(createdAt: string): HistoryEvent {
  return {
    id: `created-${createdAt}`,
    at: createdAt,
    actor: "",
    text: "Заявка поступила",
  };
}

export function ensureHistory(
  history: HistoryEvent[] | undefined,
  createdAt: string,
): HistoryEvent[] {
  if (Array.isArray(history) && history.length > 0) {
    return history;
  }
  return [createdHistoryEvent(createdAt)];
}
