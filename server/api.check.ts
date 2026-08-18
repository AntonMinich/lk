import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { createApp } from "./app.ts";

const tmpDir = await mkdtemp(path.join(os.tmpdir(), "lk-api-"));
const partnersPath = path.join(tmpDir, "partners.json");
await writeFile(partnersPath, "[]\n", "utf8");

const app = createApp({
  partnersPath,
  imageDir: path.resolve("image"),
});

const server = createServer(app);
const port = 41000 + Math.floor(Math.random() * 8000);
await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});

const baseUrl = `http://127.0.0.1:${port}`;

type PartnerPayload = {
  id?: string;
  phone?: string;
  status?: string;
};

type ApiResponse = {
  status: number;
  data: {
    message?: string;
    ok?: boolean;
    partner?: PartnerPayload;
    partners?: PartnerPayload[];
  };
  cookies: string;
};

async function api(pathname: string, options: RequestInit = {}): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as ApiResponse["data"];
  const cookies = response.headers.getSetCookie().map((part) => part.split(";")[0]).join("; ");
  return { status: response.status, data, cookies };
}

try {
  const health = await api("/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);

  const root = await api("/");
  assert.equal(root.status, 200);
  assert.equal(root.data.ok, true);

  const unregistered = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+375447574025", password: "test123" }),
  });
  assert.equal(unregistered.status, 401);
  assert.match(String(unregistered.data.message), /не зарегистрирован/i);

  const badOperator = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+375257574025", password: "test123" }),
  });
  assert.equal(badOperator.status, 400);
  assert.match(String(badOperator.data.message), /оператора/);

  const tooShort = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+37544757", password: "test123" }),
  });
  assert.equal(tooShort.status, 400);
  assert.match(String(tooShort.data.message), /9 цифр/);

  const registered = await api("/api/register", {
    method: "POST",
    body: JSON.stringify({
      phone: "+375447574025",
      password: "test123",
      companyName: "ООО Партнёр",
      contactName: "Антон",
    }),
  });
  assert.equal(registered.status, 201);

  const pendingLogin = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+375447574025", password: "test123" }),
  });
  assert.equal(pendingLogin.status, 403);
  assert.match(String(pendingLogin.data.message), /не одобрена/i);

  const partnersPublic = await api("/api/partners");
  assert.equal(partnersPublic.status, 401);

  const adminDenied = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ login: "admin", password: "wrong" }),
  });
  assert.equal(adminDenied.status, 401);

  const adminLogin = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ login: "admin", password: "fincode" }),
  });
  assert.equal(adminLogin.status, 200);
  assert.equal(adminLogin.data.ok, true);

  const adminMe = await api("/api/admin/me", {
    headers: { Cookie: adminLogin.cookies },
  });
  assert.equal(adminMe.status, 200);

  const listed = await api("/api/partners", {
    headers: { Cookie: adminLogin.cookies },
  });
  assert.equal(listed.status, 200);
  const application = listed.data.partners?.find((item) => item.phone === "+375447574025");
  assert.equal(application?.status, "pending");
  assert.ok(application?.id);

  const approved = await api(`/api/partners/${application.id}/status`, {
    method: "PATCH",
    headers: { Cookie: adminLogin.cookies },
    body: JSON.stringify({ status: "approved" }),
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.data.partner?.status, "approved");

  const login = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+375447574025", password: "test123" }),
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.partner?.phone, "+375447574025");

  const me = await api("/api/me", {
    headers: { Cookie: login.cookies },
  });
  assert.equal(me.status, 200);
  assert.equal(me.data.partner?.phone, "+375447574025");

  const rejected = await api(`/api/partners/${application.id}/status`, {
    method: "PATCH",
    headers: { Cookie: adminLogin.cookies },
    body: JSON.stringify({ status: "rejected" }),
  });
  assert.equal(rejected.status, 200);

  const meAfterReject = await api("/api/me", {
    headers: { Cookie: login.cookies },
  });
  assert.equal(meAfterReject.status, 401);

  const rejectedLogin = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+375447574025", password: "test123" }),
  });
  assert.equal(rejectedLogin.status, 403);
  assert.match(String(rejectedLogin.data.message), /отклонена/i);

  console.log("api checks passed");
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await rm(tmpDir, { recursive: true, force: true });
}
