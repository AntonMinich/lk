import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getMe,
  isApiOnline,
  listPartnersRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  type PublicPartner,
} from "./api";
import {
  clearLocalSession,
  listLocalPartners,
  loginLocalPartner,
  readLocalSession,
  registerLocalPartner,
} from "./local-partners";

type AuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  ready: boolean;
  apiOnline: boolean;
  partner: PublicPartner | null;
  login: (phone: string, password: string) => Promise<AuthResult>;
  register: (input: {
    phone: string;
    password: string;
    companyName: string;
    contactName: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  listPartners: () => Promise<PublicPartner[]>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [partner, setPartner] = useState<PublicPartner | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const online = await isApiOnline();
      if (cancelled) {
        return;
      }
      setApiOnline(online);
      if (online) {
        try {
          const data = await getMe();
          if (!cancelled) {
            setPartner(data.partner);
          }
        } catch {
          if (!cancelled) {
            setPartner(null);
          }
        }
      } else if (!cancelled) {
        setPartner(readLocalSession());
      }
      if (!cancelled) {
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      apiOnline,
      partner,
      login: async (phone, password) => {
        if (apiOnline) {
          try {
            const data = await loginRequest(phone, password);
            setPartner(data.partner);
            return { ok: true };
          } catch (error) {
            return { ok: false, message: error instanceof Error ? error.message : "Ошибка входа" };
          }
        }
        const result = loginLocalPartner(phone, password);
        if (result.ok) {
          setPartner(result.partner);
        }
        return result;
      },
      register: async (input) => {
        if (apiOnline) {
          try {
            await registerRequest(input);
            return { ok: true };
          } catch (error) {
            return {
              ok: false,
              message: error instanceof Error ? error.message : "Ошибка регистрации",
            };
          }
        }
        const result = registerLocalPartner(input);
        return result.ok ? { ok: true } : result;
      },
      logout: async () => {
        if (apiOnline) {
          try {
            await logoutRequest();
          } finally {
            setPartner(null);
          }
          return;
        }
        clearLocalSession();
        setPartner(null);
      },
      listPartners: async () => {
        if (apiOnline) {
          const data = await listPartnersRequest();
          return data.partners;
        }
        return listLocalPartners();
      },
    }),
    [apiOnline, partner, ready],
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
