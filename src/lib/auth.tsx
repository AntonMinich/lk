import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toCanonicalPhone } from "./phone";

const SESSION_KEY = "lk-partner-session";
const PARTNERS_KEY = "lk-partners";

export type Partner = {
  phone: string;
  password: string;
  companyName: string;
  contactName: string;
};

type AuthContextValue = {
  partner: Partner | null;
  login: (phone: string, password: string) => { ok: true } | { ok: false; message: string };
  register: (partner: Partner) => { ok: true } | { ok: false; message: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readPartners(): Partner[] {
  try {
    const raw = localStorage.getItem(PARTNERS_KEY);
    return raw ? (JSON.parse(raw) as Partner[]) : [];
  } catch {
    return [];
  }
}

function writePartners(partners: Partner[]) {
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
}

function readSession(): Partner | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partner) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(() => readSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      partner,
      login: (phone, password) => {
        const canonical = toCanonicalPhone(phone);
        const partners = readPartners();
        const found = partners.find((item) => item.phone === canonical);

        if (!found) {
          // Макет: валидный номер и пароль открывают кабинет даже без регистрации.
          const guest: Partner = {
            phone: canonical,
            password,
            companyName: "Партнёр",
            contactName: "",
          };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(guest));
          setPartner(guest);
          return { ok: true };
        }

        if (found.password !== password) {
          return { ok: false, message: "Неверный пароль" };
        }

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(found));
        setPartner(found);
        return { ok: true };
      },
      register: (next) => {
        const partners = readPartners();
        if (partners.some((item) => item.phone === next.phone)) {
          return { ok: false, message: "Партнёр с таким номером уже зарегистрирован" };
        }
        writePartners([...partners, next]);
        return { ok: true };
      },
      logout: () => {
        sessionStorage.removeItem(SESSION_KEY);
        setPartner(null);
      },
    }),
    [partner],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
