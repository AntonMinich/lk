import { PARTNER_CARD_SECTIONS } from "../lib/partner-profile";

export function PartnerCardNav() {
  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="partner-card-nav" aria-label="Разделы карточки партнёра">
      {PARTNER_CARD_SECTIONS.map((item) => (
        <button key={item.id} type="button" className="partner-card-nav__btn" onClick={() => goTo(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
