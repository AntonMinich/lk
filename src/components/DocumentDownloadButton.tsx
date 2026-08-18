import { useEffect, useState } from "react";
import { downloadPartnerFile, getPartnerFile } from "../lib/partner-files";

type DocumentDownloadButtonProps = {
  phone: string;
  docKey: string;
  fileName: string;
};

export function DocumentDownloadButton({ phone, docKey, fileName }: DocumentDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPartnerFile(phone, docKey).then((file) => {
      if (!cancelled) {
        setAvailable(Boolean(file));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [docKey, phone]);

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
        void downloadPartnerFile(phone, docKey, fileName).then((ok) => {
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
