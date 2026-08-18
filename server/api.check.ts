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
await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "::1", resolve);
});

const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("Server did not start");
}

const baseUrl = `http://[::1]:${address.port}`;

type PartnerPayload = {
  id?: string;
  phone?: string;
  unp?: string;
  email?: string;
  documents?: { key?: string; fileName?: string }[];
  status?: string;
  activatedBy?: string;
  responsibleManager?: string;
  history?: { text?: string }[];
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
      unp: "123456789",
      email: "anton@example.by",
      documents: [
        { key: "agreement", fileName: "dogovor.pdf", size: 1200, mime: "application/pdf" },
        { key: "registration", fileName: "reg.pdf", size: 800, mime: "application/pdf" },
        { key: "charter", fileName: "ustav.pdf", size: 900, mime: "application/pdf" },
      ],
    }),
  });
  assert.equal(registered.status, 201);

  const duplicateUnp = await api("/api/register", {
    method: "POST",
    body: JSON.stringify({
      phone: "+375297574025",
      password: "test123",
      companyName: "Другой партнёр",
      contactName: "Пётр",
      unp: "123456789",
    }),
  });
  assert.equal(duplicateUnp.status, 409);

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
  assert.equal(application?.unp, "123456789");
  assert.equal(application?.email, "anton@example.by");
  assert.equal(application?.documents?.length, 3);
  assert.ok(application?.id);
  assert.match(String(application.history?.[0]?.text), /поступила/i);

  const accepted = await api(`/api/partners/${application.id}/status`, {
    method: "PATCH",
    headers: { Cookie: adminLogin.cookies },
    body: JSON.stringify({ status: "accepted" }),
  });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.data.partner?.status, "accepted");
  assert.equal(accepted.data.partner?.responsibleManager, "admin");
  assert.equal(
    accepted.data.partner?.history?.some((item) => /принял заявку в работу/i.test(String(item.text))),
    true,
  );

  const admin2Denied = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ login: "admin2", password: "fincode" }),
  });
  assert.equal(admin2Denied.status, 401);

  const admin2Login = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ login: "admin2", password: "fincode2" }),
  });
  assert.equal(admin2Login.status, 200);
  assert.equal(admin2Login.data.ok, true);

  const managerUnknown = await api(`/api/partners/${application.id}/manager`, {
    method: "PATCH",
    headers: { Cookie: adminLogin.cookies },
    body: JSON.stringify({ manager: "Ирина" }),
  });
  assert.equal(managerUnknown.status, 400);

  const managerChanged = await api(`/api/partners/${application.id}/manager`, {
    method: "PATCH",
    headers: { Cookie: adminLogin.cookies },
    body: JSON.stringify({ manager: "admin2" }),
  });
  assert.equal(managerChanged.status, 200);
  assert.equal(managerChanged.data.partner?.responsibleManager, "admin2");

  const approved = await api(`/api/partners/${application.id}/status`, {
    method: "PATCH",
    headers: { Cookie: adminLogin.cookies },
    body: JSON.stringify({ status: "approved" }),
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.data.partner?.status, "approved");
  assert.equal(approved.data.partner?.activatedBy, "admin");
  assert.equal(approved.data.partner?.responsibleManager, "admin2");

  const login = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ phone: "+375447574025", password: "test123" }),
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.partner?.phone, "+375447574025");
  assert.equal(login.data.partner?.status, "active");

  const listedActive = await api("/api/partners", {
    headers: { Cookie: adminLogin.cookies },
  });
  const afterLogin = listedActive.data.partners?.find((item) => item.phone === "+375447574025");
  assert.equal(afterLogin?.status, "active");
  assert.equal(
    afterLogin?.history?.some((item) => /активировал личный кабинет/i.test(String(item.text))),
    true,
  );

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
