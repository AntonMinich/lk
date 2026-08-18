import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  adminLoginRequest,
  adminLogoutRequest,
  adminMeRequest,
  getMe,
  isApiOnline,
  listPartnersRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  setPartnerStatusRequest,
  type PublicPartner,
} from "./api";
import {
  clearLocalAdmin,
  clearLocalSession,
  isLocalAdmin,
  listLocalPartners,
  localAdminName,
  loginLocalAdmin,
  loginLocalPartner,
  readLocalSession,
  registerLocalPartner,
  setLocalPartnerStatus,
} from "./local-partners";
import type { ApplicationStatus } from "./status";

type AuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  ready: boolean;
  apiOnline: boolean;
  partner: PublicPartner | null;
  admin: boolean;
  adminName: string;
  login: (phone: string, password: string) => Promise<AuthResult>;
  register: (input: {
    phone: string;
    password: string;
    companyName: string;
    contactName: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  loginAdmin: (login: string, password: string) => Promise<AuthResult>;
  logoutAdmin: () => Promise<void>;
  listPartners: () => Promise<PublicPartner[]>;
  setPartnerStatus: (id: string, status: ApplicationStatus) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [partner, setPartner] = useState<PublicPartner | null>(null);
  const [admin, setAdmin] = useState(false);
  const [adminName, setAdminName] = useState("");

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
        try {
          const me = await adminMeRequest();
          if (!cancelled) {
            setAdmin(true);
            setAdminName(me.login);
          }
        } catch {
          if (!cancelled) {
            setAdmin(false);
            setAdminName("");
          }
        }
      } else if (!cancelled) {
        setPartner(readLocalSession());
        setAdmin(isLocalAdmin());
        setAdminName(localAdminName() ?? "");
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
      admin,
      adminName,
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
      loginAdmin: async (login, password) => {
        if (apiOnline) {
          try {
            const data = await adminLoginRequest(login, password);
            setAdmin(true);
            setAdminName(data.login);
            return { ok: true };
          } catch (error) {
            return {
              ok: false,
              message: error instanceof Error ? error.message : "Ошибка входа в админку",
            };
          }
        }
        const result = loginLocalAdmin(login, password);
        if (result.ok) {
          setAdmin(true);
          setAdminName(result.login);
        }
        return result;
      },
      logoutAdmin: async () => {
        if (apiOnline) {
          try {
            await adminLogoutRequest();
          } finally {
            setAdmin(false);
            setAdminName("");
          }
          return;
        }
        clearLocalAdmin();
        setAdmin(false);
        setAdminName("");
      },
      listPartners: async () => {
        if (apiOnline) {
          const data = await listPartnersRequest();
          return data.partners;
        }
        return listLocalPartners();
      },
      setPartnerStatus: async (id, status) => {
        if (apiOnline) {
          try {
            await setPartnerStatusRequest(id, status);
            return { ok: true };
          } catch (error) {
            return {
              ok: false,
              message: error instanceof Error ? error.message : "Не удалось обновить статус",
            };
          }
        }
        const updated = setLocalPartnerStatus(id, status, adminName);
        if (!updated) {
          return { ok: false, message: "Заявка не найдена" };
        }
        return { ok: true };
      },
    }),
    [admin, adminName, apiOnline, partner, ready],
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
