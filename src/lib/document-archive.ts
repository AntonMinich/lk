import type { PartnerDocumentKey } from "./partner-docs.ts";
import { partnerDocumentLabel } from "./partner-docs.ts";

export type ArchivedDocument = {
  id: string;
  partnerId: string;
  phone: string;
  docKey: PartnerDocumentKey | string;
  label: string;
  fileName: string;
  size: number;
  mime: string;
  archivedAt: string;
  actor: string;
  storageKey: string;
};

const ARCHIVE_KEY = "lk-document-archive";

function readAll(): ArchivedDocument[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ArchivedDocument[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item && typeof item.id === "string" && typeof item.partnerId === "string");
  } catch {
    return [];
  }
}

function writeAll(items: ArchivedDocument[]) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
}

export function archiveStorageKey(phone: string, docKey: string, archiveId: string): string {
  return `${phone}:${docKey}:archive:${archiveId}`;
}

export function listArchivedDocuments(partnerId: string): ArchivedDocument[] {
  return readAll()
    .filter((item) => item.partnerId === partnerId)
    .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
}

export function countArchivedDocuments(partnerId: string): number {
  return listArchivedDocuments(partnerId).length;
}

export function addArchivedDocument(input: {
  partnerId: string;
  phone: string;
  docKey: string;
  fileName: string;
  size: number;
  mime: string;
  actor: string;
}): ArchivedDocument {
  const id = crypto.randomUUID();
  const item: ArchivedDocument = {
    id,
    partnerId: input.partnerId,
    phone: input.phone,
    docKey: input.docKey,
    label: partnerDocumentLabel(input.docKey),
    fileName: input.fileName,
    size: input.size,
    mime: input.mime,
    archivedAt: new Date().toISOString(),
    actor: input.actor.trim() || "Сотрудник",
    storageKey: archiveStorageKey(input.phone, input.docKey, id),
  };
  writeAll([...readAll(), item]);
  return item;
}
