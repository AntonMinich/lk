import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AdminApplicationDetail, type AdminDetailPane } from "../components/AdminApplicationDetail";
import { DocumentArchivePane } from "../components/DocumentArchivePane";
import { PartnerActivityPanel } from "../components/PartnerActivityPanel";
import { PartnerCardNav } from "../components/PartnerCardNav";
import { PartnerCommentsPane } from "../components/PartnerCommentsPane";
import {
  PartnerFinancingSection,
  PartnerOutletsSection,
  PartnerUsersSection,
} from "../components/PartnerProfilePanel";
import { PartnerSettingsForm } from "../components/PartnerSettingsForm";
import { useAuth } from "../lib/auth";
import { formatPartnerApplicationNo } from "../lib/application-no";
import { addArchivedDocument, countArchivedDocuments } from "../lib/document-archive";
import { formatDate, formatDateTime } from "../lib/format";
import { leasingForPartnerCard } from "../lib/leasing";
import { replaceLocalPartnerDocument } from "../lib/local-partners";
import {
  findPartnerUser,
  getPartnerProfile,
  goodsSourceLabel,
  PARTNER_USER_STATUS_LABEL,
  savePartnerProfile,
  type CounterpartySettings,
} from "../lib/partner-profile";
import { formatPhoneDisplay } from "../lib/phone";
import { partnerDocumentLabel, type PartnerDocumentKey } from "../lib/partner-docs";
import { getPartnerFile, putStoredFile, savePartnerFiles } from "../lib/partner-files";
import { countPartnerComments } from "../lib/partner-comments";
import type { PublicPartner } from "../lib/api";
import {
  isDirectoryPartner,
  partnerStatusAfterCardDecision,
  showPartnerDirectoryCard,
  STATUS_LABEL,
  type ApplicationStatus,
} from "../lib/status";

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
  if (pathname.includes("/users/")) {
    return "user";
  }
  if (pathname.endsWith("/users")) {
    return "users";
  }
  if (pathname.endsWith("/financing")) {
    return "financing";
  }
  if (pathname.endsWith("/documents")) {
    return "documents";
  }
  if (pathname.endsWith("/outlets")) {
    return "outlets";
  }
  if (pathname.endsWith("/settings")) {
    return "settings";
  }
  if (pathname.endsWith("/applications")) {
    return "applications";
  }
  return "main";
}

const PANE_TITLE: Partial<Record<AdminDetailPane, string>> = {
  users: "Пользователи",
  financing: "Условия финансирования",
  documents: "Документы",
  outlets: "Торговые точки",
  settings: "Настройка контрагента",
  applications: "Заявки",
};

