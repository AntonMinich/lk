import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AdminApplicationDetail, type AdminDetailPane } from "../components/AdminApplicationDetail";
import { DocumentArchivePane } from "../components/DocumentArchivePane";
import { PartnerActivityPanel } from "../components/PartnerActivityPanel";
import { PartnerCommentsPane } from "../components/PartnerCommentsPane";
import { useAuth } from "../lib/auth";
import { formatPartnerApplicationNo } from "../lib/application-no";
import { addArchivedDocument, countArchivedDocuments } from "../lib/document-archive";
import { formatDateTime } from "../lib/format";
import { leasingForPartnerCard } from "../lib/leasing";
import { replaceLocalPartnerDocument } from "../lib/local-partners";
import { formatPhoneDisplay } from "../lib/phone";
import { partnerDocumentLabel, type PartnerDocumentKey } from "../lib/partner-docs";
import { getPartnerFile, putStoredFile, savePartnerFiles } from "../lib/partner-files";
import { countPartnerComments } from "../lib/partner-comments";
import type { PublicPartner } from "../lib/api";
import { isDirectoryPartner, type ApplicationStatus } from "../lib/status";

function paneFromPath(pathname: string): AdminDetailPane {
  if (pathname.endsWith("/history")) {
    return "history";
  }
  if (pathname.endsWith("/archive")) {
    return "archive";
  }
  if (pathname.endsWith("/comments")) {
    return "comments";
  }
  return "main";
}

export function AdminPartnerDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { listPartners, setPartnerStatus, setPartnerManager, adminName } = useAuth();
  const [partner, setPartner] = useState<PublicPartner | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notesTick, setNotesTick] = useState(0);
  const pane = paneFromPath(location.pathname);

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    void listPartners()
      .then((items) => {
        if (!cancelled) {
          setPartner(items.find((item) => item.id === id) ?? null);
        }
      })
      .catch((item: unknown) => {
        if (!cancelled) {
          setError(item instanceof Error ? item.message : "Не удалось загрузить заявку");
          setPartner(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, listPartners]);

  const leasingApps = useMemo(() => {
    if (!partner || !isDirectoryPartner(partner.status)) {
      return [];
    }
    return leasingForPartnerCard(partner.id, partner.companyName, partner.phone);
  }, [partner]);

  if (!id) {
    return <Navigate to="/admin/partners" replace />;
  }

  if (partner === undefined) {
    return null;
  }

  if (!partner) {
    return (
      <section className="admin-page">
        <h1>Заявка не найдена</h1>
      </section>
    );
  }

  const current = partner;
  const fromDirectory = location.pathname.startsWith("/admin/directory") || isDirectoryPartner(current.status);
  const listHref = fromDirectory ? "/admin/directory" : "/admin/partners";
  const listLabel = fromDirectory ? "Партнеры" : "Заявки на регистрацию";
  const detailHref = fromDirectory ? `/admin/directory/${current.id}` : `/admin/partners/${current.id}`;
  const canReplaceDocuments = Boolean(current.responsibleManager);

  async function changeStatus(status: ApplicationStatus) {
    setError("");
    setBusy(true);
    const result = await setPartnerStatus(current.id, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPartner(result.partner);
  }

  async function changeManager(name: string) {
    setError("");
    setBusy(true);
    const result = await setPartnerManager(current.id, name);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPartner(result.partner);
  }

  async function replaceDocument(key: PartnerDocumentKey, file: File) {
    setError("");
    setBusy(true);
    try {
      const previous = current.documents.find((item) => item.key === key);
      const stored = await getPartnerFile(current.phone, key);
      if (previous) {
        const archived = addArchivedDocument({
          partnerId: current.id,
          phone: current.phone,
          docKey: key,
          fileName: previous.fileName,
          size: previous.size,
          mime: previous.mime,
          actor: adminName,
        });
        if (stored) {
          await putStoredFile(archived.storageKey, stored);
        }
      }
      await savePartnerFiles({ phone: current.phone, files: { [key]: file } });
      const updated = replaceLocalPartnerDocument(
        current.id,
        key,
        { fileName: file.name, size: file.size, mime: file.type || "application/octet-stream" },
        adminName,
      );
      if (!updated) {
        setError("Не удалось заменить документ");
        return;
      }
      setPartner(updated);
    } catch (item: unknown) {
      setError(item instanceof Error ? item.message : "Не удалось заменить документ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminApplicationDetail
      title={fromDirectory ? "Партнёр" : "Заявка на регистрацию партнера"}
      crumbs={[
        { label: listLabel, to: listHref },
        { label: current.companyName || (fromDirectory ? "Партнёр" : "Заявка") },
      ]}
      status={current.status}
      manager={current.responsibleManager}
      history={current.history}
      historyHref={`${detailHref}/history`}
      backHref={detailHref}
      backLabel={fromDirectory ? "К партнёру" : "К заявке"}
      pane={pane}
      extraLinks={
        notesTick >= 0
          ? [
              {
                to: `${detailHref}/archive`,
                label: "Архив документов",
                count: countArchivedDocuments(current.id),
                active: pane === "archive",
              },
              {
                to: `${detailHref}/comments`,
                label: "Комментарий",
                count: countPartnerComments(current.id),
                active: pane === "comments",
              },
            ]
          : []
      }
      busy={busy}
      error={error}
      canReplaceDocuments={canReplaceDocuments}
      onReplaceDocument={(key, file) => void replaceDocument(key, file)}
      onAccept={() => void changeStatus("accepted")}
      onApprove={() => void changeStatus("approved")}
      onReject={() => void changeStatus("rejected")}
      onBlock={() => void changeStatus("blocked")}
      onChangeManager={(name) => void changeManager(name)}
      fields={[
        { label: "ID", value: formatPartnerApplicationNo(current.seq) },
        { label: "Наименование юридического лица", value: current.companyName },
        { label: "УНП", value: current.unp },
        { label: "ФИО контактного лица", value: current.contactName },
        { label: "Телефон", value: formatPhoneDisplay(current.phone) },
        { label: "Email", value: current.email },
        { label: "Дата заявки", value: formatDateTime(current.createdAt) },
      ]}
      extraContent={isDirectoryPartner(current.status) ? <PartnerActivityPanel applications={leasingApps} /> : null}
      documents={current.documents.map((item) => ({
        label: partnerDocumentLabel(item.key),
        fileName: item.fileName,
        size: item.size,
        key: item.key,
        phone: current.phone,
      }))}
      archiveContent={<DocumentArchivePane partnerId={current.id} />}
      commentsContent={
        <PartnerCommentsPane
          partnerId={current.id}
          author={adminName}
          onChange={() => setNotesTick((value) => value + 1)}
        />
      }
    />
  );
}
