import type { PartnerDocumentKey } from "./partner-docs";

const DB_NAME = "lk-partner-files";
const STORE = "files";

export type StoredPartnerFile = {
  fileName: string;
  mime: string;
  blob: Blob;
};

export function partnerFileKey(phone: string, key: string) {
  return `${phone}:${key}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB недоступен"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Не удалось открыть хранилище файлов"));
  });
}

export async function savePartnerFiles(input: {
  phone: string;
  files: Partial<Record<PartnerDocumentKey, File | null>>;
}): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const [key, file] of Object.entries(input.files)) {
        if (!file) {
          continue;
        }
        store.put(
          {
            fileName: file.name,
            mime: file.type || "application/octet-stream",
            blob: file,
          } satisfies StoredPartnerFile,
          partnerFileKey(input.phone, key),
        );
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Не удалось сохранить файлы"));
    });
  } finally {
    db.close();
  }
}

export async function getPartnerFile(phone: string, key: string): Promise<StoredPartnerFile | null> {
  try {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).get(partnerFileKey(phone, key));
        request.onsuccess = () => resolve((request.result as StoredPartnerFile | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error("Не удалось прочитать файл"));
      });
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function downloadPartnerFile(phone: string, key: string, fallbackName: string): Promise<boolean> {
  const stored = await getPartnerFile(phone, key);
  if (!stored) {
    return false;
  }
  const url = URL.createObjectURL(stored.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = stored.fileName || fallbackName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
