export type AdminAccount = {
  login: string;
  password: string;
};

export const ADMIN_DEMO: AdminAccount = { login: "admin", password: "fincode" };

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  ADMIN_DEMO,
  { login: "admin2", password: "fincode2" },
];

export function adminLogins(): string[] {
  return ADMIN_ACCOUNTS.map((item) => item.login);
}

export function isAdminLogin(login: string): boolean {
  return ADMIN_ACCOUNTS.some((item) => item.login === login.trim());
}

export function findAdmin(login: string, password: string): AdminAccount | undefined {
  const name = login.trim();
  return ADMIN_ACCOUNTS.find((item) => item.login === name && item.password === password);
}
