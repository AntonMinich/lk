import { LEASING_STATUS_LABEL, normalizeLeasingStatus } from "./leasing-status.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(LEASING_STATUS_LABEL.in_work, "В работе", "in work");
assertEqual(LEASING_STATUS_LABEL.completed, "Завершено", "completed");
assertEqual(LEASING_STATUS_LABEL.waiting_originals, "Ожидание оригиналов", "originals");
assertEqual(normalizeLeasingStatus("pending"), "in_work", "pending maps");
assertEqual(normalizeLeasingStatus("accepted"), "in_work", "accepted maps");
assertEqual(normalizeLeasingStatus("approved"), "waiting_originals", "approved maps");
assertEqual(normalizeLeasingStatus("active"), "completed", "active maps");
assertEqual(normalizeLeasingStatus("completed"), "completed", "keeps completed");

console.log("leasing-status checks passed");
