import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { findAdmin, isAdminLogin } from "../shared/admin.ts";
import { validatePartnerPhone } from "../shared/phone.ts";
import {
  isApplicationStatus,
  loginBlockedMessage,
  normalizeStatus,
} from "../shared/status.ts";
import { sanitizePartnerDocuments } from "../shared/partner-docs.ts";
import { PartnerStore, toPublicPartner, type PublicPartner } from "./store.ts";
import { proxyToVite } from "./vite-proxy.ts";

const SESSION_COOKIE = "lk_session";
const ADMIN_COOKIE = "lk_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Session = {
  partnerId: string;
  expiresAt: number;
};

type AdminSession = {
  login: string;
  expiresAt: number;
};

export type CreateAppOptions = {
  partnersPath: string;
  imageDir: string;
  distDir?: string;
  viteOrigin?: string;
};

export function createApp(options: CreateAppOptions) {
  const store = new PartnerStore(options.partnersPath);
  const sessions = new Map<string, Session>();
  const adminSessions = new Map<string, AdminSession>();
  const app = express();

  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use("/image", express.static(options.imageDir));

  function readSession(req: Request): Session | null {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token || typeof token !== "string") {
      return null;
    }
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(token);
      return null;
    }
    return session;
  }

  function readAdminSession(req: Request): AdminSession | null {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token || typeof token !== "string") {
      return null;
    }
    const session = adminSessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      adminSessions.delete(token);
      return null;
    }
    return session;
  }

  function setSession(res: Response, partnerId: string) {
    const token = randomBytes(24).toString("hex");
    sessions.set(token, { partnerId, expiresAt: Date.now() + SESSION_TTL_MS });
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS,
    });
  }

  function setAdminSession(res: Response, login: string) {
    const token = randomBytes(24).toString("hex");
    adminSessions.set(token, { login, expiresAt: Date.now() + SESSION_TTL_MS });
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS,
    });
  }

  function clearSession(req: Request, res: Response) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) {
      sessions.delete(token);
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
  }

  function clearAdminSession(req: Request, res: Response) {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (token) {
      adminSessions.delete(token);
    }
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
  }

  function requireAdmin(req: Request, res: Response): AdminSession | null {
    const session = readAdminSession(req);
    if (session) {
      return session;
    }
    res.status(401).json({ message: "Нужна авторизация администратора" });
    return null;
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (_req, res, next) => {
    if (options.distDir || options.viteOrigin) {
      next();
      return;
    }
    res.json({ ok: true, service: "lk-api", health: "/api/health" });
  });

  app.post("/api/register", async (req, res) => {
    const companyName = String(req.body?.companyName ?? "").trim();
    const contactName = String(req.body?.contactName ?? "").trim();
    const unp = String(req.body?.unp ?? "").replace(/\D/g, "");
    const email = String(req.body?.email ?? "").trim();
    const documents = sanitizePartnerDocuments(req.body?.documents);
    const password = String(req.body?.password ?? "");
    const phoneResult = validatePartnerPhone(String(req.body?.phone ?? ""));

    if (!companyName) {
      res.status(400).json({ message: "Укажите название организации" });
      return;
    }
    if (!contactName) {
      res.status(400).json({ message: "Укажите ФИО контактного лица" });
      return;
    }
    if (!phoneResult.ok) {
      res.status(400).json({ message: phoneResult.message });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Пароль должен содержать не менее 6 символов" });
      return;
    }

    const existing = await store.findByPhone(phoneResult.canonical);
    if (existing) {
      res.status(409).json({ message: "Партнёр с таким номером уже зарегистрирован" });
      return;
    }
    if (unp) {
      const existingUnp = await store.findByUnp(unp);
      if (existingUnp) {
        res.status(409).json({ message: "Партнёр с таким УНП уже зарегистрирован" });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await store.create({
      phone: phoneResult.canonical,
      passwordHash,
      companyName,
      contactName,
      unp,
      email,
      documents,
    });

    res.status(201).json({ ok: true });
  });

  app.post("/api/login", async (req, res) => {
    const password = String(req.body?.password ?? "");
    const phoneResult = validatePartnerPhone(String(req.body?.phone ?? ""));

    if (!phoneResult.ok) {
      res.status(400).json({ message: phoneResult.message });
      return;
    }
    if (!password) {
      res.status(400).json({ message: "Введите пароль" });
      return;
    }

    const partner = await store.findByPhone(phoneResult.canonical);
    if (!partner) {
      res.status(401).json({ message: "Партнёр с таким номером не зарегистрирован" });
      return;
    }

    const matches = await bcrypt.compare(password, partner.passwordHash);
    if (!matches) {
      res.status(401).json({ message: "Неверный пароль" });
      return;
    }

    const blocked = loginBlockedMessage(normalizeStatus(partner.status));
    if (blocked) {
      res.status(403).json({ message: blocked });
      return;
    }

    const current = (await store.activateCabinet(partner.id)) ?? partner;
    setSession(res, current.id);
    res.json({ partner: toPublicPartner(current) });
  });

  app.post("/api/logout", (req, res) => {
    clearSession(req, res);
    res.json({ ok: true });
  });

  app.post("/api/admin/login", (req, res) => {
    const login = String(req.body?.login ?? "").trim();
    const password = String(req.body?.password ?? "");
    const account = findAdmin(login, password);
    if (!account) {
      res.status(401).json({ message: "Неверный логин или пароль администратора" });
      return;
    }
    setAdminSession(res, account.login);
    res.json({ ok: true, login: account.login });
  });

  app.post("/api/admin/logout", (req, res) => {
    clearAdminSession(req, res);
    res.json({ ok: true });
  });

  app.get("/api/admin/me", (req, res) => {
    const session = requireAdmin(req, res);
    if (!session) {
      return;
    }
    res.json({ ok: true, login: session.login });
  });

  app.get("/api/partners", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }
    const partners = await store.list();
    res.json({ partners: partners.map(toPublicPartner) });
  });

  app.patch("/api/partners/:id/status", async (req, res) => {
    const session = requireAdmin(req, res);
    if (!session) {
      return;
    }

    const status = String(req.body?.status ?? "");
    if (!isApplicationStatus(status)) {
      res.status(400).json({ message: "Некорректный статус заявки" });
      return;
    }

    const partner = await store.setStatus(req.params.id, status, session.login);
    if (!partner) {
      res.status(404).json({ message: "Заявка не найдена" });
      return;
    }

    res.json({ partner: toPublicPartner(partner) });
  });

  app.patch("/api/partners/:id/manager", async (req, res) => {
    const session = requireAdmin(req, res);
    if (!session) {
      return;
    }

    const manager = String(req.body?.manager ?? "").trim();
    if (!isAdminLogin(manager)) {
      res.status(400).json({ message: "Выберите менеджера из списка" });
      return;
    }

    const partner = await store.setManager(req.params.id, manager, session.login);
    if (!partner) {
      res.status(404).json({ message: "Заявка не найдена" });
      return;
    }

    res.json({ partner: toPublicPartner(partner) });
  });

  app.get("/api/me", async (req, res) => {
    const session = readSession(req);
    if (!session) {
      res.status(401).json({ message: "Нужна авторизация" });
      return;
    }

    const partner = await store.findById(session.partnerId);
    if (!partner) {
      clearSession(req, res);
      res.status(401).json({ message: "Нужна авторизация" });
      return;
    }

    if (loginBlockedMessage(normalizeStatus(partner.status))) {
      clearSession(req, res);
      res.status(401).json({ message: "Нужна авторизация" });
      return;
    }

    const current = (await store.activateCabinet(partner.id)) ?? partner;
    res.json({ partner: toPublicPartner(current) });
  });

  if (options.distDir) {
    app.use(express.static(options.distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(options.distDir!, "index.html"));
    });
  } else if (options.viteOrigin) {
    app.use(proxyToVite(options.viteOrigin));
  }

  return app;
}

export type { PublicPartner };
