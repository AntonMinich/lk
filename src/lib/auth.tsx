import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMe, loginRequest, logoutRequest, registerRequest, type PublicPartner } from "./api";

type AuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  ready: boolean;
  partner: PublicPartner | null;
  login: (phone: string, password: string) => Promise<AuthResult>;
  register: (input: {
    phone: string;
    password: string;
    companyName: string;
    contactName: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [partner, setPartner] = useState<PublicPartner | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) {
          setPartner(data.partner);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPartner(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      partner,
      login: async (phone, password) => {
        try {
          const data = await loginRequest(phone, password);
          setPartner(data.partner);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : "Ошибка входа" };
        }
      },
      register: async (input) => {
        try {
          await registerRequest(input);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Ошибка регистрации",
          };
        }
      },
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          setPartner(null);
        }
      },
    }),
    [partner, ready],
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
