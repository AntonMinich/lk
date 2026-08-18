import type { HistoryEvent } from "../../shared/history.ts";
import type { ApplicationStatus } from "./status";

export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
  createdAt: string;
  status: ApplicationStatus;
  responsibleManager: string;
  activatedBy: string;
  activatedAt: string;
  history: HistoryEvent[];
};

type ApiError = {
  message?: string;
  ok?: boolean;
};

export async function isApiOnline(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return false;
    }
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) {
      return false;
    }
    const data = (await response.json()) as ApiError;
    return data.ok === true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Не удалось связаться с сервером");
  }

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new Error("Сервер API недоступен");
  }

  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.message || "Ошибка сервера");
  }
  return data;
}

export function getMe() {
  return request<{ partner: PublicPartner }>("/api/me");
}

export function listPartnersRequest() {
  return request<{ partners: PublicPartner[] }>("/api/partners");
}

export function loginRequest(phone: string, password: string) {
  return request<{ partner: PublicPartner }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export function registerRequest(input: {
  phone: string;
  password: string;
  companyName: string;
  contactName: string;
}) {
  return request<{ ok: true }>("/api/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutRequest() {
  return request<{ ok: true }>("/api/logout", { method: "POST" });
}

export function adminLogoutRequest() {
  return request<{ ok: true }>("/api/admin/logout", { method: "POST" });
}

export function adminLoginRequest(login: string, password: string) {
  return request<{ ok: true; login: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
}

export function adminMeRequest() {
  return request<{ ok: true; login: string }>("/api/admin/me");
}

export function setPartnerStatusRequest(id: string, status: ApplicationStatus) {
  return request<{ partner: PublicPartner }>(`/api/partners/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function setPartnerManagerRequest(id: string, manager: string) {
  return request<{ partner: PublicPartner }>(`/api/partners/${id}/manager`, {
    method: "PATCH",
    body: JSON.stringify({ manager }),
  });
}