export function AdminPartnerDetailPage() {
  const { id, userId } = useParams();
  const location = useLocation();
  const { listPartners, setPartnerStatus, setPartnerManager, adminName } = useAuth();
  const [partner, setPartner] = useState<PublicPartner | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notesTick, setNotesTick] = useState(0);
  const [profileTick, setProfileTick] = useState(0);
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

  const directoryPath = location.pathname.startsWith("/admin/directory");
  const leasingApps = useMemo(() => {
    if (!partner || !showPartnerDirectoryCard(partner.status, location.pathname)) {
      return [];
    }
    return leasingForPartnerCard(partner.id, partner.companyName, partner.phone);
  }, [location.pathname, partner]);
  const profile = useMemo(() => {
    if (!partner || !showPartnerDirectoryCard(partner.status, location.pathname)) {
      return null;
    }
    return getPartnerProfile({
      id: partner.id,
      companyName: partner.companyName,
      contactName: partner.contactName,
      phone: partner.phone,
      email: partner.email,
      unp: partner.unp,
    });
  }, [location.pathname, partner, profileTick]);

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
  const fromDirectory = directoryPath || isDirectoryPartner(current.status);
  const listHref = fromDirectory ? "/admin/directory" : "/admin/partners";
  const listLabel = fromDirectory ? "Партнеры" : "Заявки на регистрацию";
  const detailHref = fromDirectory ? `/admin/directory/${current.id}` : `/admin/partners/${current.id}`;
  const canReplaceDocuments = Boolean(current.responsibleManager);
  const selectedUser = profile && userId ? findPartnerUser(profile, userId) : null;
  const directoryFields = profile
    ? [
        { label: "Организация", value: current.companyName },
        { label: "УНП", value: current.unp },
        { label: "Контактное лицо", value: current.contactName },
        { label: "Email", value: current.email },
        { label: "Телефон", value: formatPhoneDisplay(current.phone) },
        { label: "Статус", value: STATUS_LABEL[current.status], tone: current.status },
        { label: "Дата регистрации", value: formatDate(current.createdAt) },
        { label: "Источник товаров", value: goodsSourceLabel(profile.goodsSource) },
      ]
    : [
        { label: "ID", value: formatPartnerApplicationNo(current.seq) },
        { label: "Наименование юридического лица", value: current.companyName },
        { label: "УНП", value: current.unp },
        { label: "ФИО контактного лица", value: current.contactName },
        { label: "Телефон", value: formatPhoneDisplay(current.phone) },
        { label: "Email", value: current.email },
        { label: "Дата заявки", value: formatDateTime(current.createdAt) },
      ];

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

  function saveSettings(settings: CounterpartySettings) {
    if (!profile) {
      return;
    }
    savePartnerProfile({ ...profile, settings, goodsSource: settings.goodsSource });
    setProfileTick((value) => value + 1);
  }

  const overview = pane === "main";
  const sectionContent =
    profile && pane === "users" ? (
      <PartnerUsersSection profile={profile} userHref={(user) => `${detailHref}/users/${user}`} />
    ) : profile && pane === "financing" ? (
      <PartnerFinancingSection profile={profile} />
    ) : profile && pane === "outlets" ? (
      <PartnerOutletsSection profile={profile} />
    ) : profile && pane === "settings" ? (
      <PartnerSettingsForm profile={profile} busy={busy} onSave={saveSettings} />
    ) : profile && pane === "applications" ? (
      <PartnerActivityPanel applications={leasingApps} showKpis={false} showChart={false} />
    ) : null;

  const crumbs: { label: string; to?: string }[] = [
    { label: listLabel, to: listHref },
    { label: current.companyName || (fromDirectory ? "Партнёр" : "Заявка"), to: pane === "main" ? undefined : detailHref },
  ];
  if (pane === "users" || pane === "user") {
    crumbs.push({ label: "Пользователи", to: pane === "user" ? `${detailHref}/users` : undefined });
  }
  if (pane === "user") {
    crumbs.push({ label: selectedUser?.fullName || "Пользователь" });
  } else if (PANE_TITLE[pane] && pane !== "users") {
    crumbs.push({ label: PANE_TITLE[pane] ?? "" });
  }

  return (
    <AdminApplicationDetail
      title={
        pane === "user"
          ? selectedUser?.fullName || "Пользователь"
          : PANE_TITLE[pane] || (fromDirectory ? "Партнёр" : "Заявка на регистрацию партнера")
      }
      crumbs={crumbs}
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
      onApprove={() => void changeStatus(partnerStatusAfterCardDecision(current.status, "approve"))}
      onReject={() => void changeStatus("rejected")}
      onBlock={() => void changeStatus(partnerStatusAfterCardDecision(current.status, "block"))}
      onChangeManager={(name) => void changeManager(name)}
      fields={
        pane === "user" && selectedUser
          ? [
              { label: "ФИО", value: selectedUser.fullName },
              { label: "Телефон", value: formatPhoneDisplay(selectedUser.phone) },
              { label: "Роль", value: selectedUser.role },
              { label: "Статус", value: PARTNER_USER_STATUS_LABEL[selectedUser.status], tone: selectedUser.status === "blocked" ? "blocked" : selectedUser.status === "activated" ? "active" : "accepted" },
              { label: "Партнёр", value: current.companyName },
            ]
          : directoryFields
      }
      dashboards={
        profile && overview ? (
          <PartnerActivityPanel applications={leasingApps} showTable={false} />
        ) : null
      }
      extraContent={sectionContent}
      sectionNav={profile ? <PartnerCardNav baseHref={detailHref} /> : null}
      factsTitle={profile && overview ? "Общая информация" : undefined}
      showFacts={overview || pane === "user"}
      showDocuments={overview && !profile ? true : pane === "documents"}
      documentsTitle={pane === "documents" ? "" : profile ? "Документы" : "Приложенные документы"}
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
