export type PublicPartner = {
  id: string;
  phone: string;
  companyName: string;
  contactName: string;
};

type ApiError = {
  message?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Не удалось связаться с сервером");
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
