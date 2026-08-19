import { NavLink } from "react-router-dom";
import { PARTNER_CARD_SECTIONS, partnerCardSectionHref } from "../lib/partner-profile";

type PartnerCardNavProps = {
  baseHref: string;
};

export function PartnerCardNav({ baseHref }: PartnerCardNavProps) {
  return (
    <nav className="partner-tabs" aria-label="Разделы карточки партнёра">
      <div className="partner-tabs__sticky">
        <p className="partner-tabs__title">Разделы</p>
        {PARTNER_CARD_SECTIONS.map((item) => (
          <NavLink
            key={item.key}
            to={partnerCardSectionHref(baseHref, item.path)}
            end={item.path === ""}
            className={({ isActive }) => `partner-tabs__link${isActive ? " is-active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
