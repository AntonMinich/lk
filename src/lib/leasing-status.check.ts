import {
  LEASING_STATUS_LABEL,
  normalizeLeasingPipeline,
  normalizeLeasingStatus,
} from "./leasing-status.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(LEASING_STATUS_LABEL.draft, "Черновик", "draft");
assertEqual(LEASING_STATUS_LABEL.new, "Новая", "new");
assertEqual(LEASING_STATUS_LABEL.questionnaire, "Анкетные данные", "questionnaire");
assertEqual(LEASING_STATUS_LABEL.document_prep, "Подготовка документов", "prep");
assertEqual(LEASING_STATUS_LABEL.signing, "Подписание документов", "signing");
assertEqual(LEASING_STATUS_LABEL.cancelled, "Отменено", "cancelled");
assertEqual(normalizeLeasingStatus("pending"), "new", "pending maps to new");
assertEqual(normalizeLeasingStatus("accepted"), "in_work", "accepted maps");
assertEqual(normalizeLeasingStatus("approved"), "questionnaire", "approved maps");
assertEqual(normalizeLeasingStatus("blocked"), "cancelled", "blocked maps");
assertEqual(normalizeLeasingStatus("rejected"), "cancelled", "rejected maps");
assertEqual(normalizeLeasingPipeline("waiting_originals"), "deal", "originals are deals");
assertEqual(normalizeLeasingPipeline("questionnaire"), "application", "questionnaire is application");
assertEqual(normalizeLeasingPipeline("cancelled", "deal"), "deal", "cancelled keeps deal pipeline");

console.log("leasing-status checks passed");
