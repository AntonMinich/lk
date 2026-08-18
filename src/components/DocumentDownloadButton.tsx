import { useEffect, useState } from "react";
import {
  downloadArchivedPartnerFile,
  downloadPartnerFile,
  getArchivedPartnerFile,
  getPartnerFile,
} from "../lib/partner-files";

type DocumentDownloadButtonProps = {
  fileName: string;
  phone?: string;
  docKey?: string;
  storageKey?: string;
};

export function DocumentDownloadButton({ phone, docKey, storageKey, fileName }: DocumentDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = storageKey
      ? getArchivedPartnerFile(storageKey)
      : phone && docKey
        ? getPartnerFile(phone, docKey)
        : Promise.resolve(null);
    void load.then((file) => {
      if (!cancelled) {
        setAvailable(Boolean(file));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [docKey, phone, storageKey]);

  if (available === false) {
    return <span className="admin-docs__unavailable">Файл недоступен</span>;
  }

  return (
    <button
      type="button"
      className="admin-docs__download"
      disabled={busy || available !== true}
      onClick={() => {
        setBusy(true);
        const run = storageKey
          ? downloadArchivedPartnerFile(storageKey, fileName)
          : phone && docKey
            ? downloadPartnerFile(phone, docKey, fileName)
            : Promise.resolve(false);
        void run.then((ok) => {
          setBusy(false);
          if (!ok) {
            setAvailable(false);
          }
        });
      }}
    >
      {busy ? "Скачиваем…" : "Скачать"}
    </button>
  );
}
