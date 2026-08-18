import { digitsOnly } from "./phone.ts";

export const UNP_LENGTH = 9;

export function validateUnp(value: string): { ok: true; value: string } | { ok: false; message: string } {
  const digits = digitsOnly(value);
  if (!digits) {
    return { ok: false, message: "Укажите УНП" };
  }
  if (digits.length !== UNP_LENGTH) {
    return { ok: false, message: "УНП состоит из 9 цифр" };
  }
  return { ok: true, value: digits };
}

export function validateEmail(value: string): { ok: true; value: string } | { ok: false; message: string } {
  const email = value.trim();
  if (!email) {
    return { ok: false, message: "Укажите email" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Укажите корректный email" };
  }
  return { ok: true, value: email };
}

export type PartnerDocumentKey = "agreement" | "registration" | "charter";

export type PartnerDocument = {
  key: PartnerDocumentKey;
  fileName: string;
  size: number;
  mime: string;
};

export const PARTNER_DOCUMENT_LABEL: Record<PartnerDocumentKey, string> = {
  agreement: "Подписанное Соглашение о сотрудничестве",
  registration: "Свидетельство о государственной регистрации",
  charter: "Устав организации",
};

export const REQUIRED_DOCUMENT_KEYS: PartnerDocumentKey[] = ["agreement", "registration", "charter"];

export function isPartnerDocumentKey(value: string): value is PartnerDocumentKey {
  return REQUIRED_DOCUMENT_KEYS.includes(value as PartnerDocumentKey);
}

export function partnerDocumentLabel(key: string): string {
  return isPartnerDocumentKey(key) ? PARTNER_DOCUMENT_LABEL[key] : key;
}

export function sanitizePartnerDocuments(raw: unknown): PartnerDocument[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const documents: PartnerDocument[] = [];
  for (const item of raw.slice(0, REQUIRED_DOCUMENT_KEYS.length)) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const key = String(record.key ?? "");
    const fileName = String(record.fileName ?? "").trim().slice(0, 255);
    const size = Number(record.size);
    const mime = String(record.mime ?? "").trim().slice(0, 120);
    if (!isPartnerDocumentKey(key) || !fileName) {
      continue;
    }
    documents.push({
      key,
      fileName,
      size: Number.isFinite(size) ? Math.max(0, Math.min(size, 50 * 1024 * 1024)) : 0,
      mime: mime || "application/octet-stream",
    });
  }
  return documents;
}
