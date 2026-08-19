import { useState, type FormEvent } from "react";
import {
  GOODS_SOURCE_LABEL,
  type CounterpartySettings,
  type GoodsSource,
  type PartnerProfile,
} from "../lib/partner-profile";

type PartnerSettingsFormProps = {
  profile: PartnerProfile;
  busy?: boolean;
  onSave: (settings: CounterpartySettings) => void;
};

const SOURCES = Object.entries(GOODS_SOURCE_LABEL) as [GoodsSource, string][];

export function PartnerSettingsForm({ profile, busy = false, onSave }: PartnerSettingsFormProps) {
  const [draft, setDraft] = useState<CounterpartySettings>(profile.settings);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave(draft);
    setSaved(true);
  }

  return (
    <form className="partner-settings" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <label className="field">
          Источник товаров
          <select
            value={draft.goodsSource}
            onChange={(event) => setDraft({ ...draft, goodsSource: event.target.value as GoodsSource })}
          >
            {SOURCES.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Email уведомлений
          <input
            type="email"
            value={draft.notifyEmail}
            onChange={(event) => setDraft({ ...draft, notifyEmail: event.target.value })}
          />
        </label>
        <label className="field">
          Код интеграции
          <input
            type="text"
            value={draft.integrationCode}
            onChange={(event) => setDraft({ ...draft, integrationCode: event.target.value })}
          />
        </label>
        <label className="field">
          Создание заявок
          <select
            value={draft.canCreateApplications ? "yes" : "no"}
            onChange={(event) => setDraft({ ...draft, canCreateApplications: event.target.value === "yes" })}
          >
            <option value="yes">Разрешено</option>
            <option value="no">Запрещено</option>
          </select>
        </label>
        <label className="field">
          Автоотправка предложений
          <select
            value={draft.autoSendOffers ? "yes" : "no"}
            onChange={(event) => setDraft({ ...draft, autoSendOffers: event.target.value === "yes" })}
          >
            <option value="yes">Включена</option>
            <option value="no">Выключена</option>
          </select>
        </label>
        <label className="field">
          Синхронизация остатков
          <select
            value={draft.stockSync ? "yes" : "no"}
            onChange={(event) => setDraft({ ...draft, stockSync: event.target.value === "yes" })}
          >
            <option value="yes">Включена</option>
            <option value="no">Выключена</option>
          </select>
        </label>
      </div>
      <label className="field">
        Комментарий
        <textarea
          rows={4}
          value={draft.comment}
          onChange={(event) => setDraft({ ...draft, comment: event.target.value })}
        />
      </label>
      {saved ? <p className="partner-settings__ok">Настройки сохранены</p> : null}
      <button type="submit" className="primary-btn" disabled={busy}>
        Сохранить
      </button>
    </form>
  );
}
